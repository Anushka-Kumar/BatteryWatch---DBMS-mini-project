
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import pool from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

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

    // Normal users only receive reports for their own laptops.
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
    console.error("Diagnostic reports API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch diagnostic reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    // Only admins can create diagnostic reports.
    if (auth.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Only admins can create diagnostic reports.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const batteryId = Number(body.battery_id);
    const diagnosis = String(body.diagnosis || "").trim();
    const temperatureStatus = String(body.temperature_status || "").trim();
    const riskLevel = String(body.risk_level || "").trim();
    const analysisDate = body.analysis_date;

    const observations = Array.isArray(body.observations)
      ? body.observations.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];

    const recommendations = Array.isArray(body.recommendations)
      ? body.recommendations.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];

    if (
      !Number.isInteger(batteryId) ||
      batteryId <= 0 ||
      !diagnosis ||
      !temperatureStatus ||
      !analysisDate ||
      !Number.isFinite(new Date(analysisDate).getTime()) ||
      !["Low", "Medium", "High", "Critical"].includes(riskLevel) ||
      observations.length === 0 ||
      recommendations.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide all valid diagnostic report details." },
        { status: 400 }
      );
    }

    const [batteryRows]: any = await pool.execute(
      "SELECT battery_id FROM batteries WHERE battery_id = ?",
      [batteryId]
    );

    if (batteryRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "The selected battery does not exist." },
        { status: 404 }
      );
    }

    const db = await getMongoDb();

    const report = {
      battery_id: batteryId,
      diagnosis,
      observations,
      temperature_status: temperatureStatus,
      recommendations,
      analysis_date: String(analysisDate),
      risk_level: riskLevel,
    };

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
