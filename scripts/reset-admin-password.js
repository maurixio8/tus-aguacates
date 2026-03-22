/**
 * Genera un hash bcrypt y el SQL para resetear la password de un admin.
 * Usage:
 *   node scripts/reset-admin-password.js admin@tusaguacates.com "NuevaClaveSegura!2026"
 */

const bcrypt = require('bcryptjs');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/reset-admin-password.js <email> <new_password>');
  process.exit(1);
}

async function main() {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('\nHash bcrypt generado:\n');
  console.log(passwordHash);

  console.log('\nSQL para Supabase:\n');
  console.log(`UPDATE admin_users
SET password_hash = '${passwordHash}',
    is_active = TRUE,
    updated_at = NOW()
WHERE email = '${normalizedEmail}';`);
}

main().catch((error) => {
  console.error('Error generating password reset SQL:', error);
  process.exit(1);
});
