import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'sql.nufat.id',
  user: process.env.DB_USER || 'nufat',
  password: process.env.DB_PASSWORD || 'nufat17a',
  database: 'qccdata',
};

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows]: any = await connection.execute(
      'SELECT id, width, height FROM images ORDER BY id DESC LIMIT 100'
    );

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      }
    });

  } catch (err: any) {
    console.error('[QCC List Error]', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
