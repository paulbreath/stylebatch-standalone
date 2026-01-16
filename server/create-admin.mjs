import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  console.log('🔄 Creating admin user...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const email = 'blockdoginfo@gmail.com';
  const password = 'Admin123456';
  const name = 'Admin';

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to database');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  User already exists, updating...');
      await connection.execute(
        'UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?',
        [hashedPassword, 'admin', name, email]
      );
      console.log('✅ Admin user updated');
    } else {
      // Insert admin user
      const [result] = await connection.execute(
        'INSERT INTO users (email, password, name, role, login_method) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, name, 'admin', 'email']
      );
      console.log('✅ Admin user created with ID:', result.insertId);

      // Create user quota
      await connection.execute(
        'INSERT INTO user_quotas (user_id, membership_type, total_quota, used_quota, remaining_quota) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, 'enterprise', 999999, 0, 999999]
      );
      console.log('✅ Admin quota created (999999 conversions)');
    }

    await connection.end();
    console.log('');
    console.log('🎉 Admin account ready!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('Please login at: https://stylebatch.preview.aliyun-zeabur.cn/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();
