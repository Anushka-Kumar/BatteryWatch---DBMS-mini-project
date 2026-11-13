import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { getMongoDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    let query = `
      SELECT
        l.laptop_id, l.user_id, l.brand, l.model, l.os,
        l.purchase_date, l.serial_no,
        b.battery_id, b.type_id, b.initial_capacity,
        b.current_capacity, b.install_date,
        b.health_percentage, b.status
      FROM laptops l
      LEFT JOIN batteries b ON l.laptop_id = b.laptop_id
    `;

    const params: number[] = [];

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
    console.error("Laptops GET error:", error);
    return errorResponse("Unable to fetch laptop records.", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  let connection: any;

  try {
    const body = await request.json();

    const brand = String(body.brand || "").trim();
    const model = String(body.model || "").trim();
    const os = String(body.os || "").trim();
    const serialNo = String(body.serial_no || "").trim();
    const purchaseDate = String(body.purchase_date || "").trim();
    const installDate = String(body.battery_install_date || "").trim();

    const userId =
      auth.user.role === "admin"
        ? Number(body.user_id || auth.user.userId)
        : auth.user.userId;

    const typeId = Number(body.type_id);
    const initialCapacity = Number(body.initial_capacity);
    const currentCapacity = Number(body.current_capacity);

    if (!brand || !model || !os || !serialNo || !purchaseDate) {
      return errorResponse(
        "Brand, model, OS, serial number and purchase date are required.",
        400
      );
    }

    if (
      !Number.isInteger(userId) || userId <= 0 ||
      !Number.isInteger(typeId) || typeId <= 0 ||
      !Number.isFinite(initialCapacity) || initialCapacity <= 0 ||
      !Number.isFinite(currentCapacity) ||
      currentCapacity <= 0 ||
      currentCapacity > initialCapacity ||
      !installDate
    ) {
      return errorResponse("Please provide valid user and battery details.", 400);
    }

    const health = Number(
      ((currentCapacity / initialCapacity) * 100).toFixed(2)
    );

    const status =
      health >= 80 ? "HEALTHY" :
      health >= 60 ? "DEGRADING" : "REPLACE_SOON";

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users]: any = await connection.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [userId]
    );

    if (!users.length) {
      await connection.rollback();
      return errorResponse("Selected user does not exist.", 400);
    }

    const [types]: any = await connection.execute(
      "SELECT type_id FROM battery_type WHERE type_id = ?",
      [typeId]
    );

    if (!types.length) {
      await connection.rollback();
      return errorResponse("Selected battery type does not exist.", 400);
    }

    const [laptopResult]: any = await connection.execute(
      `INSERT INTO laptops
       (user_id, brand, model, os, purchase_date, serial_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, brand, model, os, purchaseDate, serialNo]
    );

    const [batteryResult]: any = await connection.execute(
      `INSERT INTO batteries
       (laptop_id, type_id, initial_capacity, current_capacity,
        install_date, status, health_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        laptopResult.insertId,
        typeId,
        initialCapacity,
        currentCapacity,
        installDate,
        status,
        health,
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Laptop and battery registered successfully.",
      laptop_id: laptopResult.insertId,
      battery_id: batteryResult.insertId,
    }, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();

    console.error("Laptop POST error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return errorResponse("This serial number is already registered.", 409);
    }

    return errorResponse("Unable to register laptop and battery.", 500);
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  let connection: any;

  try {
    const body = await request.json();
    const laptopId = Number(body.laptop_id);

    const brand = String(body.brand || "").trim();
    const model = String(body.model || "").trim();
    const os = String(body.os || "").trim();
    const serialNo = String(body.serial_no || "").trim();
    const purchaseDate = String(body.purchase_date || "").trim();
    const installDate = String(body.battery_install_date || "").trim();

    const typeId = Number(body.type_id);
    const initialCapacity = Number(body.initial_capacity);
    const currentCapacity = Number(body.current_capacity);

    if (!Number.isInteger(laptopId) || laptopId <= 0) {
      return errorResponse("Invalid laptop ID.", 400);
    }

    if (
      !brand || !model || !os || !serialNo || !purchaseDate ||
      !installDate ||
      !Number.isInteger(typeId) || typeId <= 0 ||
      !Number.isFinite(initialCapacity) || initialCapacity <= 0 ||
      !Number.isFinite(currentCapacity) ||
      currentCapacity <= 0 ||
      currentCapacity > initialCapacity
    ) {
      return errorResponse("Please provide all valid laptop and battery details.", 400);
    }

    const health = Number(
      ((currentCapacity / initialCapacity) * 100).toFixed(2)
    );

    const status =
      health >= 80 ? "HEALTHY" :
      health >= 60 ? "DEGRADING" : "REPLACE_SOON";

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let ownershipQuery = `
      SELECT l.laptop_id, l.user_id, b.battery_id
      FROM laptops l
      LEFT JOIN batteries b ON l.laptop_id = b.laptop_id
      WHERE l.laptop_id = ?
    `;

    const ownershipParams: number[] = [laptopId];

    if (auth.user.role !== "admin") {
      ownershipQuery += " AND l.user_id = ?";
      ownershipParams.push(auth.user.userId);
    }

    ownershipQuery += " FOR UPDATE";

    const [rows]: any = await connection.execute(
      ownershipQuery,
      ownershipParams
    );

    if (!rows.length) {
      await connection.rollback();
      return errorResponse("Laptop not found or you do not have permission to edit it.", 404);
    }

    const [types]: any = await connection.execute(
      "SELECT type_id FROM battery_type WHERE type_id = ?",
      [typeId]
    );

    if (!types.length) {
      await connection.rollback();
      return errorResponse("Invalid battery type.", 400);
    }

    const [userRows]: any = await connection.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [auth.user.role === "admin" && body.user_id
        ? Number(body.user_id)
        : rows[0].user_id]
    );

    if (!userRows.length) {
      await connection.rollback();
      return errorResponse("Selected user does not exist.", 400);
    }

    await connection.execute(
      `UPDATE laptops
       SET user_id = ?, brand = ?, model = ?, os = ?,
           purchase_date = ?, serial_no = ?
       WHERE laptop_id = ?`,
      [
        auth.user.role === "admin" && body.user_id
          ? Number(body.user_id)
          : rows[0].user_id,
        brand,
        model,
        os,
        purchaseDate,
        serialNo,
        laptopId,
      ]
    );

    if (rows[0].battery_id) {
      await connection.execute(
        `UPDATE batteries
         SET type_id = ?, initial_capacity = ?, current_capacity = ?,
             install_date = ?, health_percentage = ?, status = ?
         WHERE battery_id = ?`,
        [
          typeId,
          initialCapacity,
          currentCapacity,
          installDate,
          health,
          status,
          rows[0].battery_id,
        ]
      );
    } else {
      await connection.execute(
        `INSERT INTO batteries
         (laptop_id, type_id, initial_capacity, current_capacity,
          install_date, status, health_percentage)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          laptopId,
          typeId,
          initialCapacity,
          currentCapacity,
          installDate,
          status,
          health,
        ]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Laptop and battery updated successfully.",
    });

  } catch (error: any) {
    if (connection) await connection.rollback();

    console.error("Laptop PUT error:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return errorResponse("That serial number is already registered.", 409);
    }

    return errorResponse("Unable to update laptop.", 500);
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  let connection: any;
  let mongoDocuments: any[] = [];
  let mongoDeletionAttempted = false;

  try {
    const { searchParams } = new URL(request.url);
    const laptopId = Number(searchParams.get("laptop_id"));

    if (!Number.isInteger(laptopId) || laptopId <= 0) {
      return errorResponse("Invalid laptop ID.", 400);
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let query = `
      SELECT l.laptop_id, b.battery_id
      FROM laptops l
      LEFT JOIN batteries b ON l.laptop_id = b.laptop_id
      WHERE l.laptop_id = ?
    `;

    const params: number[] = [laptopId];

    if (auth.user.role !== "admin") {
      query += " AND l.user_id = ?";
      params.push(auth.user.userId);
    }

    query += " FOR UPDATE";

    const [rows]: any = await connection.execute(query, params);

    if (!rows.length) {
      await connection.rollback();
      return errorResponse("Laptop not found or you do not have permission to delete it.", 404);
    }

    const batteryId = rows[0].battery_id;

    if (batteryId) {
      // Keep a copy so MongoDB documents can be restored
      // if the MySQL transaction fails.
      const db = await getMongoDb();
      const reports = db.collection("diagnostic_reports");

      mongoDocuments = await reports.find({
        battery_id: Number(batteryId),
      }).toArray();

      mongoDeletionAttempted = true;

      await reports.deleteMany({
        battery_id: Number(batteryId),
      });

      await connection.execute(
        "DELETE FROM charging_session WHERE battery_id = ?",
        [batteryId]
      );

      await connection.execute(
        "DELETE FROM maintenance_record WHERE battery_id = ?",
        [batteryId]
      );

      await connection.execute(
        "DELETE FROM failure_record WHERE battery_id = ?",
        [batteryId]
      );

      await connection.execute(
        "DELETE FROM health_record WHERE battery_id = ?",
        [batteryId]
      );

      await connection.execute(
        "DELETE FROM batteries WHERE battery_id = ?",
        [batteryId]
      );
    }

    await connection.execute(
      "DELETE FROM laptops WHERE laptop_id = ?",
      [laptopId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Laptop and all associated records deleted successfully.",
      deleted_laptop_id: laptopId,
      deleted_battery_id: batteryId || null,
    });

  } catch (error) {
    console.error("Laptop DELETE error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("MySQL rollback error:", rollbackError);
      }
    }

    // Restore MongoDB reports if the MySQL deletion failed.
    if (mongoDeletionAttempted && mongoDocuments.length > 0) {
      try {
        const db = await getMongoDb();
        await db.collection("diagnostic_reports").insertMany(
          mongoDocuments,
          { ordered: false }
        );
      } catch (restoreError) {
        console.error(
          "CRITICAL: MongoDB report restoration failed. Manual recovery required.",
          restoreError
        );
      }
    }

    return errorResponse(
      "Laptop deletion failed. Please check the server logs before retrying.",
      500
    );
  } finally {
    if (connection) connection.release();
  }
}