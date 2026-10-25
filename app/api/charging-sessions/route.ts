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