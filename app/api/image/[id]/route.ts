import { NextResponse } from 'next/server';
import { db } from '@/libs/db';

export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params; 

    // 2. BERSIHKAN ID (Hapus ekstensi jika ada)
    // Misal: "wuuwuej.jpg" menjadi "wuuwuej"
    const id = rawId.split('.')[0];

    // 1. Ambil data dari MySQL
    const [rows] = await db.query(
      'SELECT image FROM images WHERE id = ?', 
      [id]
    );

    if (!rows || rows.length === 0) {
      return new NextResponse('Gambar tidak ditemukan', { status: 404 });
    }

    // Ambil field 'image' dari hasil query
    const { image } = rows[0];

    if (!image) {
      return new NextResponse('Data image kosong', { status: 500 });
    }
    
    // 2. Konversi Base64 ke Buffer
    // DISINI PERBAIKANNYA: Gunakan 'image', bukan 'kolom_base64'
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Clean, 'base64');

    // 3. Kirim Response
    return new NextResponse(imageBuffer, {
      headers: {
        // Karena kamu hanya ambil kolom 'image', kita default ke image/jpeg
        // atau kamu bisa tambah kolom 'mime' di query SQL jika ada
        'Content-Type': 'image/jpeg', 
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error("Database Error:", error.message);
    return new NextResponse('Internal Server Error: ' + error.message, { status: 500 });
  }
}
