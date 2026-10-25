import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/mysql";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT user_id, name, email, password, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const users = rows as Array<{
      user_id: number;
      name: string;
      email: string;
      password: string;
      role: "admin" | "user";
    }>;

    const user = users[0];

    // Do not authenticate the old demo placeholder passwords.
    if (
      !user ||
      !user.password.startsWith("$2") ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role !== "admin" && user.role !== "user") {
      return NextResponse.json(
        { success: false, error: "This account has an invalid role." },
        { status: 403 }
      );
    }

    await createSession({
      userId: Number(user.user_id),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        userId: Number(user.user_id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to log in right now." },
      { status: 500 }
    );
  }
}