import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY mr.service_date DESC
    `);

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
