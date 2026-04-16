import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/libs/db';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params; 
    
    // Bersihkan ID dari ekstensi .jpg jika ada
    const id = rawId.split('.')[0];

    // Ambil data dari MySQL
    const [rows]: any = await db.query(
      'SELECT image FROM images WHERE id = ?', 
      [id]
    );

    if (!rows || rows.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { image } = rows[0];
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Clean, 'base64');

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    return new NextResponse('Error: ' + error.message, { status: 500 });
  }
}
