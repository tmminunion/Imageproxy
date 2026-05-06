import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    // --- PROSES IMAGE PROXY ---
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const decodedUrl = decodeURIComponent(imageUrl);

    const response = await axios.get(decodedUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    const base64String = Buffer.from(response.data).toString('base64');

    return NextResponse.json({ 
      success: true,
      base64: `data:${contentType};base64,${base64String}` 
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        'Access-Control-Allow-Origin': '*', // Sesuaikan jika perlu limit domain
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error("Error Detail:", error.message);
    return NextResponse.json({ 
      error: 'Fetch failed', 
      details: error.message 
    }, { status: 500 });
  }
}
