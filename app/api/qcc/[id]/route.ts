import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import sharp from 'sharp';

// Database connection for QCC
const dbConfig = {
  host: process.env.DB_HOST || 'sql.nufat.id',
  user: process.env.DB_USER || 'nufat',
  password: process.env.DB_PASSWORD || 'nufat17a',
  database: 'qccdata',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const mode = searchParams.get('mode') || 'view';
    const widthParam = searchParams.get('width');
    const heightParam = searchParams.get('height');

    connection = await mysql.createConnection(dbConfig);

    const [rows]: any = await connection.execute(
      'SELECT image, width, height FROM images WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const { image, width: origWidth, height: origHeight } = rows[0];
    
    // Handle data URI prefix if present
    let base64Data = image;
    let mimeType = 'image/jpeg';
    if (image.startsWith('data:')) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    let imageBuffer = Buffer.from(base64Data, 'base64');

    // Processing with Sharp
    if (mode === 'thumb') {
      const w = widthParam ? parseInt(widthParam) : 200;
      const h = heightParam ? parseInt(heightParam) : 200;
      imageBuffer = await sharp(imageBuffer)
        .resize({ width: w, height: h, fit: 'cover' })
        .toBuffer();
      mimeType = 'image/jpeg';
    } else if (mode === 'resize') {
      const wPercent = widthParam ? parseInt(widthParam) : 50;
      const hPercent = heightParam ? parseInt(heightParam) : wPercent;
      
      const newWidth = Math.round((origWidth || 500) * (wPercent / 100));
      const newHeight = Math.round((origHeight || 500) * (hPercent / 100));
      
      imageBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight)
        .toBuffer();
      mimeType = 'image/jpeg';
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err: any) {
    console.error('[QCC Proxy Error]', err.message);
    return new NextResponse('Internal Error: ' + err.message, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
