import { NextResponse } from 'next/server';
import { db } from '@/libs/db';
import * as sharpModule from 'sharp';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    let width = null, height = null, filename = "";

    // 1. Parsing URL (thumbnail/500/500/id.jpg)
    if (slug && slug.length >= 4) {
      width = parseInt(slug[1]);
      height = parseInt(slug[2]);
      filename = slug[3];
    } else if (slug) {
      filename = slug[0];
    }

    const id = filename.split('.')[0];

    // 2. Ambil dari MySQL
    const [rows] = await db.query('SELECT image FROM images WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return new NextResponse('Not Found', { status: 404 });

    const { image } = rows[0];
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
    let imageBuffer = Buffer.from(base64Clean, 'base64');

    // 3. Proses Resize dengan Proteksi
    if (width && height && !isNaN(width) && !isNaN(height)) {
      try {
        // Cara akses fungsi sharp yang paling aman
        const sharp = sharpModule.default || sharpModule;
        
        imageBuffer = await sharp(imageBuffer)
          .resize(width, height, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
          
      } catch (sharpError) {
        console.error("Gagal resize, mengirim gambar asli:", sharpError.message);
        // Jika sharp gagal, biarkan imageBuffer tetap berisi gambar asli
      }
    }

    // 4. Kirim Response
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store, must-revalidate', // Matikan cache saat debug
      },
    });

  } catch (error) {
    console.error("API Error:", error.message);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
