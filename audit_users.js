
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'backend', 'database.sqlite');

async function check() {
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log("--- DATABASE USER AUDIT ---");
        const users = await db.all("SELECT id, username, role FROM users");
        console.log(JSON.stringify(users, null, 2));

        const adminUser = users.find(u => u.username === 'admin');
        if (adminUser) {
            console.log(`\nAdmin account found. Current role: [${adminUser.role}]`);
        } else {
            console.log("\nWARNING: No user with username 'admin' found!");
        }

        await db.close();
    } catch (e) {
        console.error("Audit failed:", e);
    }
}

check();
