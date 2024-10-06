import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PC_STAC_API = "https://planetarycomputer.microsoft.com/api/stac/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  const buffer = 1;
  const bbox = [
    +longitude - buffer,
    +latitude - buffer,
    +longitude + buffer,
    +latitude + buffer,
  ];
  const year = "2024";
  const months = {
    January: "01",
    April: "04",
    July: "07",
    October: "10",
  };

  try {
    const items: Record<string, any> = {};

    for (const [name, number] of Object.entries(months)) {
      const datetime = `${year}-${number}-01T00:00:00Z`; // Use a complete ISO 8601 datetime string
      const searchUrl = `${PC_STAC_API}/search`;
      const response = await axios.post(searchUrl, {
        collections: ["modis-13A1-061"],
        bbox: bbox,
        datetime: datetime,
        limit: 1,
      });

      if (response.data.features.length > 0) {
        items[name] = response.data.features[0];
      }
    }

    // Instead of processing the data here, we'll return the item links
    // and let the client decide how to visualize or further process the data
    const ndviLinks = Object.entries(items).map(([month, item]) => {
      const ndviAsset = item.assets["500m_16_days_NDVI"];
      return {
        month,
        href: ndviAsset.href,
        title: ndviAsset.title,
        // Include any other relevant metadata
        datetime: item.properties.datetime,
      };
    });

    return NextResponse.json({ ndviLinks });
  } catch (error) {
    console.error("Error fetching NDVI data:", error);
    return NextResponse.json(
      { error: "Failed to fetch NDVI data" },
      { status: 500 }
    );
  }
}
