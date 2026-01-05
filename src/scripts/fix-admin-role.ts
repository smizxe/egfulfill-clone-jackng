import { createClient } from '@libsql/client';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'dev.db').replace(/\\/g, '/');
const dbUrl = `file:///${dbPath}`;
const client = createClient({ url: dbUrl });

async function fixAdmin() {
    await client.execute({
        sql: "UPDATE User SET role = 'ADMIN' WHERE email = 'admin@egfulfill.local'",
        args: []
    });
    console.log('Updated admin role to ADMIN');

    const result = await client.execute({
        sql: "SELECT * FROM User WHERE email = 'admin@egfulfill.local'",
        args: []
    });
    console.log('Admin User:', result.rows);
}

fixAdmin();
