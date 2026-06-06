import { NextResponse } from 'next/server';
import { getDriveClient } from '@/libs/googleDrive';

const FOLDER_ID = '16AKtzNn0tTnGq2kDZLqQLNCvfw_BJlqO';

export async function GET() {
  try {
    const drive = await getDriveClient();

    // Query using Service Account
    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, mimeType, thumbnailLink, size)',
      orderBy: 'name',
    });

    const files = response.data.files || [];

    const mappedFiles = files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      src: `/api/drive/${file.id}`,
      thumbnail: file.thumbnailLink
    }));

    return NextResponse.json({
      success: true,
      folderId: FOLDER_ID,
      count: mappedFiles.length,
      data: mappedFiles
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      }
    });

  } catch (err: any) {
    console.error('[Drive Folder List Error]', err.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal mengambil daftar file menggunakan Service Account.',
      details: err.message
    }, { status: 500 });
  }
}
