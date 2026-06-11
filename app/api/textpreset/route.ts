import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/db';

// GET: Ambil semua preset
export async function GET() {
  try {
    const [rows]: any = await db.query('SELECT * FROM text_presets ORDER BY created_at DESC');
    
    const formattedRows = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      text: row.text,
      fontFamily: row.fontFamily,
      color: row.color,
      effects: typeof row.effects === 'string' ? JSON.parse(row.effects) : row.effects
    }));

    return NextResponse.json(formattedRows, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error('[GET /api/textpreset Error]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah atau edit preset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, text, fontFamily, color, effects } = body;

    if (!id || !name || !text || !fontFamily || !color || !effects) {
      return NextResponse.json({ error: 'Semua parameter (id, name, text, fontFamily, color, effects) wajib diisi ya, Aa.' }, { status: 400 });
    }

    const effectsJson = typeof effects === 'object' ? JSON.stringify(effects) : effects;

    await db.query(`
      INSERT INTO text_presets (id, name, text, fontFamily, color, effects)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      name = VALUES(name), text = VALUES(text), fontFamily = VALUES(fontFamily), color = VALUES(color), effects = VALUES(effects);
    `, [id, name, text, fontFamily, color, effectsJson]);

    return NextResponse.json({ success: true, message: 'Preset berhasil disimpan! ❤️' });
  } catch (error: any) {
    console.error('[POST /api/textpreset Error]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus preset
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Parameter "id" preset yang ingin dihapus wajib ada, Aa.' }, { status: 400 });
    }

    await db.query('DELETE FROM text_presets WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Preset berhasil dihapus! 💔' });
  } catch (error: any) {
    console.error('[DELETE /api/textpreset Error]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
