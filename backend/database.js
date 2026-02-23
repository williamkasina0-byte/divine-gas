const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

let db = null;
let pgPool = null;

// Check if we're in production with PostgreSQL
const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

async function getDb() {
  if (isPostgres) {
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false // Required for Render's PostgreSQL
        }
      });
    }
    return pgPool;
  }

  // SQLite fallback for local development
  if (db) return db;

  const dbPath = path.join(__dirname, 'database.sqlite');
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  return db;
}


async function initializeDatabase() {
  const db = await getDb();

  if (isPostgres) {
    // PostgreSQL initialization
    await initializePostgresTables(db);
  } else {
    // SQLite initialization
    await initializeSQLiteTables(db);
  }

  console.log("Database initialized");
  await seedDatabase(db);
}

async function initializePostgresTables(pool) {
  const client = await pool.connect();
  try {
    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        full_name TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        size TEXT NOT NULL,
        price INTEGER NOT NULL,
        deposit INTEGER NOT NULL,
        image TEXT NOT NULL
      )
    `);

    // Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_purchase INTEGER NOT NULL,
        purchase_type TEXT NOT NULL
      )
    `);

    // Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // User Activity Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

async function initializeSQLiteTables(db) {
  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      full_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for Users
  try { await db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'`); } catch (e) { }
  try { await db.exec(`ALTER TABLE users ADD COLUMN full_name TEXT`); } catch (e) { }
  try { await db.exec(`ALTER TABLE users ADD COLUMN phone TEXT`); } catch (e) { }
  try { await db.exec(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch (e) { }

  // Products Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      size TEXT NOT NULL,
      price INTEGER NOT NULL,
      deposit INTEGER NOT NULL,
      image TEXT NOT NULL
    )
  `);

  // Orders Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Migration for Orders
  try { await db.exec(`ALTER TABLE orders ADD COLUMN user_id INTEGER`); } catch (e) { }

  // Order Items Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_purchase INTEGER NOT NULL,
      purchase_type TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  // Settings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // User Activity Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}


async function seedDatabase(db) {
  if (isPostgres) {
    await seedPostgresDatabase(db);
  } else {
    await seedSQLiteDatabase(db);
  }
}

async function seedPostgresDatabase(pool) {
  const client = await pool.connect();
  try {
    // Seed default settings
    const settingsResult = await client.query('SELECT COUNT(*) as count FROM settings');
    if (parseInt(settingsResult.rows[0].count) === 0) {
      const defaultSettings = [
        { key: 'site_name', value: 'DIVINE GAS' },
        { key: 'phone', value: '0795556620' },
        { key: 'whatsapp', value: '254795556620' },
        { key: 'operating_hours', value: 'Open Mon-Sun: 8am - 10pm' },
        { key: 'delivery_guarantee', value: 'Free 15-Min Delivery' }
      ];
      for (const s of defaultSettings) {
        await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
      }
      console.log("Default settings seeded (PostgreSQL)");
    }

    // Seed Admin User
    const adminResult = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['admin', hash, 'admin']
      );
      console.log("Admin user created (PostgreSQL) (username: admin, password: admin123)");
    }

    // Seed Initial Products if empty
    const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
    if (parseInt(productsResult.rows[0].count) === 0) {
      const initialProducts = [
        { id: '1', brand: 'Pro-Gas', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=400' },
        { id: '2', brand: 'Pro-Gas', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=401' },
        { id: '3', brand: 'K-Gas', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=402' },
        { id: '4', brand: 'K-Gas', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=403' }
      ];

      for (const p of initialProducts) {
        await client.query(
          'INSERT INTO products (id, brand, size, price, deposit, image) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.id, p.brand, p.size, p.price, p.deposit, p.image]
        );
      }
      console.log("Initial products seeded (PostgreSQL)");
    }
  } finally {
    client.release();
  }
}

async function seedSQLiteDatabase(db) {
  // Seed default settings
  const settingsCount = await db.get('SELECT count(*) as count FROM settings');
  if (settingsCount.count === 0) {
    const defaultSettings = [
      { key: 'site_name', value: 'DIVINE GAS' },
      { key: 'phone', value: '0795556620' },
      { key: 'whatsapp', value: '254795556620' },
      { key: 'operating_hours', value: 'Open Mon-Sun: 8am - 10pm' },
      { key: 'delivery_guarantee', value: 'Free 15-Min Delivery' }
    ];
    for (const s of defaultSettings) {
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', s.key, s.value);
    }
    console.log("Default settings seeded");
  }
  // Seed Admin User
  const adminExists = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', 'admin', hash, 'admin');
    console.log("Admin user created (username: admin, password: admin123)");
  }

  // Seed Initial Products if empty
  const productsCount = await db.get('SELECT count(*) as count FROM products');
  if (productsCount.count === 0) {
    const initialProducts = [
      { id: '1', brand: 'Pro-Gas', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=400' },
      { id: '2', brand: 'Pro-Gas', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=401' },
      { id: '3', brand: 'K-Gas', size: '6kg', price: 1100, deposit: 3400, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=402' },
      { id: '4', brand: 'K-Gas', size: '13kg', price: 2500, deposit: 6000, image: 'https://images.unsplash.com/photo-1598970434722-5c4c4421e118?auto=format&fit=crop&q=80&w=403' }
    ];

    for (const p of initialProducts) {
      await db.run(
        'INSERT INTO products (id, brand, size, price, deposit, image) VALUES (?, ?, ?, ?, ?, ?)',
        p.id, p.brand, p.size, p.price, p.deposit, p.image
      );
    }
    console.log("Initial products seeded");
  }
}


// Helper function to log user activity
async function logActivity(userId, username, action, details = null, ipAddress = null, userAgent = null) {
  const db = await getDb();
  try {
    if (isPostgres) {
      await db.query(
        'INSERT INTO user_activity (user_id, username, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, username, action, details, ipAddress, userAgent]
      );
    } else {
      await db.run(
        'INSERT INTO user_activity (user_id, username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        userId, username, action, details, ipAddress, userAgent
      );
    }
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}


module.exports = { getDb, initializeDatabase, logActivity };
