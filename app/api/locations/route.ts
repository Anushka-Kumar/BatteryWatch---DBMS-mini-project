import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT location_id, name, type, description FROM location ORDER BY location_id"
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Locations API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch locations",
      },
      { status: 500 }
    );
  }
}