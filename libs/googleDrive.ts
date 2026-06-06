import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Path ke file JSON credential Aa Baim
const CREDENTIALS_PATH = '/home/nunu/Crudensial/nufat-eltijany-6041ec037c3e.json';

let driveClient: any = null;

export async function getDriveClient() {
  if (driveClient) return driveClient;

  try {
    let credentials;

    // Prioritas 1: Ambil dari Environment Variable
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        console.log('Google Drive: Mencoba menggunakan kredensial dari environment variable.');
      } catch (e: any) {
        console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
      }
    }

    // Prioritas 2: Fallback ke file path (Lokal)
    if (!credentials && fs.existsSync(CREDENTIALS_PATH)) {
      try {
        credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        console.log('Google Drive: Mencoba menggunakan kredensial dari file lokal.');
      } catch (e: any) {
        console.error('Error reading credentials file:', e.message);
      }
    }

    if (!credentials) {
      throw new Error('Kredensial Google Service Account tidak ditemukan di .env maupun file lokal.');
    }

    // FIX: Pastikan private_key memiliki format newline yang benar (\n, bukan \\n)
    // Ini sering menyebabkan error "DECODER routines::unsupported" di Node.js/OpenSSL
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error: any) {
    console.error('Error initializing Google Drive client:', error.message);
    throw error;
  }
}
