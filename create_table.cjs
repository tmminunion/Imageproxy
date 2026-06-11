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
      CREATE TABLE IF NOT EXISTS upload_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_name TEXT NOT NULL,
        file_id TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log("Table upload_logs ensured.");

    await client.query(`ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;`);
    
    // Memastikan Policy Insert & Select ada
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon insert' AND tablename = 'upload_logs'
        ) THEN
          CREATE POLICY "Allow anon insert" ON upload_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon select' AND tablename = 'upload_logs'
        ) THEN
          CREATE POLICY "Allow anon select" ON upload_logs FOR SELECT TO anon, authenticated USING (true);
        END IF;
      END $$;
    `);
    console.log("Policies ensured.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();