const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'sql.nufat.id',
  user: 'nufat',
  password: 'nufat17a',
  database: 'image',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

async function run() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS folder_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        folder_name VARCHAR(255) NOT NULL UNIQUE,
        folder_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);
    console.log('Tabel folder_logs berhasil dibuat di MariaDB/MySQL sql.nufat.id!');
  } catch (error) {
    console.error('Gagal membuat tabel:', error.message);
  } finally {
    pool.end();
  }
}

run();