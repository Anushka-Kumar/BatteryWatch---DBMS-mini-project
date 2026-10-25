import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        fr.failure_id,
        fr.battery_id,
        l.brand,
        l.model,
        fr.failure_date,
        fr.symptoms,
        fr.cause,
        fr.severity,
        fr.resolved_date
      FROM failure_record fr
      JOIN batteries b ON fr.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
      ORDER BY fr.failure_date DESC
    `);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Failure records API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch failure records",
      },
      { status: 500 }
    );
  }
}
