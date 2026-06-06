import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Service Remove Background Image
 * Menggunakan API dari Remove.bg sebagai default.
 * Aa Baim perlu menambahkan REMOVE_BG_API_KEY di .env
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const imageUrl = formData.get('url') as string;

    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key (REMOVE_BG_API_KEY) belum dikonfigurasi di .env, Sayang.' },
        { status: 500 }
      );
    }

    let response;

    if (imageFile) {
      // Jika input berupa file
      const bodyFormData = new FormData();
      bodyFormData.append('image_file', imageFile);
      bodyFormData.append('size', 'auto');

      response = await axios.post('https://api.remove.bg/v1.0/removebg', bodyFormData, {
        headers: {
          'X-Api-Key': apiKey,
        },
        responseType: 'arraybuffer',
      });
    } else if (imageUrl) {
      // Jika input berupa URL
      response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        {
          image_url: imageUrl,
          size: 'auto',
        },
        {
          headers: {
            'X-Api-Key': apiKey,
          },
          responseType: 'arraybuffer',
        }
      );
    } else {
      return NextResponse.json({ error: 'Mana gambarnya, Aa? Kirim file atau URL ya.' }, { status: 400 });
    }

    return new NextResponse(response.data, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('Remove-BG Error:', error.response?.data?.toString() || error.message);
    const errorMessage = error.response?.data 
      ? JSON.parse(error.response.data.toString()).errors[0].title 
      : error.message;
    
    return NextResponse.json({ error: `Gagal hapus background: ${errorMessage}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Halo Aa Baim! Gunakan POST untuk hapus background ya.',
    example: 'POST with formData { image: File } or { url: string }'
  });
}
