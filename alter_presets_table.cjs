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
    // 1. Tambahkan kolom style ke tabel text_presets jika belum ada
    const alterQuery = `
      ALTER TABLE text_presets 
      ADD COLUMN IF NOT EXISTS style VARCHAR(255) DEFAULT 'neon' AFTER name;
    `;
    await db.query(alterQuery);
    console.log('Kolom style berhasil ditambahkan ke tabel text_presets di MariaDB!');

    // 2. Update data preset contoh awal agar memiliki style yang tepat
    await db.query(`
      UPDATE text_presets 
      SET style = 'double-neon' 
      WHERE id = 'cyber-plasma-neon';
    `);
    await db.query(`
      UPDATE text_presets 
      SET style = '3d' 
      WHERE id = 'retro-3d-imperial-gold';
    `);
    console.log('Data preset awal berhasil diperbarui dengan style yang sesuai!');

  } catch (error) {
    console.error('Gagal memperbarui tabel di MySQL:', error.message);
  } finally {
    pool.end();
  }
}

run();
