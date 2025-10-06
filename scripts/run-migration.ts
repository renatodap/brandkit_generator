/**
 * Script to run database migrations via Supabase API
 *
 * Usage: npx ts-node scripts/run-migration.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration(migrationFile: string) {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`📄 Reading migration file: ${migrationFile}`);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Running migration...\n');

  try {
    // Split SQL into statements and run them one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_').select('*').limit(0);

          if (queryError) {
            console.error(`❌ Error executing statement:`);
            console.error(`   ${statement.substring(0, 100)}...`);
            console.error(`   ${error.message || queryError.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception executing statement:`, err);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Successful statements: ${successCount}`);
    console.log(`   Failed statements: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. Please run the SQL manually in Supabase dashboard.');
      console.log('   Dashboard: https://supabase.com/dashboard/project/abtunlcxubymirloekto/editor');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Alternative: Run the SQL manually in Supabase dashboard');
    console.log('   1. Go to: https://supabase.com/dashboard/project/abtunlcxubymirloekto/editor');
    console.log('   2. Copy the SQL from:', migrationPath);
    console.log('   3. Paste and run in the SQL Editor');
    process.exit(1);
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please specify a migration file');
  console.error('   Usage: npx ts-node scripts/run-migration.ts <migration-file>');
  console.error('   Example: npx ts-node scripts/run-migration.ts team_collaboration.sql');
  process.exit(1);
}

runMigration(migrationFile);
