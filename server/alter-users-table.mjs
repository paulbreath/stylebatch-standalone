import mysql from 'mysql2/promise';

async function alterUsersTable() {
  console.log('🔄 Starting ALTER TABLE migration for users table...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to database');

    // Check if openId column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'openId'
    `);

    if (columns.length === 0) {
      console.log('➕ Adding openId column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN openId VARCHAR(255) UNIQUE AFTER id
      `);
      console.log('✅ Added openId column');
    } else {
      console.log('ℹ️  openId column already exists');
    }

    // Check if loginMethod column exists
    const [loginMethodColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'loginMethod'
    `);

    if (loginMethodColumns.length === 0) {
      console.log('➕ Adding loginMethod column...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN loginMethod ENUM('local', 'oauth') DEFAULT 'local' NOT NULL AFTER name
      `);
      console.log('✅ Added loginMethod column');
    } else {
      console.log('ℹ️  loginMethod column already exists');
    }

    // Make password column nullable (for OAuth users)
    console.log('🔄 Making password column nullable...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN password VARCHAR(255) NULL
    `);
    console.log('✅ Password column is now nullable');

    // Check if testerNote column exists in user_quotas
    const [testerNoteColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'user_quotas' 
        AND COLUMN_NAME = 'testerNote'
    `);

    if (testerNoteColumns.length === 0) {
      console.log('➕ Adding testerNote column to user_quotas...');
      await connection.execute(`
        ALTER TABLE user_quotas 
        ADD COLUMN testerNote TEXT AFTER testerQuota
      `);
      console.log('✅ Added testerNote column to user_quotas');
    } else {
      console.log('ℹ️  testerNote column already exists in user_quotas');
    }

    await connection.end();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

alterUsersTable();
