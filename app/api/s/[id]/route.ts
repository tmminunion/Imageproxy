import { NextResponse } from 'next/server';
import { supabase } from '@/libs/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Hilangkan ekstensi .svg jika ada (misal: 123.svg -> 123)
    const cleanId = id.replace('.svg', '');

    const { data, error } = await supabase
      .from('svg_gallery')
      .select('svg_content')
      .eq('id', cleanId)
      .single();

    if (error || !data) {
      return new NextResponse('SVG Not Found', { status: 404 });
    }

    return new NextResponse(data.svg_content, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error("SVG API Error:", error.message);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
