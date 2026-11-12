import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local or fallback to .env
function loadEnv() {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  const envPath = path.resolve(process.cwd(), '.env');

  let loadedSource = '';

  if (fs.existsSync(envLocalPath)) {
    parseEnvFile(envLocalPath);
    loadedSource = '.env.local';
  } else if (fs.existsSync(envPath)) {
    parseEnvFile(envPath);
    loadedSource = '.env (fallback, .env.local missing)';
  } else {
    loadedSource = 'NONE';
  }

  return loadedSource;
}

function parseEnvFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

async function runCheck() {
  console.log('--- Dakhil-Kharij Sahayak Setup Check ---');
  const envSource = loadEnv();
  console.log(`Environment file loaded: ${envSource}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? 'SET' : 'NOT SET'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'SET' : 'NOT SET'}`);

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('\nFAIL: Missing Supabase environment variables.');
    process.exit(1);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\n--- Running Checks ---');

  // a) Connection works with the service role key
  try {
    const { error } = await adminClient.from('profiles').select('id', { count: 'exact', head: true });
    if (error && error.code === 'PGRST301') {
      console.log('Check a) Service role connection: FAIL - JWT error / invalid service role key');
    } else if (error && error.code !== '42P01') {
      // 42P01 means relation does not exist, but connection itself worked
      // Other database connection or auth errors:
      if (error.message.includes('fetch failed')) {
        console.log(`Check a) Service role connection: FAIL - Connection failed (${error.message})`);
      } else {
        console.log(`Check a) Service role connection: PASS (Connected, response: ${error.message})`);
      }
    } else {
      console.log('Check a) Service role connection: PASS');
    }
  } catch (err: any) {
    console.log(`Check a) Service role connection: FAIL - ${err?.message || err}`);
  }

  // b) Tables exist and can be read: profiles, applications, step_records, audit_events, ai_suggestions
  const requiredTables = ['profiles', 'applications', 'step_records', 'audit_events', 'ai_suggestions'];
  const missingOrUnreadable: string[] = [];

  for (const table of requiredTables) {
    try {
      const { error } = await adminClient.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        missingOrUnreadable.push(`${table} (${error.message})`);
      }
    } catch (err: any) {
      missingOrUnreadable.push(`${table} (${err?.message || err})`);
    }
  }

  if (missingOrUnreadable.length === 0) {
    console.log('Check b) Tables exist and can be read (profiles, applications, step_records, audit_events, ai_suggestions): PASS');
  } else {
    console.log(`Check b) Tables exist and can be read: FAIL - Missing/Unreadable: ${missingOrUnreadable.join(', ')}`);
  }

  // c) Using the ANON key without login: reading applications returns no rows or an error
  try {
    const { data, error } = await anonClient.from('applications').select('*');
    if (error) {
      console.log(`Check c) Anon reading applications rejected/no rows: PASS (Error returned: ${error.message})`);
    } else if (!data || data.length === 0) {
      console.log('Check c) Anon reading applications rejected/no rows: PASS (0 rows returned)');
    } else {
      console.log(`Check c) Anon reading applications rejected/no rows: FAIL (${data.length} rows exposed to anon)`);
    }
  } catch (err: any) {
    console.log(`Check c) Anon reading applications rejected/no rows: PASS (Threw error: ${err?.message || err})`);
  }

  // d) Using the ANON key: an insert into applications is rejected
  try {
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { error } = await anonClient.from('applications').insert({
      id: dummyId,
      case_no: 'TEST-AUDIT-REJECT',
      applicant_name: 'Test',
      transaction_type: 'SALE',
      mauza: 'Test',
      khata_no: '0',
      khesra_no: '0',
      area_decimal: 1.0,
      received_on: '2026-01-01',
      due_on: '2026-01-30',
    });
    if (error) {
      console.log(`Check d) Anon insert into applications rejected: PASS (Rejected with: ${error.message})`);
    } else {
      console.log('Check d) Anon insert into applications rejected: FAIL (Insert unexpectedly succeeded)');
    }
  } catch (err: any) {
    console.log(`Check d) Anon insert into applications rejected: PASS (Exception: ${err?.message || err})`);
  }

  // e) Using the ANON key: calling rpc apply_transition is rejected
  try {
    const { error } = await anonClient.rpc('apply_transition', {
      p_application_id: '00000000-0000-0000-0000-000000000000',
      p_actor_id: '00000000-0000-0000-0000-000000000000',
      p_actor_role: 'revenue_officer',
      p_event: 'FORWARDED',
      p_from: 'SCRUTINY',
      p_to: 'FIELD_ENQUIRY',
      p_new_status: 'IN_PROGRESS',
      p_note: 'Audit check note',
    });
    if (error) {
      console.log(`Check e) Anon rpc apply_transition rejected: PASS (Rejected with: ${error.message})`);
    } else {
      console.log('Check e) Anon rpc apply_transition rejected: FAIL (Rpc unexpectedly succeeded)');
    }
  } catch (err: any) {
    console.log(`Check e) Anon rpc apply_transition rejected: PASS (Exception: ${err?.message || err})`);
  }

  // f) Using the service role: calling rpc apply_transition with a random uuid fails with 'application not found'
  try {
    const randomUuid = 'a0000000-0000-4000-8000-000000000001';
    const { error } = await adminClient.rpc('apply_transition', {
      p_application_id: randomUuid,
      p_actor_id: '00000000-0000-0000-0000-000000000000',
      p_actor_role: 'revenue_officer',
      p_event: 'FORWARDED',
      p_from: 'SCRUTINY',
      p_to: 'FIELD_ENQUIRY',
      p_new_status: 'IN_PROGRESS',
      p_note: 'Audit check note',
    });
    if (error && error.message.includes('application not found')) {
      console.log(`Check f) Service role rpc apply_transition fails with 'application not found': PASS (${error.message})`);
    } else if (error) {
      console.log(`Check f) Service role rpc apply_transition fails with 'application not found': FAIL (Failed with unexpected message: ${error.message})`);
    } else {
      console.log('Check f) Service role rpc apply_transition fails with \'application not found\': FAIL (Call unexpectedly succeeded)');
    }
  } catch (err: any) {
    if (err?.message?.includes('application not found')) {
      console.log(`Check f) Service role rpc apply_transition fails with 'application not found': PASS (${err.message})`);
    } else {
      console.log(`Check f) Service role rpc apply_transition fails with 'application not found': FAIL (Exception: ${err?.message || err})`);
    }
  }

  // g) Counts: profiles (expect 3 after seeding), applications (expect 15 after seeding)
  try {
    const { count: profileCount, error: profileErr } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const { count: appCount, error: appErr } = await adminClient
      .from('applications')
      .select('*', { count: 'exact', head: true });

    if (profileErr || appErr) {
      console.log(`Check g) Counts: FAIL - Error fetching counts (profiles error: ${profileErr?.message}, applications error: ${appErr?.message})`);
    } else {
      const pCount = profileCount ?? 0;
      const aCount = appCount ?? 0;
      const profilesMatch = pCount === 3;
      const appsMatch = aCount === 15;
      const pass = profilesMatch && appsMatch;

      console.log(
        `Check g) Counts: ${pass ? 'PASS' : 'FAIL'} (profiles: ${pCount} [expected 3], applications: ${aCount} [expected 15])`
      );
    }
  } catch (err: any) {
    console.log(`Check g) Counts: FAIL - ${err?.message || err}`);
  }
}

runCheck().catch((err) => {
  console.error('Unexpected check error:', err);
  process.exit(1);
});

