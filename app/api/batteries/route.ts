import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM batteries LIMIT 100"
    );

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Batteries API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch battery records",
      },
      { status: 500 }
    );
  }
}