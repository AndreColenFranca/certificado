import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Env vars not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const password = '123456';

async function migrateAdmins() {
  console.log('🔄 Starting admin migration...\n');

  try {
    // Get all ADMIN users from auth_users table
    const { data: authUsers, error: fetchError } = await supabase
      .from('auth_users')
      .select('id, email, name, role')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch admins:', fetchError.message);
      process.exit(1);
    }

    console.log(`📊 Found ${authUsers?.length || 0} admin users\n`);

    if (!authUsers || authUsers.length === 0) {
      console.log('ℹ️ No admin users found to migrate');
      process.exit(0);
    }

    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    // For each admin, check if exists in Supabase Auth, if not create
    for (const user of authUsers) {
      try {
        console.log(`⏳ Processing ${user.email}...`);

        // Check if user exists in auth.users
        const { data: existingAuthUser } = await supabase.auth.admin.getUserById(user.id);

        if (existingAuthUser) {
          console.log(`  ↻ User exists, updating password...`);

          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password,
            user_metadata: {
              display_name: user.name,
              role: user.role
            }
          });

          if (updateError) {
            console.error(`  ❌ Failed to update:`, updateError.message);
            errors.push({ email: user.email, error: updateError.message });
            continue;
          }

          console.log(`  ✅ Password updated`);
          updated++;
          continue;
        }

        // User doesn't exist in Supabase Auth, create
        console.log(`  ➕ Creating new user in Supabase Auth...`);
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password,
          user_metadata: {
            display_name: user.name,
            role: user.role
          },
          email_confirm: true
        });

        if (createError) {
          console.error(`  ❌ Failed to create:`, createError.message);
          errors.push({ email: user.email, error: createError.message });
          continue;
        }

        console.log(`  ✅ User created`);
        created++;
      } catch (err: any) {
        console.error(`  ❌ Exception:`, err.message);
        errors.push({ email: user.email, error: err.message });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${created}`);
    console.log(`↻ Updated: ${updated}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️ Errors:');
      errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
    }

    console.log('\n✨ Migration completed!');
    console.log('\n🔑 All admins can now login with password: 123456');
    console.log('\nTry logging in with:');
    authUsers.forEach(u => console.log(`  - Email: ${u.email} | Password: 123456`));

  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateAdmins();
