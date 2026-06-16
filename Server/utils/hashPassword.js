const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function main() {
  const testPassword = 'password123';
  const hashed = await hashPassword(testPassword);
  console.log(`Plain password: ${testPassword}`);
  console.log(`Hashed password: ${hashed}`);
  console.log('\nUse the hashed password above when inserting test data into Users or Admins table.');
}

main().catch(console.error);
