import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

async function ownsFailure(failureId: number, user: any) {
  let query = `
    SELECT fr.failure_id
    FROM failure_record fr
    JOIN batteries b ON fr.battery_id = b.battery_id
    JOIN laptops l ON b.laptop_id = l.laptop_id
    WHERE fr.failure_id = ?
  `;
  const params: number[] = [failureId];

  if (user.role !== "admin") {
    query += " AND l.user_id = ?";
    params.push(user.userId);
  }

  const [rows]: any = await pool.query(query, params);
  return Array.isArray(rows) && rows.length > 0;
}

async function ownsBattery(batteryId: number, user: any) {
  let query = `
    SELECT b.battery_id
    FROM batteries b
    JOIN laptops l ON b.laptop_id = l.laptop_id
    WHERE b.battery_id = ?
  `;
  const params: number[] = [batteryId];

  if (user.role !== "admin") {
    query += " AND l.user_id = ?";
    params.push(user.userId);
  }

  const [rows]: any = await pool.query(query, params);
  return Array.isArray(rows) && rows.length > 0;
}

function validFailure(body: any) {
  const batteryId = Number(body.battery_id);
  const failureDate = String(body.failure_date ?? "");
  const symptoms = String(body.symptoms ?? "").trim();
  const cause = String(body.cause ?? "").trim();
  const severity = String(body.severity ?? "").trim();
  const resolvedDate = body.resolved_date || null;

  if (
    !Number.isInteger(batteryId) ||
    batteryId <= 0 ||
    !failureDate ||
    !Number.isFinite(new Date(failureDate).getTime()) ||
    !symptoms ||
    !cause ||
    !["Low", "Medium", "High", "Critical"].includes(severity) ||
    (resolvedDate && !Number.isFinite(new Date(resolvedDate).getTime()))
  ) {
    return null;
  }

  return { batteryId, failureDate, symptoms, cause, severity, resolvedDate };
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

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
      query += " WHERE l.user_id = ?";
      params.push(auth.user.userId);
    }

    query += " ORDER BY fr.failure_date DESC";

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
    if (auth.error) return auth.error;

    const body = await request.json();
    const data = validFailure(body);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Invalid failure record details" },
        { status: 400 }
      );
    }

    if (!(await ownsBattery(data.batteryId, auth.user))) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO failure_record
       (battery_id, failure_date, symptoms, cause, severity, resolved_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.batteryId,
        data.failureDate,
        data.symptoms,
        data.cause,
        data.severity,
        data.resolvedDate,
      ]
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

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const failureId = Number(
      new URL(request.url).searchParams.get("failure_id")
    );

    if (!Number.isInteger(failureId) || failureId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid failure ID" },
        { status: 400 }
      );
    }

    if (!(await ownsFailure(failureId, auth.user))) {
      return NextResponse.json(
        { success: false, error: "Failure record not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = validFailure(body);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Invalid failure record details" },
        { status: 400 }
      );
    }

    if (!(await ownsBattery(data.batteryId, auth.user))) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    await pool.query(
      `UPDATE failure_record
       SET battery_id = ?, failure_date = ?, symptoms = ?,
           cause = ?, severity = ?, resolved_date = ?
       WHERE failure_id = ?`,
      [
        data.batteryId,
        data.failureDate,
        data.symptoms,
        data.cause,
        data.severity,
        data.resolvedDate,
        failureId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Failure record updated successfully",
    });
  } catch (error) {
    console.error("Failure record PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update failure record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Preserve the existing rule: only admins can resolve failures.
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

    const [rows]: any = await pool.query(
      "SELECT failure_id FROM failure_record WHERE failure_id = ?",
      [failureId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failure record not found" },
        { status: 404 }
      );
    }

    await pool.query(
      `UPDATE failure_record
       SET resolved_date = COALESCE(resolved_date, CURDATE())
       WHERE failure_id = ?`,
      [failureId]
    );

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

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const failureId = Number(
      new URL(request.url).searchParams.get("failure_id")
    );

    if (!Number.isInteger(failureId) || failureId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid failure ID" },
        { status: 400 }
      );
    }

    if (!(await ownsFailure(failureId, auth.user))) {
      return NextResponse.json(
        { success: false, error: "Failure record not found or access denied" },
        { status: 404 }
      );
    }

    await pool.query(
      "DELETE FROM failure_record WHERE failure_id = ?",
      [failureId]
    );

    return NextResponse.json({
      success: true,
      message: "Failure record deleted successfully",
    });
  } catch (error) {
    console.error("Failure record DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete failure record" },
      { status: 500 }
    );
  }
}