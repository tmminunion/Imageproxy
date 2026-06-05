import { NextResponse } from 'next/server';
import { supabase } from '@/libs/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('svg_gallery')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      }
    });

  } catch (error: any) {
    console.error("SVG List API Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
