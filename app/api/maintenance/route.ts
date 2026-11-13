import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    let query = `
      SELECT mr.maintenance_id, mr.battery_id, l.brand, l.model,
        mr.service_date, mr.issue_description, mr.action_taken,
        mr.cost, mr.service_center, mr.location_id, mr.status
      FROM maintenance_record mr
      JOIN batteries b ON mr.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
    `;
    const params: number[] = [];

    if (auth.user.role !== "admin") {
      query += " WHERE l.user_id = ?";
      params.push(auth.user.userId);
    }

    query += " ORDER BY mr.service_date DESC";
    const [rows] = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      count: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Maintenance GET error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch maintenance records." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const batteryId = Number(body.battery_id);
    const serviceDate = body.service_date;
    const issue = String(body.issue_description ?? "").trim();
    const action = String(body.action_taken ?? "").trim();
    const cost = Number(body.cost);
    const serviceCenter = String(body.service_center ?? "").trim();
    const locationId = Number(body.location_id);
    const status = body.status ?? "Pending";

    if (
      !Number.isInteger(batteryId) || batteryId <= 0 ||
      !serviceDate || !Number.isFinite(new Date(serviceDate).getTime()) ||
      !issue || !action || !Number.isFinite(cost) || cost < 0 ||
      !serviceCenter || !Number.isInteger(locationId) || locationId <= 0 ||
      !["Pending", "Completed"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide valid maintenance details." },
        { status: 400 }
      );
    }

    let ownershipQuery = `
      SELECT b.battery_id FROM batteries b
      JOIN laptops l ON b.laptop_id = l.laptop_id
      WHERE b.battery_id = ?
    `;
    const ownershipParams: number[] = [batteryId];

    if (auth.user.role !== "admin") {
      ownershipQuery += " AND l.user_id = ?";
      ownershipParams.push(auth.user.userId);
    }

    const [ownedBatteries]: any = await pool.query(
      ownershipQuery, ownershipParams
    );

    if (!Array.isArray(ownedBatteries) || ownedBatteries.length === 0) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO maintenance_record
       (battery_id, service_date, issue_description, action_taken,
        cost, service_center, location_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [batteryId, serviceDate, issue, action, cost, serviceCenter, locationId, status]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Maintenance record saved successfully.",
        maintenance_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Maintenance POST error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save maintenance record." },
      { status: 500 }
    );
  }
}

// PUT: Edit an existing maintenance record.
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const maintenanceId = Number(
      new URL(request.url).searchParams.get("maintenance_id")
    );
    const body = await request.json();

    const batteryId = Number(body.battery_id);
    const serviceDate = body.service_date;
    const issue = String(body.issue_description ?? "").trim();
    const action = String(body.action_taken ?? "").trim();
    const cost = Number(body.cost);
    const serviceCenter = String(body.service_center ?? "").trim();
    const locationId = Number(body.location_id);
    const status = body.status;

    if (
      !Number.isInteger(maintenanceId) || maintenanceId <= 0 ||
      !Number.isInteger(batteryId) || batteryId <= 0 ||
      !serviceDate || !Number.isFinite(new Date(serviceDate).getTime()) ||
      !issue || !action || !Number.isFinite(cost) || cost < 0 ||
      !serviceCenter || !Number.isInteger(locationId) || locationId <= 0 ||
      !["Pending", "Completed"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide valid maintenance details." },
        { status: 400 }
      );
    }

    let query = `
      UPDATE maintenance_record mr
      JOIN batteries old_b ON mr.battery_id = old_b.battery_id
      JOIN laptops old_l ON old_b.laptop_id = old_l.laptop_id
      JOIN batteries new_b ON new_b.battery_id = ?
      JOIN laptops new_l ON new_b.laptop_id = new_l.laptop_id
      SET mr.battery_id = ?, mr.service_date = ?,
          mr.issue_description = ?, mr.action_taken = ?,
          mr.cost = ?, mr.service_center = ?,
          mr.location_id = ?, mr.status = ?
      WHERE mr.maintenance_id = ?
    `;

    const params: (number | string)[] = [
      batteryId, batteryId, serviceDate, issue, action,
      cost, serviceCenter, locationId, status, maintenanceId,
    ];

    if (auth.user.role !== "admin") {
      query += " AND old_l.user_id = ? AND new_l.user_id = ?";
      params.push(auth.user.userId, auth.user.userId);
    }

    const [result]: any = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found, unchanged, or not authorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Maintenance record updated successfully.",
    });
  } catch (error) {
    console.error("Maintenance PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update maintenance record." },
      { status: 500 }
    );
  }
}

// PATCH: Mark a record as Completed.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const maintenanceId = Number(
      new URL(request.url).searchParams.get("maintenance_id")
    );

    if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid maintenance record ID." },
        { status: 400 }
      );
    }

    let query = `
      UPDATE maintenance_record mr
      JOIN batteries b ON mr.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
      SET mr.status = 'Completed'
      WHERE mr.maintenance_id = ?
    `;
    const params: number[] = [maintenanceId];

    if (auth.user.role !== "admin") {
      query += " AND l.user_id = ?";
      params.push(auth.user.userId);
    }

    const [result]: any = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found or not authorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Maintenance marked as Completed.",
    });
  } catch (error) {
    console.error("Maintenance PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update maintenance status." },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete a maintenance record.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const maintenanceId = Number(
      new URL(request.url).searchParams.get("maintenance_id")
    );

    if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid maintenance record ID." },
        { status: 400 }
      );
    }

    let query = `
      DELETE mr FROM maintenance_record mr
      JOIN batteries b ON mr.battery_id = b.battery_id
      JOIN laptops l ON b.laptop_id = l.laptop_id
      WHERE mr.maintenance_id = ?
    `;
    const params: number[] = [maintenanceId];

    if (auth.user.role !== "admin") {
      query += " AND l.user_id = ?";
      params.push(auth.user.userId);
    }

    const [result]: any = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Record not found or not authorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Maintenance record deleted successfully.",
    });
  } catch (error) {
    console.error("Maintenance DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete maintenance record." },
      { status: 500 }
    );
  }
}