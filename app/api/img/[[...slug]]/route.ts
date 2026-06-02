import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/libs/supabase';
import * as sharpModule from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    let width: number | null = null;
    let height: number | null = null;
    let filename = "";

    if (slug && slug.length >= 4) {
      width = parseInt(slug[1]);
      height = parseInt(slug[2]);
      filename = slug[3];
    } else if (slug && slug.length > 0) {
      filename = slug[0];
    } else {
      return new NextResponse('Filename missing', { status: 400 });
    }

    const id = filename.split('.')[0];

    // Ambil data dari Supabase
    const { data, error } = await supabase
      .from('images')
      .select('image')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { image } = data;
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
    let imageBuffer = Buffer.from(base64Clean, 'base64');

    // Proses Resize
    if (width && height && !isNaN(width) && !isNaN(height)) {
      try {
        const sharp: any = sharpModule.default || sharpModule;
        imageBuffer = await sharp(imageBuffer)
          .resize(width, height, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
      } catch (sharpError: any) {
        console.error("Sharp Error:", sharpError.message);
      }
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
