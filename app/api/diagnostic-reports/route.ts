import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

async function getReportAccess(reportId: string, user: any) {
  if (!ObjectId.isValid(reportId)) return null;

  const db = await getMongoDb();

  const report = await db.collection("diagnostic_reports").findOne({
    _id: new ObjectId(reportId),
  });

  if (!report) return null;

  const [rows]: any = await pool.query(
    `SELECT b.battery_id, l.user_id
     FROM batteries b
     JOIN laptops l ON b.laptop_id = l.laptop_id
     WHERE b.battery_id = ?`,
    [Number(report.battery_id)]
  );

  if (!Array.isArray(rows) || rows.length === 0) return null;

  if (
    user.role !== "admin" &&
    Number(rows[0].user_id) !== Number(user.userId)
  ) {
    return null;
  }

  return { db, report };
}
function normalizeDate(value: string): string | null {
  const input = value.trim();

  let year: number;
  let month: number;
  let day: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    [year, month, day] = input.split("-").map(Number);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    [day, month, year] = input.split("-").map(Number);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function validateReport(body: any) {
  const batteryId = Number(body.battery_id);
  const diagnosis = String(body.diagnosis ?? "").trim();
  const temperatureStatus = String(body.temperature_status ?? "").trim();

  const rawRiskLevel = String(body.risk_level ?? "").trim();
  const riskLevel =
    rawRiskLevel.charAt(0).toUpperCase() +
    rawRiskLevel.slice(1).toLowerCase();

  const analysisDate = normalizeDate(
    String(body.analysis_date ?? "")
  );

  const observations = Array.isArray(body.observations)
    ? body.observations
        .map((item: unknown) => String(item).trim())
        .filter(Boolean)
    : [];

  const recommendations = Array.isArray(body.recommendations)
    ? body.recommendations
        .map((item: unknown) => String(item).trim())
        .filter(Boolean)
    : [];

  const errors: string[] = [];

  if (!Number.isInteger(batteryId) || batteryId <= 0)
    errors.push("Invalid battery_id");

  if (!diagnosis)
    errors.push("Missing diagnosis");

  if (!temperatureStatus)
    errors.push("Missing temperature_status");

  if (!analysisDate)
    errors.push("Invalid analysis_date");

  if (!["Low", "Medium", "High", "Critical"].includes(riskLevel))
    errors.push("Invalid risk_level");

  if (observations.length === 0)
    errors.push("Observations are empty");

  if (recommendations.length === 0)
    errors.push("Recommendations are empty");

  if (errors.length > 0) {
    console.log("REPORT VALIDATION ERRORS:", errors);
    console.log("RECEIVED BODY:", body);
    return null;
  }

  return {
    battery_id: batteryId,
    diagnosis,
    observations,
    temperature_status: temperatureStatus,
    recommendations,
    analysis_date: analysisDate,
    risk_level: riskLevel,
  };
}


async function checkBatteryAccess(batteryId: number, user: any) {
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

    const db = await getMongoDb();

    let documents = await db
      .collection("diagnostic_reports")
      .find({})
      .toArray();

    const batteryIds = [
      ...new Set(
        documents
          .map((doc) => Number(doc.battery_id))
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];

    const laptopMap = new Map<
      number,
      { brand: string; model: string; user_id: number }
    >();

    if (batteryIds.length > 0) {
      const placeholders = batteryIds.map(() => "?").join(", ");

      const [laptopRows] = await pool.query(
        `SELECT b.battery_id, l.brand, l.model, l.user_id
         FROM batteries b
         JOIN laptops l ON b.laptop_id = l.laptop_id
         WHERE b.battery_id IN (${placeholders})`,
        batteryIds
      );

      for (const row of laptopRows as Array<{
        battery_id: number;
        brand: string;
        model: string;
        user_id: number;
      }>) {
        laptopMap.set(Number(row.battery_id), {
          brand: row.brand,
          model: row.model,
          user_id: Number(row.user_id),
        });
      }
    }

    if (auth.user.role !== "admin") {
      documents = documents.filter((doc) => {
        const laptop = laptopMap.get(Number(doc.battery_id));
        return laptop?.user_id === auth.user.userId;
      });
    }

    const data = documents.map((doc) => {
      const batteryId = Number(doc.battery_id);
      const laptop = laptopMap.get(batteryId);

      return {
        ...doc,
        _id: String(doc._id),
        id: String(doc._id),
        battery_id: doc.battery_id,
        brand: laptop?.brand ?? null,
        model: laptop?.model ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Diagnostic reports GET error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch diagnostic reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    if (auth.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can create diagnostic reports." },
        { status: 403 }
      );
    }

    const body = await request.json();

console.log("EDIT REPORT REQUEST BODY:", body);

const report = validateReport(body);

console.log("VALIDATED REPORT:", report);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Please provide all valid diagnostic report details." },
        { status: 400 }
      );
    }

    const [batteryRows]: any = await pool.query(
      "SELECT battery_id FROM batteries WHERE battery_id = ?",
      [report.battery_id]
    );

    if (!Array.isArray(batteryRows) || batteryRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "The selected battery does not exist." },
        { status: 404 }
      );
    }

    const db = await getMongoDb();

    const result = await db
      .collection("diagnostic_reports")
      .insertOne(report);

    return NextResponse.json({
      success: true,
      id: String(result.insertedId),
      message: "Diagnostic report saved to MongoDB.",
    });
  } catch (error) {
    console.error("Create diagnostic report error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save diagnostic report." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const reportId = request.nextUrl.searchParams.get("id");

    if (!reportId || !ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { success: false, error: "Invalid diagnostic report ID." },
        { status: 400 }
      );
    }

    const access = await getReportAccess(reportId, auth.user);

    if (!access) {
      return NextResponse.json(
        { success: false, error: "Report not found or access denied." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const report = validateReport(body);

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Please provide all valid diagnostic report details." },
        { status: 400 }
      );
    }

    if (!(await checkBatteryAccess(report.battery_id, auth.user))) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to use this battery." },
        { status: 403 }
      );
    }

    await access.db.collection("diagnostic_reports").updateOne(
      { _id: new ObjectId(reportId) },
      { $set: report }
    );

    return NextResponse.json({
      success: true,
      message: "Diagnostic report updated successfully.",
    });
  } catch (error) {
    console.error("Update diagnostic report error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update diagnostic report." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const reportId = request.nextUrl.searchParams.get("id");

    if (!reportId || !ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { success: false, error: "Invalid diagnostic report ID." },
        { status: 400 }
      );
    }

    const access = await getReportAccess(reportId, auth.user);

    if (!access) {
      return NextResponse.json(
        { success: false, error: "Report not found or access denied." },
        { status: 404 }
      );
    }

    await access.db.collection("diagnostic_reports").deleteOne({
      _id: new ObjectId(reportId),
    });

    return NextResponse.json({
      success: true,
      message: "Diagnostic report deleted successfully.",
    });
  } catch (error) {
    console.error("Delete diagnostic report error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to delete diagnostic report." },
      { status: 500 }
    );
  }
}