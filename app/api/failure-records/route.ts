
import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    let query = `
      SELECT
        fr.failure_id,
        fr.battery_id,
        l.brand,
        l.model,
        fr.failure_date,
        fr.symptoms,
        fr.cause,
        fr.severity,
        fr.resolved_date
      FROM failure_record fr
      JOIN batteries b ON fr.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
    `;

    const params: number[] = [];

    if (auth.user.role !== "admin") {
      query += ` WHERE l.user_id = ?`;
      params.push(auth.user.userId);
    }

    query += ` ORDER BY fr.failure_date DESC`;

    const [rows] = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Failure records GET error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch failure records" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const batteryId = Number(body.battery_id);
    const failureDate = body.failure_date;
    const symptoms = String(body.symptoms ?? "").trim();
    const cause = String(body.cause ?? "").trim();
    const severity = String(body.severity ?? "").trim();

    if (
      !Number.isInteger(batteryId) ||
      batteryId <= 0 ||
      !failureDate ||
      !Number.isFinite(new Date(failureDate).getTime()) ||
      !symptoms ||
      !cause ||
      !["Low", "Medium", "High", "Critical"].includes(severity)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid failure record details" },
        { status: 400 }
      );
    }

    let ownershipQuery = `
      SELECT b.battery_id
      FROM batteries b
      JOIN laptops l ON b.laptop_id = l.laptop_id
      WHERE b.battery_id = ?
    `;

    const params: number[] = [batteryId];

    if (auth.user.role !== "admin") {
      ownershipQuery += ` AND l.user_id = ?`;
      params.push(auth.user.userId);
    }

    const [owned]: any = await pool.query(ownershipQuery, params);

    if (!Array.isArray(owned) || owned.length === 0) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO failure_record
       (battery_id, failure_date, symptoms, cause, severity, resolved_date)
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [batteryId, failureDate, symptoms, cause, severity]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Failure record saved successfully",
        failure_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failure record POST error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save failure record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can resolve failure records." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const failureId = Number(body.failure_id);

    if (!Number.isInteger(failureId) || failureId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid failure ID" },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `UPDATE failure_record
       SET resolved_date = CURDATE()
       WHERE failure_id = ? AND resolved_date IS NULL`,
      [failureId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Failure record not found or already resolved." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Failure record resolved successfully",
    });
  } catch (error) {
    console.error("Failure record PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to resolve failure record" },
      { status: 500 }
    );
  }
}
