```javascript
const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";
const dbName = "BatteryWatch_NoSQL";

async function main() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB successfully!");

        const db = client.db(dbName);
        const events = db.collection("battery_events");

        // Sample battery events for demonstration
        const sampleEvents = [
            {
                battery_id: 2,
                event_type: "TEMPERATURE_WARNING",
                severity: "MEDIUM",
                description: "Simulated battery temperature warning for demonstration",
                event_date: new Date("2026-10-25T10:30:00Z"),
                resolved: false
            },
            {
                battery_id: 3,
                event_type: "LOW_BATTERY_HEALTH",
                severity: "HIGH",
                description: "Simulated low battery health event for demonstration",
                event_date: new Date("2026-10-25T11:00:00Z"),
                resolved: false
            }
        ];

        // Insert events only if they do not already exist
        for (const event of sampleEvents) {
            await events.updateOne(
                {
                    battery_id: event.battery_id,
                    event_type: event.event_type,
                    event_date: event.event_date
                },
                { $setOnInsert: event },
                { upsert: true }
            );
        }

        console.log("\n--- ALL BATTERY EVENTS ---");
        console.log(await events.find({}).toArray());

        console.log("\n--- EVENT COUNT ---");
        console.log(await events.countDocuments({}));

        console.log("\n--- EVENTS GROUPED BY SEVERITY ---");
        console.log(
            await events.aggregate([
                {
                    $group: {
                        _id: "$severity",
                        event_count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).toArray()
        );

        console.log("\n--- HIGH-SEVERITY EVENTS ---");
        console.log(
            await events.find({ severity: "HIGH" }).toArray()
        );

        console.log("\n--- UNRESOLVED EVENTS ---");
        console.log(
            await events.find({ resolved: false }).toArray()
        );

        console.log("\n--- EVENTS FOR BATTERY 2 ---");
        console.log(
            await events.find({ battery_id: 2 }).toArray()
        );

        console.log("\n--- CREATING INDEX ---");
        console.log(
            await events.createIndex({ battery_id: 1 })
        );

        console.log("\n--- INDEXES ---");
        console.log(await events.indexes());

        console.log("\n--- BATTERYWATCH EVENTS SCRIPT COMPLETED ---");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

main();
```