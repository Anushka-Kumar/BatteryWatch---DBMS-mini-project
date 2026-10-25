// ============================================
// BatteryWatch - MongoDB NoSQL Operations
// Database: BatteryWatch_NoSQL
// Collection: diagnostic_reports
// ============================================

// Select the project database
db = db.getSiblingDB("BatteryWatch_NoSQL");

// Create the collection if it doesn't exist
if (!db.getCollectionNames().includes("diagnostic_reports")) {
    db.createCollection("diagnostic_reports");
}

const reports = [
    {
        battery_id: 1,
        diagnosis: "Normal battery degradation",
        observations: [
            "Battery health is 85 percent",
            "Current capacity is below initial capacity"
        ],
        temperature_status: "NORMAL",
        recommendations: [
            "Continue monitoring battery health",
            "Avoid prolonged exposure to high temperatures"
        ],
        analysis_date: "2026-10-25",
        risk_level: "LOW"
    },
    {
        battery_id: 2,
        diagnosis: "Reduced battery capacity",
        observations: [
            "Battery health is 70 percent",
            "Battery maintenance may be needed"
        ],
        temperature_status: "ELEVATED",
        recommendations: [
            "Monitor battery temperature",
            "Schedule a battery health inspection"
        ],
        analysis_date: "2026-10-25",
        risk_level: "MEDIUM"
    }
];

// Insert or update reports without creating duplicates
reports.forEach(function (report) {
    db.diagnostic_reports.updateOne(
        { battery_id: report.battery_id },
        { $set: report },
        { upsert: true }
    );
});

print("\n--- ALL DIAGNOSTIC REPORTS ---");
printjson(db.diagnostic_reports.find().toArray());

print("\n--- REPORT COUNT ---");
print(db.diagnostic_reports.countDocuments());

print("\n--- REPORTS GROUPED BY RISK LEVEL ---");
printjson(
    db.diagnostic_reports.aggregate([
        {
            $group: {
                _id: "$risk_level",
                report_count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]).toArray()
);

print("\n--- MEDIUM-RISK REPORTS ---");
printjson(
    db.diagnostic_reports.find({ risk_level: "MEDIUM" }).toArray()
);

print("\n--- BATTERYWATCH MONGODB SCRIPT COMPLETED ---");