/**
 * Script to update Supabase database schema
 * Run with: node scripts/update-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function updateSchema() {
  console.log('🚀 Starting schema update...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded successfully');
    console.log(`📊 Executing SQL (${schemaSql.length} characters)...\n`);

    // Execute the schema
    // Note: Supabase's JS client doesn't support multi-statement SQL execution
    // We'll need to split the statements and execute them individually

    // Split SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comment-only statements
      if (statement.trim().startsWith('--')) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct query as fallback
          const { error: queryError } = await supabase.from('_').select('*').limit(0);

          // If exec_sql doesn't exist, we need to use a different approach
          console.log(`⚠️  Statement ${i + 1}: RPC method not available`);
          console.log('   Please run the schema manually in Supabase SQL Editor');
          break;
        }

        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Executed ${i + 1}/${statements.length} statements`);
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Error in statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} statements`);
    }
    console.log('='.repeat(60));

    // Verify the tables were created
    console.log('\n🔍 Verifying database setup...\n');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['brand_kits', 'share_tokens']);

    if (tablesError) {
      console.log('⚠️  Could not verify tables (this is normal)');
      console.log('   Please verify manually in Supabase dashboard');
    } else if (tables && tables.length > 0) {
      console.log('✅ Tables created successfully:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📌 IMPORTANT: Manual Verification Required');
    console.log('='.repeat(60));
    console.log('\nThe Supabase JavaScript client has limitations with DDL statements.');
    console.log('Please manually verify the schema in Supabase SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/abtunlcxubymirloekto/sql/new');
    console.log('2. Copy the contents of supabase-schema.sql');
    console.log('3. Paste and run in the SQL Editor');
    console.log('4. Verify the success message appears\n');

  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
}

// Run the update
updateSchema()
  .then(() => {
    console.log('\n✨ Schema update process completed!');
    console.log('📋 Next steps:');
    console.log('   1. Verify schema in Supabase SQL Editor (see above)');
    console.log('   2. Test sign-up: npm run dev → http://localhost:3000/sign-up');
    console.log('   3. Create a test account');
    console.log('   4. Generate a brand kit\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
