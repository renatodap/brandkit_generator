/**
 * Execute Supabase schema using REST API
 * This is the most reliable way to run DDL statements
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PROJECT_REF = 'abtunlcxubymirloekto'; // From your URL

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function executeSchema() {
  console.log('🚀 Executing Supabase schema...\n');
  console.log(`📡 Project: ${PROJECT_REF}`);
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`📄 Schema loaded (${sql.length} characters)`);
    console.log('⏳ Executing SQL via REST API...\n');

    // Execute SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    // Try alternative endpoint if first fails
    if (!response.ok) {
      console.log('⚠️  Standard endpoint failed, trying SQL endpoint...\n');

      const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sql',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: sql,
      });

      if (!sqlResponse.ok) {
        const errorText = await sqlResponse.text();
        console.error('❌ SQL execution failed');
        console.error('Status:', sqlResponse.status);
        console.error('Response:', errorText);
        console.log('\n' + '='.repeat(60));
        console.log('📋 MANUAL SETUP REQUIRED');
        console.log('='.repeat(60));
        console.log('\nThe REST API approach is not available.');
        console.log('Please run the schema manually:\n');
        printManualInstructions();
        return;
      }

      const result = await sqlResponse.text();
      console.log('✅ Schema executed successfully!');
      console.log('Response:', result);
    } else {
      const result = await response.json();
      console.log('✅ Schema executed successfully!');
      console.log('Result:', result);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Database Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('   1. ✅ Database schema created');
    console.log('   2. 🧪 Test authentication: npm run dev');
    console.log('   3. 🔐 Sign up at: http://localhost:3000/sign-up');
    console.log('   4. 🎨 Generate a brand kit!');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('📋 MANUAL SETUP REQUIRED');
    console.log('='.repeat(60));
    printManualInstructions();
  }
}

function printManualInstructions() {
  console.log('\nPlease run the schema manually in Supabase SQL Editor:\n');
  console.log('STEP 1: Open Supabase SQL Editor');
  console.log('   🔗 https://supabase.com/dashboard/project/abtunlcxubymirloekto/sql/new');
  console.log('\nSTEP 2: Copy schema contents');
  console.log('   📄 File: supabase-schema.sql');
  console.log('\nSTEP 3: Paste and Run');
  console.log('   ▶️  Click "Run" in the SQL Editor');
  console.log('\nSTEP 4: Verify success message');
  console.log('   ✅ Look for "Database schema created successfully!"');
  console.log('\nSTEP 5: Verify tables');
  console.log('   Run this query to confirm:');
  console.log(`
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('brand_kits', 'share_tokens');
  `);
  console.log('\n' + '='.repeat(60) + '\n');
}

// Execute
executeSchema();
