
import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    let query = `
      SELECT b.*
      FROM batteries b
      INNER JOIN laptops l ON b.laptop_id = l.laptop_id
    `;

    const params: number[] = [];

    // Admins can view all batteries.
    // Normal users can view batteries belonging to their own laptops.
    if (auth.user.role !== "admin") {
      query += " WHERE l.user_id = ?";
      params.push(auth.user.userId);
    }

    query += " ORDER BY b.battery_id";

    const [rows]: any = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Batteries API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch battery records.",
      },
      { status: 500 }
    );
  }
}
