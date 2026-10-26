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
      { success: false, error: "Unable to fetch laptop records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const brand =
      typeof body.brand === "string" ? body.brand.trim() : "";
    const model =
      typeof body.model === "string" ? body.model.trim() : "";
    const os = typeof body.os === "string" ? body.os.trim() : "";
    const serial_no =
      typeof body.serial_no === "string" ? body.serial_no.trim() : "";
    const purchase_date =
      typeof body.purchase_date === "string"
        ? body.purchase_date.trim()
        : "";

    const userId = Number(body.user_id);

    if (!brand || !model || !os) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand, model, and operating system are required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid user ID is required to register a laptop.",
        },
        { status: 400 }
      );
    }

    const [userRows] = await pool.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (!Array.isArray(userRows) || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "The selected user does not exist." },
        { status: 400 }
      );
    }

    const [result]: any = await pool.execute(
      `INSERT INTO laptops
        (user_id, brand, model, os, purchase_date, serial_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        brand,
        model,
        os,
        purchase_date || null,
        serial_no,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Laptop saved successfully.",
        laptop_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create laptop error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error: "A laptop with this serial number already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save laptop. Check the server terminal for details.",
      },
      { status: 500 }
    );
  }
}
