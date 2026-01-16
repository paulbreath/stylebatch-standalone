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

    // Drop existing tables (in reverse order due to foreign keys)
    await connection.execute(`DROP TABLE IF EXISTS conversion_tasks`);
    await connection.execute(`DROP TABLE IF EXISTS batch_tasks`);
    await connection.execute(`DROP TABLE IF EXISTS user_quotas`);
    await connection.execute(`DROP TABLE IF EXISTS users`);
    console.log('✅ Dropped existing tables');

    // Create tables with camelCase column names to match Drizzle schema
    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(320) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name TEXT,
        role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: users');

    await connection.execute(`
      CREATE TABLE user_quotas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        membershipType ENUM('free', 'monthly', 'quarterly', 'yearly', 'enterprise') DEFAULT 'free' NOT NULL,
        membershipExpireAt TIMESTAMP NULL,
        totalQuota INT DEFAULT 5 NOT NULL,
        usedQuota INT DEFAULT 0 NOT NULL,
        remainingQuota INT DEFAULT 5 NOT NULL,
        addonQuota INT DEFAULT 0 NOT NULL,
        addonExpireAt TIMESTAMP NULL,
        lifetimeUsage INT DEFAULT 0 NOT NULL,
        isTester BOOLEAN DEFAULT FALSE NOT NULL,
        testerQuota INT DEFAULT 0 NOT NULL,
        lastResetAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: user_quotas');

    await connection.execute(`
      CREATE TABLE batch_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        totalImages INT DEFAULT 0 NOT NULL,
        completedImages INT DEFAULT 0 NOT NULL,
        failedImages INT DEFAULT 0 NOT NULL,
        styleType ENUM('preset', 'custom', 'reference') NOT NULL,
        stylePreset VARCHAR(100),
        styleDescription TEXT,
        referenceImageUrl TEXT,
        referenceImageKey VARCHAR(500),
        strength FLOAT DEFAULT 0.75 NOT NULL,
        preserveTransparency INT DEFAULT 0 NOT NULL,
        apiProvider ENUM('volcengine', 'replicate', 'gemini', 'seedream', 'nanoBanana') DEFAULT 'volcengine' NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
        totalCost DECIMAL(10, 4) DEFAULT 0 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (userId),
        INDEX idx_status (status),
        INDEX idx_created_at (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: batch_tasks');

    await connection.execute(`
      CREATE TABLE conversion_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        batchTaskId INT NULL,
        originalImageUrl TEXT NOT NULL,
        originalImageKey VARCHAR(500) NOT NULL,
        originalFileName VARCHAR(255) NOT NULL,
        styleType ENUM('preset', 'custom', 'reference') NOT NULL,
        stylePreset VARCHAR(100),
        styleDescription TEXT,
        referenceImageUrl TEXT,
        referenceImageKey VARCHAR(500),
        strength FLOAT DEFAULT 0.75 NOT NULL,
        preserveTransparency INT DEFAULT 0 NOT NULL,
        originalWidth INT,
        originalHeight INT,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
        errorMessage TEXT,
        resultImageUrl TEXT,
        resultImageKey VARCHAR(500),
        resultWidth INT,
        resultHeight INT,
        apiProvider ENUM('volcengine', 'replicate', 'gemini', 'seedream', 'nanoBanana') DEFAULT 'volcengine' NOT NULL,
        costAmount DECIMAL(10, 4) DEFAULT 0 NOT NULL,
        processingTime INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (batchTaskId) REFERENCES batch_tasks(id) ON DELETE SET NULL,
        INDEX idx_user_id (userId),
        INDEX idx_batch_task_id (batchTaskId),
        INDEX idx_status (status),
        INDEX idx_created_at (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created table: conversion_tasks');

    await connection.end();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
