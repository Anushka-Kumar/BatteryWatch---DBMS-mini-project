import { NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

async function checkOwnership(sessionId: number, user: any) {
  let query = `
    SELECT cs.session_id
    FROM charging_session cs
    JOIN batteries b ON cs.battery_id = b.battery_id
    JOIN laptops l ON b.laptop_id = l.laptop_id
    WHERE cs.session_id = ?
  `;

  const params: number[] = [sessionId];

  if (user.role !== "admin") {
    query += " AND l.user_id = ?";
    params.push(user.userId);
  }

  const [rows]: any = await pool.query(query, params);
  return Array.isArray(rows) && rows.length > 0;
}

function validSession(body: any) {
  const batteryId = Number(body.battery_id);
  const startPercentage = Number(body.start_percentage);
  const endPercentage = Number(body.end_percentage);
  const temperature = Number(body.temperature);
  const cycles = Number(body.charge_cycles ?? 0);

  const startTime = String(body.start_time ?? "");
  const endTime = body.end_time ? String(body.end_time) : null;

  const startDate = new Date(startTime);
  const endDate = endTime ? new Date(endTime) : null;

  if (
    !Number.isInteger(batteryId) ||
    batteryId <= 0 ||
    !startTime ||
    !Number.isFinite(startDate.getTime()) ||
    (endTime && (!endDate || !Number.isFinite(endDate.getTime()) || endDate <= startDate)) ||
    !Number.isFinite(startPercentage) ||
    !Number.isFinite(endPercentage) ||
    startPercentage < 0 ||
    startPercentage > 100 ||
    endPercentage < 0 ||
    endPercentage > 100 ||
    (endTime && endPercentage <= startPercentage) ||
    !Number.isFinite(temperature) ||
    temperature < 0 ||
    temperature > 100 ||
    !Number.isInteger(cycles) ||
    cycles < 0
  ) {
    return null;
  }

  return {
    batteryId,
    startTime: startTime.replace("T", " "),
    endTime: endTime ? endTime.replace("T", " ") : null,
    startPercentage,
    endPercentage,
    temperature,
    cycles,
  };
}

async function checkBatteryOwnership(batteryId: number, user: any) {
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

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    let query = `
      SELECT
        cs.session_id,
        cs.battery_id,
        l.brand,
        l.model,
        cs.start_time,
        cs.end_time,
        cs.start_percentage,
        cs.end_percentage,
        cs.temperature,
        cs.charge_cycles
      FROM charging_session cs
      JOIN batteries b ON cs.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
    `;

    const params: number[] = [];

    if (auth.user.role !== "admin") {
      query += " WHERE l.user_id = ?";
      params.push(auth.user.userId);
    }

    query += " ORDER BY cs.start_time DESC";

    const [rows] = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Charging sessions GET error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch charging sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const data = validSession(body);

    if (!data || !data.endTime) {
      return NextResponse.json(
        { success: false, error: "Invalid charging session data" },
        { status: 400 }
      );
    }

    const ownsBattery = await checkBatteryOwnership(data.batteryId, auth.user);

    if (!ownsBattery) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO charging_session
        (battery_id, start_time, end_time, start_percentage,
         end_percentage, temperature, charge_cycles)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.batteryId,
        data.startTime,
        data.endTime,
        data.startPercentage,
        data.endPercentage,
        data.temperature,
        data.cycles,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Charging session saved successfully",
        session_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Charging sessions POST error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save charging session" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const sessionId = Number(new URL(request.url).searchParams.get("session_id"));

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = validSession(body);

    if (!data || !data.endTime) {
      return NextResponse.json(
        { success: false, error: "Invalid charging session data" },
        { status: 400 }
      );
    }

    const ownsSession = await checkOwnership(sessionId, auth.user);

    if (!ownsSession) {
      return NextResponse.json(
        { success: false, error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    const ownsBattery = await checkBatteryOwnership(data.batteryId, auth.user);

    if (!ownsBattery) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    await pool.query(
      `UPDATE charging_session
       SET battery_id = ?, start_time = ?, end_time = ?,
           start_percentage = ?, end_percentage = ?,
           temperature = ?, charge_cycles = ?
       WHERE session_id = ?`,
      [
        data.batteryId,
        data.startTime,
        data.endTime,
        data.startPercentage,
        data.endPercentage,
        data.temperature,
        data.cycles,
        sessionId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Charging session updated successfully",
    });
  } catch (error) {
    console.error("Charging sessions PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update charging session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const sessionId = Number(body.session_id);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const ownsSession = await checkOwnership(sessionId, auth.user);

    if (!ownsSession) {
      return NextResponse.json(
        { success: false, error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    await pool.query(
      `UPDATE charging_session
       SET end_time = COALESCE(end_time, NOW())
       WHERE session_id = ?`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      message: "Charging session marked as completed",
    });
  } catch (error) {
    console.error("Charging sessions PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to complete charging session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const sessionId = Number(new URL(request.url).searchParams.get("session_id"));

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const ownsSession = await checkOwnership(sessionId, auth.user);

    if (!ownsSession) {
      return NextResponse.json(
        { success: false, error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    await pool.query(
      "DELETE FROM charging_session WHERE session_id = ?",
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      message: "Charging session deleted successfully",
    });
  } catch (error) {
    console.error("Charging sessions DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete charging session" },
      { status: 500 }
    );
  }
}