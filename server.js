require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql.nufat.id',
  user: process.env.DB_USER || 'nufat',
  password: process.env.DB_PASSWORD || 'nufat17a',
  database: process.env.DB_NAME || 'imageNufat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Router Image (Cloned from wabot2 image.js)
app.get('/image/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT image FROM images WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Image not found');

    const base64Image = rows[0].image;
    const imageData = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Length': imageData.length,
    });
    res.end(imageData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Image List API (Cloned from imagelist_nufat.js)
app.get('/api/imagelist', async (req, res) => {
  const { q } = req.query;
  let sql = `
    SELECT p.id, p.imgid, p.filepath, p.thumbnail, p.width, p.height,
           p.album_id, p.album_title, p.tag_title, p.user_nama, p.uploaded_date
    FROM photos p`;
  
  const params = [];
  if (q) {
    sql += ` WHERE p.id LIKE ? OR p.album_title LIKE ? OR p.tag_title LIKE ?`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY p.uploaded_date DESC LIMIT 50`;

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3033;
app.listen(PORT, () => {
  console.log(`Image Proxy Backend running on port ${PORT}`);
});
