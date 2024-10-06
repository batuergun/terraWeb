import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the JSON body from the request
    const body = await request.json();
    console.log('body', body);

    // Make a request to your FastAPI server
    const fastApiResponse = await fetch('http://localhost:8000/get_ndvi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!fastApiResponse.ok) {
      throw new Error(`FastAPI responded with status: ${fastApiResponse.status}`);
    }

    // Get the JSON response from FastAPI
    const data = await fastApiResponse.json();
    console.log(data);

    // Return the response from FastAPI
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in NDVI API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}