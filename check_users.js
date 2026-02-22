
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database", err);
        process.exit(1);
    }
});

db.all("SELECT id, username, role FROM users", (err, rows) => {
    if (err) {
        console.error("Error querying database", err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
