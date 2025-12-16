// Database migration script to add genre_confidence column
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
    path.join(__dirname, 'history.db'),
    (err) => {
        if (err) {
            console.error('❌ Database connection error:', err.message);
            process.exit(1);
        } else {
            console.log('✅ Connected to database');
        }
    }
);

// Add genre_confidence column
db.run(
    `ALTER TABLE history ADD COLUMN genre_confidence REAL DEFAULT 0.0`,
    (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️  Column genre_confidence already exists');
            } else {
                console.error('❌ Migration error:', err.message);
                db.close();
                process.exit(1);
            }
        } else {
            console.log('✅ Successfully added genre_confidence column');
        }

        // Verify the schema
        db.all(`PRAGMA table_info(history)`, [], (err, rows) => {
            if (err) {
                console.error('❌ Error reading schema:', err.message);
            } else {
                console.log('\n📋 Current table schema:');
                rows.forEach(col => {
                    console.log(`  - ${col.name} (${col.type})`);
                });
            }

            db.close(() => {
                console.log('\n✅ Migration complete! Database closed.');
            });
        });
    }
);
