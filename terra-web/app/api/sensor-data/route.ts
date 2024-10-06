import { NextRequest, NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

type SensorData = {
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
};

const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "your-secret-api-token";

// Initialize the database
async function openDb() {
  return open({
    filename: "./sensor_data.db",
    driver: sqlite3.Database,
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || authHeader !== `Bearer ${API_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sensorData: SensorData = await request.json();
    const { temperature, humidity, latitude, longitude } = sensorData;

    const db = await openDb();

    // Create table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperature REAL,
        humidity REAL,
        latitude REAL,
        longitude REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert the data
    await db.run(
      `
      INSERT INTO sensor_data (temperature, humidity, latitude, longitude)
      VALUES (?, ?, ?, ?)
    `,
      [temperature, humidity, latitude, longitude]
    );

    await db.close();

    return NextResponse.json(
      { message: "Data received and stored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || authHeader !== `Bearer ${API_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await openDb();

    // Get the latest sensor data
    const latestData = await db.get(`
      SELECT * FROM sensor_data
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    await db.close();

    if (latestData) {
      return NextResponse.json(latestData, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "No data available" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve data" },
      { status: 500 }
    );
  }
}
