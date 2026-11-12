
import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) {
      return auth;
    }

    let query = `
      SELECT
        cs.session_id,
        cs.battery_id,
        l.brand,
        l.model,
        cs.start_time,
        cs.end_time,
        cs.start_percentage,
        cs.end_percentage,
        cs.temperature,
        cs.charge_cycles
      FROM charging_session cs
      JOIN batteries b ON cs.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
    `;

    const params: number[] = [];

    if (auth.user.role !== "admin") {
      query += ` WHERE l.user_id = ?`;
      params.push(auth.user.userId);
    }

    query += ` ORDER BY cs.start_time DESC`;

    const [rows] = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Charging sessions API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch charging sessions",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();

    const batteryId = Number(body.battery_id);
    const startTime = body.start_time;
    const endTime = body.end_time;
    const startPercentage = Number(body.start_percentage);
    const endPercentage = Number(body.end_percentage);
    const temperature = Number(body.temperature);

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (
      !Number.isInteger(batteryId) ||
      batteryId <= 0 ||
      !startTime ||
      !endTime ||
      !Number.isFinite(startDate.getTime()) ||
      !Number.isFinite(endDate.getTime()) ||
      endDate <= startDate ||
      !Number.isFinite(startPercentage) ||
      !Number.isFinite(endPercentage) ||
      startPercentage < 0 ||
      startPercentage > 100 ||
      endPercentage > 100 ||
      endPercentage <= startPercentage ||
      !Number.isFinite(temperature) ||
      temperature < 0 ||
      temperature > 100
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid charging session data" },
        { status: 400 }
      );
    }

    // Verify that the battery belongs to the logged-in user.
    // Admins are allowed to use any battery.
    let ownershipQuery = `
      SELECT b.battery_id
      FROM batteries b
      JOIN laptops l ON b.laptop_id = l.laptop_id
      WHERE b.battery_id = ?
    `;

    const ownershipParams: number[] = [batteryId];

    if (auth.user.role !== "admin") {
      ownershipQuery += ` AND l.user_id = ?`;
      ownershipParams.push(auth.user.userId);
    }

    const [ownedBatteries]: any = await pool.query(
      ownershipQuery,
      ownershipParams
    );

    if (!Array.isArray(ownedBatteries) || ownedBatteries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to use this battery.",
        },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO charging_session
        (battery_id, start_time, end_time, start_percentage,
         end_percentage, temperature, charge_cycles)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        batteryId,
        new Date(startTime.replace("T", " ") + ":00"),
        new Date(endTime.replace("T", " ") + ":00"),
        startPercentage,
        endPercentage,
        temperature,
        0,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Charging session saved successfully",
        session_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save charging session:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save charging session to MySQL" },
      { status: 500 }
    );
  }
}
