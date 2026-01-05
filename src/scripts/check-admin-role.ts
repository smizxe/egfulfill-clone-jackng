import { createClient } from '@libsql/client';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'dev.db').replace(/\\/g, '/');
const dbUrl = `file:///${dbPath}`;
const client = createClient({ url: dbUrl });

async function checkAdmin() {
    const result = await client.execute({
        sql: "SELECT * FROM User WHERE email = 'admin@egfulfill.local'",
        args: []
    });
    console.log('Admin User:', result.rows);
}

checkAdmin();
