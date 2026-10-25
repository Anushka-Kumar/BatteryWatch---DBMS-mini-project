import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();

  if (auth.error) return auth.error;

  try {
    const [rows] = await pool.execute(
      `SELECT user_id, name, email, phone, role, created_at
       FROM users
       ORDER BY user_id DESC`
    );

    return NextResponse.json({
      success: true,
      users: rows,
    });
  } catch (error) {
    console.error("Admin user-list error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load users." },
      { status: 500 }
    );
  }
}