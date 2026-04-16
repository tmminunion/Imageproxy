import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/libs/db';
import * as sharpModule from 'sharp';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    let width: number | null = null;
    let height: number | null = null;
    let filename = "";

    if (slug && slug.length >= 4) {
      width = parseInt(slug[1]);
      height = parseInt(slug[2]);
      filename = slug[3];
    } else if (slug) {
      filename = slug[0];
    }

    const id = filename.split('.')[0];

    const [rows]: any = await db.query('SELECT image FROM images WHERE id = ?', [id]);
    
    if (!rows || rows.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { image } = rows[0];
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
    let imageBuffer = Buffer.from(base64Clean, 'base64');

    if (width && height && !isNaN(width) && !isNaN(height)) {
      try {
        const sharp: any = sharpModule.default || sharpModule;
        imageBuffer = await sharp(imageBuffer)
          .resize(width, height, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (sharpError: any) {
        console.error("Gagal resize:", sharpError.message);
      }
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
