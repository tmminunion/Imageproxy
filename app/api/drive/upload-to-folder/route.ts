import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import { Readable } from 'stream';
import mysql from 'mysql2/promise';

// Setup database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql.nufat.id',
  user: process.env.DB_USER || 'nufat',
  password: process.env.DB_PASSWORD || 'nufat17a',
  database: process.env.DB_NAME || 'image',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    const userName = formData.get('user') as string || 'direct_upload'; // Opsional untuk log

    if (!file || !folderId) {
      return NextResponse.json({ 
        success: false,
        error: 'Parameter "file" dan "folderId" wajib dikirim, Aa!' 
      }, { status: 400 });
    }

    const drive = await getDriveClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    // Langsung upload ke folderId yang dikirim
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId], 
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    const fileId = response.data.id;

    // Mencatat log ke MariaDB / MySQL
    try {
      await pool.query(
        'INSERT INTO upload_logs (user_name, file_id, folder_id) VALUES (?, ?, ?)',
        [userName, fileId, folderId]
      );
      console.log(`Log upload by ID disimpan -> File: ${fileId}, Folder: ${folderId}`);
    } catch (dbError: any) {
      console.error('[DB Log Error]', dbError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil upload langsung ke folder ID spesifik, Aa!',
      fileId: fileId,
      fileName: response.data.name,
      folderId: folderId
    });

  } catch (error: any) {
    console.error('[Drive Upload By ID Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal upload ke Drive: ' + error.message 
    }, { status: 500 });
  }
}
