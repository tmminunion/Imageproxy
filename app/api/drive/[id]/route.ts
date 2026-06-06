import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import sharp from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const mode = searchParams.get('mode') || 'view';
    const widthParam = searchParams.get('width');
    const heightParam = searchParams.get('height');

    const drive = await getDriveClient();

    // Fetch image from Google Drive using Service Account
    const response = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'stream' }
    );

    // Metadata for content type
    const metadata = await drive.files.get({ fileId: id, fields: 'mimeType' });
    let contentType = (metadata.data.mimeType as string) || 'image/jpeg';

    // Convert stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of (response.data as any)) {
      chunks.push(chunk);
    }
    let imageBuffer: any = Buffer.concat(chunks);

    // Image Processing with Sharp
    if (mode === 'thumb') {
      const w = widthParam ? parseInt(widthParam) : 300;
      const h = heightParam ? parseInt(heightParam) : 300;
      imageBuffer = await sharp(imageBuffer)
        .resize({ width: w, height: h, fit: 'cover' })
        .toBuffer();
      contentType = 'image/jpeg';
    } else if (mode === 'resize') {
      const wPercent = widthParam ? parseInt(widthParam) : 50;
      
      const imgMeta = await sharp(imageBuffer).metadata();
      const newWidth = Math.round((imgMeta.width || 800) * (wPercent / 100));
      
      imageBuffer = await sharp(imageBuffer)
        .resize({ width: newWidth })
        .toBuffer();
      contentType = 'image/jpeg';
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err: any) {
    console.error('[Drive Proxy Error]', err.message);
    
    if (err.code === 404) {
      return new NextResponse('File Google Drive tidak ditemukan.', { status: 404 });
    }
    
    return new NextResponse('Gagal mengambil file dari Google Drive: ' + err.message, { status: 500 });
  }
}
