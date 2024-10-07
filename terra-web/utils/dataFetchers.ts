import axios from "axios";
import type { SensorData } from "@/components/map";

export async function fetchAgricultureData(lat: number, lng: number) {
  try {
    const response = await axios.post("/api/nvdi", {
      params: {
        lat,
        lng,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching agriculture data:", error);
    throw new Error("Failed to fetch agriculture data");
  }
}

export async function generateLandSummary(
  lat: number,
  lng: number,
  agricultureData: Record<string, unknown>,
  sensorData: SensorData | null
) {
  try {
    const response = await fetch("/api/land-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng, agricultureData, sensorData }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate land summary");
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error generating land summary:", error);
    return "Unable to generate land summary at this time.";
  }
}
