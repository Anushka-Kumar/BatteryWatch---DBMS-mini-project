
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [rows] = await pool.query(`
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
      ORDER BY fr.failure_date DESC
    `);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Failure records API error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch failure records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const batteryId = Number(body.battery_id);
    const failureDate = body.failure_date;
    const symptoms = String(body.symptoms || "").trim();
    const cause = String(body.cause || "").trim();
    const severity = String(body.severity || "").trim();

    if (
      !Number.isInteger(batteryId) ||
      batteryId <= 0 ||
      !failureDate ||
      !symptoms ||
      !cause ||
      !["Low", "Medium", "High", "Critical"].includes(severity)
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide valid failure details." },
        { status: 400 }
      );
    }

    const [result]: any = await pool.execute(
      `INSERT INTO failure_record
        (battery_id, failure_date, symptoms, cause, severity, resolved_date)
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [batteryId, failureDate, symptoms, cause, severity]
    );

    return NextResponse.json({
      success: true,
      failure_id: result.insertId,
      message: "Failure record saved successfully.",
    });
  } catch (error) {
    console.error("Create failure record error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save failure record." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const failureId = Number(body.failure_id);

    if (!Number.isInteger(failureId) || failureId <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid failure ID is required." },
        { status: 400 }
      );
    }

    const [result]: any = await pool.execute(
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
      message: "Failure marked as resolved.",
    });
  } catch (error) {
    console.error("Resolve failure error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to resolve failure record." },
      { status: 500 }
    );
  }
}
