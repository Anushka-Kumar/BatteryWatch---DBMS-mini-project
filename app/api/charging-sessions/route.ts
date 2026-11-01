import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY cs.start_time DESC
    `);

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
    const body = await request.json();

    const batteryId = Number(body.battery_id);
    const startTime = body.start_time;
    const endTime = body.end_time;
    const startPercentage = Number(body.start_percentage);
    const endPercentage = Number(body.end_percentage);
    const temperature = Number(body.temperature);

    if (
      !Number.isInteger(batteryId) ||
      batteryId <= 0 ||
      !startTime ||
      !endTime ||
      new Date(endTime) <= new Date(startTime) ||
      !Number.isFinite(startPercentage) ||
      !Number.isFinite(endPercentage) ||
      startPercentage < 0 ||
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