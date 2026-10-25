import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/mysql";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 150 || phone.length > 15) {
      return NextResponse.json(
        { success: false, error: "One or more fields are too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters and no more than 72 bytes.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [name, email, phone || null, passwordHash]
    );

    return NextResponse.json(
      { success: true, message: "Account created successfully." },
      { status: 201 }
    );
  } catch (error: unknown) {
    const mysqlError = error as { code?: string };

    if (mysqlError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "An account with this email or phone already exists." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to create the account." },
      { status: 500 }
    );
  }
}