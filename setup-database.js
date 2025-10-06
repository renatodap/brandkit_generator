#!/usr/bin/env node

/**
 * Setup Supabase Database Schema
 * This script reads supabase-schema.sql and executes it via Supabase API
 */

const fs = require('fs');
const https = require('https');

// Configuration
const PROJECT_REF = 'abtunlcxubymirloekto';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_57a3f9cfc8f946bc64b34537b9bb89520b41e867';
const SCHEMA_FILE = './supabase-schema.sql';

// Read SQL schema
console.log('📖 Reading SQL schema from', SCHEMA_FILE);
const sqlSchema = fs.readFileSync(SCHEMA_FILE, 'utf8');

// Prepare API request
const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
};

const payload = JSON.stringify({
  query: sqlSchema
});

console.log('🚀 Executing SQL schema on Supabase...');

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Database schema executed successfully!');
      console.log('\n📋 Response:', data);
      console.log('\n🎯 Next steps:');
      console.log('  1. Verify tables in Supabase Dashboard → Table Editor');
      console.log('  2. Test authentication at http://localhost:3006/sign-up');
      console.log('  3. Generate a brand kit and check the dashboard');
    } else {
      console.error('❌ Failed to execute schema');
      console.error('Status:', res.statusCode);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(payload);
req.end();
