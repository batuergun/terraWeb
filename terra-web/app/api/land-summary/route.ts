import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { lat, lng, agricultureData, sensorData } = await request.json();

    console.log("sensorData", sensorData);
    console.log("agricultureData", agricultureData);

    const prompt = `Provide a brief summary of a farmer's land based on the following information:
      Location: Latitude ${lat}, Longitude ${lng}
      Nearby Sensor data: ${JSON.stringify(sensorData)}
      Agriculture data: ${JSON.stringify(agricultureData)}
      
      Please include insights on climate, soil conditions, suitable crops, and any relevant farming recommendations. Make it concise and to the point. Explain it as your target audiance is a farmer.
      At the end of your response, suggest suitable crops and what kind should be avoided as a list.
      `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that provides insights about agricultural land based on weather and soil data. Only a brief summary. No markdown, just plain text with couple sentences.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    });

    const summary = response.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating land summary:", error);
    return NextResponse.json(
      { error: "Unable to generate land summary at this time." },
      { status: 500 }
    );
  }
}
