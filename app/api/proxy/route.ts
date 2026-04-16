import { NextResponse } from 'next/server';
import axios from 'axios';
import { jwtVerify } from 'jose';

// Persiapkan Secret Key (Pastikan ini ada di Environment Variables Vercel)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia_dapur_123');

export async function GET(request: Request) {
  try {
    // --- 1. VALIDASI BEARER TOKEN ---
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verifikasi JWT
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or Expired Token' }, { status: 401 });
    }

    // --- 2. PROSES IMAGE PROXY (LOGIKA LAMA ANDA) ---
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
