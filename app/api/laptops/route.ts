
import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    let query = `
      SELECT
        l.laptop_id,
        l.user_id,
        l.brand,
        l.model,
        l.os,
        l.purchase_date,
        l.serial_no,
        b.battery_id
      FROM laptops l
      LEFT JOIN batteries b ON l.laptop_id = b.laptop_id
    `;

    const params: number[] = [];

    // Admins can see all laptops. Users can see only their own.
    if (auth.user.role !== "admin") {
      query += " WHERE l.user_id = ?";
      params.push(auth.user.userId);
    }

    query += " ORDER BY l.laptop_id";

    const [rows]: any = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Laptops API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch laptop records." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  let connection: any;

  try {
    const body = await request.json();

    const brand =
      typeof body.brand === "string" ? body.brand.trim() : "";
    const model =
      typeof body.model === "string" ? body.model.trim() : "";
    const os =
      typeof body.os === "string" ? body.os.trim() : "";
    const serialNo =
      typeof body.serial_no === "string" ? body.serial_no.trim() : "";
    const purchaseDate =
      typeof body.purchase_date === "string"
        ? body.purchase_date.trim()
        : "";
    const batteryInstallDate =
      typeof body.battery_install_date === "string"
        ? body.battery_install_date.trim()
        : "";

    // Normal users can ONLY register laptops under their own account.
    // Admins may register for another existing user.
    const userId =
      auth.user.role === "admin"
        ? Number(body.user_id || auth.user.userId)
        : auth.user.userId;

    const typeId = Number(body.type_id);
    const initialCapacity = Number(body.initial_capacity);
    const currentCapacity = Number(body.current_capacity);

    if (!brand || !model || !os || !purchaseDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand, model, OS and purchase date are required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(typeId) ||
      typeId <= 0 ||
      !Number.isFinite(initialCapacity) ||
      initialCapacity <= 0 ||
      !Number.isFinite(currentCapacity) ||
      currentCapacity <= 0 ||
      currentCapacity > initialCapacity ||
      !batteryInstallDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide valid user, battery type, capacity and installation date.",
        },
        { status: 400 }
      );
    }

    const healthPercentage = Number(
      ((currentCapacity / initialCapacity) * 100).toFixed(2)
    );

    const batteryStatus =
      healthPercentage >= 80
        ? "HEALTHY"
        : healthPercentage >= 60
          ? "DEGRADING"
          : "REPLACE_SOON";

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [userRows]: any = await connection.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "The selected user does not exist." },
        { status: 400 }
      );
    }

    const [typeRows]: any = await connection.execute(
      "SELECT type_id FROM battery_type WHERE type_id = ?",
      [typeId]
    );

    if (typeRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "The selected battery type does not exist." },
        { status: 400 }
      );
    }

    const [laptopResult]: any = await connection.execute(
      `INSERT INTO laptops
        (user_id, brand, model, os, purchase_date, serial_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        brand,
        model,
        os,
        purchaseDate,
        serialNo || null,
      ]
    );

    const laptopId = laptopResult.insertId;

    const [batteryResult]: any = await connection.execute(
      `INSERT INTO batteries
        (laptop_id, type_id, initial_capacity, current_capacity,
         install_date, status, health_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        laptopId,
        typeId,
        initialCapacity,
        currentCapacity,
        batteryInstallDate,
        batteryStatus,
        healthPercentage,
      ]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Laptop and battery registered successfully.",
        laptop_id: laptopId,
        battery_id: batteryResult.insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Create laptop and battery error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error: "A laptop with this serial number or battery assignment already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to register laptop and battery.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
