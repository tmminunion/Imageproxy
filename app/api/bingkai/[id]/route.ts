import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import sharp from 'sharp';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69c968e300202231f91d';
const APPWRITE_BUCKET_ID = '6a21f5aa00234850f8e6';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Check for mode: view, thumb, or resize
    const mode = searchParams.get('mode') || 'view';
    const widthParam = searchParams.get('width');
    const heightParam = searchParams.get('height');

    const url = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${id}/view?project=${APPWRITE_PROJECT_ID}`;
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    let imageBuffer: any = Buffer.from(response.data);
    let contentType = (response.headers['content-type'] as string) || 'image/png';

    // Handle Thumbnail Mode
    if (mode === 'thumb') {
      const w = widthParam ? parseInt(widthParam) : 200;
      const h = heightParam ? parseInt(heightParam) : 200;
      
      imageBuffer = await sharp(imageBuffer)
        .resize({ width: w, height: h, fit: 'cover' })
        .toBuffer();
      contentType = 'image/jpeg';
    } 
    // Handle Percentage Resize Mode
    else if (mode === 'resize') {
      const wPercent = widthParam ? parseInt(widthParam) : 50;
      const hPercent = heightParam ? parseInt(heightParam) : wPercent;
      
      const metadata = await sharp(imageBuffer).metadata();
      const newWidth = Math.round((metadata.width || 500) * (wPercent / 100));
      const newHeight = Math.round((metadata.height || 500) * (hPercent / 100));
      
      imageBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight)
        .toBuffer();
      contentType = 'image/jpeg';
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err: any) {
    console.error('[Proxy Appwrite Image Error]', err.message);
    return new NextResponse('Error proxying image from Appwrite: ' + err.message, { status: 500 });
  }
}
