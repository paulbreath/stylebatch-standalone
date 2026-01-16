import mysql from 'mysql2/promise';

async function migrate() {
  console.log('🔄 Starting database migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Create connection
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('✅ Connected to database');

    // Create tables manually
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        open_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role ENUM('user', 'admin') DEFAULT 'user',
        login_method VARCHAR(50),
        last_signed_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_open_id (open_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: users');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_quotas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        membership_type ENUM('free', 'monthly', 'quarterly', 'yearly', 'enterprise') DEFAULT 'free',
        membership_expire_at TIMESTAMP NULL,
        total_quota INT DEFAULT 5,
        used_quota INT DEFAULT 0,
        remaining_quota INT DEFAULT 5,
        addon_quota INT DEFAULT 0,
        addon_expire_at TIMESTAMP NULL,
        lifetime_usage INT DEFAULT 0,
        is_tester BOOLEAN DEFAULT FALSE,
        tester_quota INT DEFAULT 0,
        last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: user_quotas');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversion_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        batch_task_id INT NULL,
        original_image_url TEXT NOT NULL,
        converted_image_url TEXT,
        original_file_name VARCHAR(255),
        style_type ENUM('preset', 'custom', 'reference') DEFAULT 'preset',
        style_preset VARCHAR(100),
        style_description TEXT,
        reference_image_url TEXT,
        api_provider ENUM('volcengine', 'replicate', 'gemini', 'seedream', 'nanoBanana') DEFAULT 'volcengine',
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        error_message TEXT,
        cost_amount DECIMAL(10, 4) DEFAULT 0,
        processing_time INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_batch_task_id (batch_task_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: conversion_tasks');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS batch_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_images INT DEFAULT 0,
        completed_images INT DEFAULT 0,
        failed_images INT DEFAULT 0,
        style_type ENUM('preset', 'custom', 'reference') DEFAULT 'preset',
        style_preset VARCHAR(100),
        style_description TEXT,
        reference_image_url TEXT,
        api_provider ENUM('volcengine', 'replicate', 'gemini', 'seedream', 'nanoBanana') DEFAULT 'volcengine',
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        total_cost DECIMAL(10, 4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: batch_tasks');

    await connection.end();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
