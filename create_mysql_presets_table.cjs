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
      CREATE TABLE IF NOT EXISTS text_presets (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        fontFamily VARCHAR(255) NOT NULL,
        color VARCHAR(255) NOT NULL,
        effects JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);
    console.log('Tabel text_presets berhasil dibuat di MariaDB/MySQL sql.nufat.id!');

    const initialPresets = [
      {
        "id": "cyber-plasma-neon",
        "name": "Cyber Plasma Neon",
        "text": "NEON SOUL",
        "fontFamily": "Orbitron",
        "color": "#ffffff",
        "effects": JSON.stringify({
          "fillType": "gradient",
          "gradient": {
            "type": "linear",
            "angle": 45,
            "stops": [
              { "offset": 0, "color": "#00f2fe" },
              { "offset": 50, "color": "#a855f7" },
              { "offset": 100, "color": "#f43f5e" }
            ]
          },
          "stroke": {
            "color": "#09090b",
            "width": 3
          },
          "shadows": [
            { "x": 0, "y": 0, "blur": 8, "color": "#00f2fe" },
            { "x": 0, "y": 0, "blur": 20, "color": "#a855f7" },
            { "x": 3, "y": 3, "blur": 0, "color": "#09090b" }
          ],
          "letterSpacing": 3,
          "textTransform": "uppercase"
        })
      },
      {
        "id": "retro-3d-imperial-gold",
        "name": "Imperial Gold 3D",
        "text": "PRESTIGE",
        "fontFamily": "Bebas Neue",
        "color": "#ffd700",
        "effects": JSON.stringify({
          "fillType": "solid",
          "stroke": {
            "color": "#000000",
            "width": 1.5
          },
          "shadows": [
            { "x": 1, "y": 1, "blur": 0, "color": "#b59410" },
            { "x": 2, "y": 2, "blur": 0, "color": "#947603" },
            { "x": 3, "y": 3, "blur": 0, "color": "#705800" },
            { "x": 4, "y": 4, "blur": 0, "color": "#4a3a00" },
            { "x": 5, "y": 5, "blur": 4, "color": "rgba(0,0,0,0.6)" }
          ],
          "letterSpacing": 5,
          "textTransform": "uppercase"
        })
      }
    ];

    for (const preset of initialPresets) {
      await db.query(`
        INSERT INTO text_presets (id, name, text, fontFamily, color, effects)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        name = VALUES(name), text = VALUES(text), fontFamily = VALUES(fontFamily), color = VALUES(color), effects = VALUES(effects);
      `, [preset.id, preset.name, preset.text, preset.fontFamily, preset.color, preset.effects]);
    }
    console.log('Data preset awal berhasil dimasukkan/diperbarui di MariaDB/MySQL!');
    
  } catch (error) {
    console.error('Gagal memproses tabel di MySQL:', error.message);
  } finally {
    pool.end();
  }
}

run();
