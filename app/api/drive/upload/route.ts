import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import { Readable } from 'stream';
import mysql from 'mysql2/promise';

const ROOT_FOLDER_ID = '16AKtzNn0tTnGq2kDZLqQLNCvfw_BJlqO';

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

// Fungsi untuk mencari atau membuat folder di Google Drive
async function getOrCreateFolder(drive: any, folderName: string, parentId: string) {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
  
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const createRes = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return createRes.data.id;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userName = formData.get('user') as string;

    if (!file) {
      return NextResponse.json({ error: 'Mana filenya, Aa?' }, { status: 400 });
    }

    const drive = await getDriveClient();

    let targetFolderId = ROOT_FOLDER_ID;
    
    if (userName) {
       const UPLOAD_USER_FOLDER_ID = '1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u';
       targetFolderId = await getOrCreateFolder(drive, userName, UPLOAD_USER_FOLDER_ID);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [targetFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    const fileId = response.data.id;
    const finalUserName = userName || 'default';

    // Mencatat log ke MariaDB / MySQL
    try {
      await pool.query(
        'INSERT INTO upload_logs (user_name, file_id, folder_id) VALUES (?, ?, ?)',
        [finalUserName, fileId, targetFolderId]
      );
      console.log(`Log upload disimpan: ${finalUserName} -> File: ${fileId}, Folder: ${targetFolderId}`);
    } catch (dbError: any) {
      console.error('[DB Log Error]', dbError.message);
      // Lanjutkan tanpa menggagalkan upload
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil upload ke Google Drive & Log dicatat, Aa!',
      fileId: fileId,
      fileName: response.data.name,
      folderId: targetFolderId,
      user: finalUserName
    });

  } catch (error: any) {
    console.error('[Drive Upload Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal upload ke Drive: ' + error.message 
    }, { status: 500 });
  }
}
