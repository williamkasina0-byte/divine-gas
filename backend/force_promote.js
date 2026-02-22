
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function promote() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log("--- PROMOTING ADMIN ACCOUNT ---");
    const result = await db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'");

    if (result.changes > 0) {
        console.log("SUCCESS: 'admin' account has been promoted to 'admin' role.");
    } else {
        console.log("FAILED: No account with username 'admin' found to promote.");
    }

    const users = await db.all("SELECT id, username, role FROM users WHERE username = 'admin'");
    console.log("Current status:", JSON.stringify(users, null, 2));

    await db.close();
}

promote();
