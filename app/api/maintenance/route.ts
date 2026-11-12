
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
        mr.maintenance_id,
        mr.battery_id,
        l.brand,
        l.model,
        mr.service_date,
        mr.issue_description,
        mr.action_taken,
        mr.cost,
        mr.service_center,
        mr.location_id
      FROM maintenance_record mr
      JOIN batteries b ON mr.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
    `;

    const params: number[] = [];

    if (auth.user.role !== "admin") {
      query += ` WHERE l.user_id = ?`;
      params.push(auth.user.userId);
    }

    query += ` ORDER BY mr.service_date DESC`;

    const [rows] = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Maintenance API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch maintenance records",
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
    const serviceDate = body.service_date;
    const issue = String(body.issue_description ?? "").trim();
    const action = String(body.action_taken ?? "").trim();
    const cost = Number(body.cost);
    const serviceCenter = String(body.service_center ?? "").trim();
    const locationId = Number(body.location_id);

    if (
      !Number.isInteger(batteryId) ||
      batteryId <= 0 ||
      !serviceDate ||
      !Number.isFinite(new Date(serviceDate).getTime()) ||
      !issue ||
      !action ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      !serviceCenter ||
      !Number.isInteger(locationId) ||
      locationId <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide valid maintenance details." },
        { status: 400 }
      );
    }

    // Check whether the battery belongs to this user.
    // Admins can use any registered battery.
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
      `INSERT INTO maintenance_record
        (battery_id, service_date, issue_description, action_taken,
         cost, service_center, location_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        batteryId,
        serviceDate,
        issue,
        action,
        cost,
        serviceCenter,
        locationId,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Maintenance record saved to MySQL.",
        maintenance_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save maintenance record:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save maintenance record to MySQL." },
      { status: 500 }
    );
  }
}
