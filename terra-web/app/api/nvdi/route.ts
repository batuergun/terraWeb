import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the JSON body from the request
    const body = await request.json();
    console.log('Received body:', body);

    // Extract latitude and longitude from the params object
    const { lat, lng } = body.params;

    // Ensure lat and lng are present
    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
    }

    // Construct the payload for the FastAPI server
    const payload = {
      latitude: lat,
      longitude: lng,
    };

    console.log('Sending payload to FastAPI:', payload);

    // Make a request to your FastAPI server
    const fastApiResponse = await fetch('https://api.costerra.co/v1/get_ndvi', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COSTERRA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!fastApiResponse.ok) {
      const errorData = await fastApiResponse.json();
      console.error('FastAPI error:', errorData);
      throw new Error(`FastAPI responded with status: ${fastApiResponse.status}`);
    }

    // Get the JSON response from FastAPI
    const data = await fastApiResponse.json();
    console.log('FastAPI response:', data);

    // Return the response from FastAPI
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in NDVI API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}