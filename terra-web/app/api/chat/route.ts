import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, landSummary, selectedCoordinates, sensorData } =
      await req.json();

    const systemMessage = {
      role: "system",
      content: `You are an AI assistant specializing in agricultural land information. Use the following context to answer questions:
      Land Summary: ${landSummary}
      Selected Coordinates: Latitude ${selectedCoordinates[1]}, Longitude ${
        selectedCoordinates[0]
      }
      ${
        sensorData
          ? `Nearby Sensor Data: Temperature ${sensorData.temperature}°C, Humidity ${sensorData.humidity}%`
          : "No nearby sensor data available."
      }
      Provide helpful and accurate information based on this context.`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [systemMessage, ...messages],
      max_tokens: 150,
    });

    const aiMessage = response.choices[0].message.content;

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
