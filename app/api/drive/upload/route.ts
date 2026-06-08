import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';
import { Readable } from 'stream';

const ROOT_FOLDER_ID = '16AKtzNn0tTnGq2kDZLqQLNCvfw_BJlqO';

// Fungsi untuk mencari atau membuat folder di Google Drive
async function getOrCreateFolder(drive: any, folderName: string, parentId: string) {
  // Cari folder berdasarkan nama dan parent
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
  
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    // Folder sudah ada
    return res.data.files[0].id;
  }

  // Jika tidak ada, buat folder baru
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
    const userName = formData.get('user') as string; // Ambil parameter nama user/folder

    if (!file) {
      return NextResponse.json({ error: 'Mana filenya, Aa?' }, { status: 400 });
    }

    const drive = await getDriveClient();

    // Tentukan folder target (ROOT atau Folder spesifik User)
    let targetFolderId = ROOT_FOLDER_ID;
    
    if (userName) {
       // Folder 'upload_user' yang sudah dibuat manual oleh Aa Baim
       const UPLOAD_USER_FOLDER_ID = '1YIbOS3CAVThIkFBp-BRfvtadZObmeL2u';
       
       // Cari atau buat folder atas nama user di dalam 'upload_user'
       targetFolderId = await getOrCreateFolder(drive, userName, UPLOAD_USER_FOLDER_ID);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [targetFolderId], // Upload ke target folder
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil upload ke Google Drive, Aa!',
      fileId: response.data.id,
      fileName: response.data.name,
      folderId: targetFolderId,
      user: userName || 'default'
    });

  } catch (error: any) {
    console.error('[Drive Upload Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal upload ke Drive: ' + error.message 
    }, { status: 500 });
  }
}
