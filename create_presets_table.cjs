const { Client } = require('pg');

const client = new Client({
  host: 'db.klzrpcjaahloeupfctce.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ALLnew212',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS text_presets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        text TEXT NOT NULL,
        font_family TEXT NOT NULL,
        color TEXT NOT NULL,
        effects JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log("Table text_presets ensured.");

    await client.query(`ALTER TABLE text_presets ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon insert' AND tablename = 'text_presets'
        ) THEN
          CREATE POLICY "Allow anon insert" ON text_presets FOR INSERT TO anon, authenticated WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon select' AND tablename = 'text_presets'
        ) THEN
          CREATE POLICY "Allow anon select" ON text_presets FOR SELECT TO anon, authenticated USING (true);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon update' AND tablename = 'text_presets'
        ) THEN
          CREATE POLICY "Allow anon update" ON text_presets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon delete' AND tablename = 'text_presets'
        ) THEN
          CREATE POLICY "Allow anon delete" ON text_presets FOR DELETE TO anon, authenticated USING (true);
        END IF;
      END $$;
    `);
    console.log("Policies ensured.");

    // Insert initial sample data
    const initialPresets = [
      {
        "id": "cyber-plasma-neon",
        "name": "Cyber Plasma Neon",
        "text": "NEON SOUL",
        "font_family": "Orbitron",
        "color": "#ffffff",
        "effects": {
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
        }
      },
      {
        "id": "retro-3d-imperial-gold",
        "name": "Imperial Gold 3D",
        "text": "PRESTIGE",
        "font_family": "Bebas Neue",
        "color": "#ffd700",
        "effects": {
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
        }
      }
    ];

    for (const preset of initialPresets) {
      await client.query(`
        INSERT INTO text_presets (id, name, text, font_family, color, effects)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, text = EXCLUDED.text, font_family = EXCLUDED.font_family, color = EXCLUDED.color, effects = EXCLUDED.effects;
      `, [preset.id, preset.name, preset.text, preset.font_family, preset.color, JSON.stringify(preset.effects)]);
    }
    console.log("Initial sample data inserted/updated.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
