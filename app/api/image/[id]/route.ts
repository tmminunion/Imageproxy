import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/libs/supabase';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params; 
    
    // Bersihkan ID dari ekstensi .jpg jika ada
    const id = rawId.split('.')[0];

    // Ambil data dari Supabase
    const { data, error } = await supabase
      .from('images')
      .select('image')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Supabase error:', error);
      return new NextResponse('Not Found', { status: 404 });
    }

    const { image } = data;
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Clean, 'base64');

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    return new NextResponse('Error: ' + error.message, { status: 500 });
  }
}
