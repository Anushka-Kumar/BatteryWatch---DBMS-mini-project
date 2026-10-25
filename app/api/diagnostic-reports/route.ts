import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const db = await getMongoDb();

    const documents = await db
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

    let laptopMap = new Map<number, { brand: string; model: string }>();

    if (batteryIds.length > 0) {
      const placeholders = batteryIds.map(() => "?").join(", ");

      const [laptopRows] = await pool.query(
        `
          SELECT
            b.battery_id,
            l.brand,
            l.model
          FROM batteries b
          JOIN laptops l ON b.laptop_id = l.laptop_id
          WHERE b.battery_id IN (${placeholders})
        `,
        batteryIds
      );

      for (const row of laptopRows as Array<{
        battery_id: number;
        brand: string;
        model: string;
      }>) {
        laptopMap.set(Number(row.battery_id), {
          brand: row.brand,
          model: row.model,
        });
      }
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
      {
        success: false,
        error: "Unable to fetch diagnostic reports",
      },
      { status: 500 }
    );
  }
}