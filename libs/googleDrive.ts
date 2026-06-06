import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Path ke file JSON credential Aa Baim di Termux
const CREDENTIALS_PATH = '/data/data/com.termux/files/home/Crudensial/nufat-eltijany-6041ec037c3e.json';

let driveClient: any = null;

export async function getDriveClient() {
  if (driveClient) return driveClient;

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error: any) {
    console.error('Error initializing Google Drive client:', error.message);
    
    // Fallback untuk Vercel (pakai ENV jika file tidak ada)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        driveClient = google.drive({ version: 'v3', auth });
        return driveClient;
    }
    
    throw error;
  }
}
