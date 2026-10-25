import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        laptop_id,
        user_id,
        brand,
        model,
        os,
        purchase_date,
        serial_no
      FROM laptops
      ORDER BY laptop_id
    `);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Laptops API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch laptop records",
      },
      { status: 500 }
    );
  }
}