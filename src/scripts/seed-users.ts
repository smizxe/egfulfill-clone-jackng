import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@libsql/client';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Direct LibSQL Client
const dbPath = path.resolve(process.cwd(), 'dev.db').replace(/\\/g, '/');
const dbUrl = `file:///${dbPath}`;
console.log('Using DB:', dbUrl);

const client = createClient({
    url: dbUrl,
});

async function seedUsers() {
    console.log('Seeding default users...');

    try {
        // Create a default admin user
        const adminId = uuidv4();
        const adminEmail = 'admin@egfulfill.local';
        const now = new Date().toISOString();

        // Check if admin exists
        const existingAdmin = await client.execute({
            sql: 'SELECT * FROM User WHERE email = ?',
            args: [adminEmail]
        });

        if (existingAdmin.rows.length === 0) {
            await client.execute({
                sql: `INSERT INTO User (id, email, password, name, balance, role, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [adminId, adminEmail, 'admin123', 'Admin User', 1000.0, 'ADMIN', now, now]
            });
            console.log('✅ Admin user created:');
        } else {
            console.log('✅ Admin user already exists:');
        }
        console.log('   Email:', adminEmail);
        console.log('   Password: admin123');
        console.log('   Balance: $1000');

        // Create test user
        const userId = uuidv4();
        const userEmail = 'user@egfulfill.local';

        const existingUser = await client.execute({
            sql: 'SELECT * FROM User WHERE email = ?',
            args: [userEmail]
        });

        if (existingUser.rows.length === 0) {
            await client.execute({
                sql: `INSERT INTO User (id, email, password, name, balance, role, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [userId, userEmail, 'user123', 'Test User', 50.0, 'USER', now, now]
            });
            console.log('✅ Test user created:');
        } else {
            console.log('✅ Test user already exists:');
        }
        console.log('   Email:', userEmail);
        console.log('   Password: user123');
        console.log('   Balance: $50');

        console.log('\n🎉 Seeding complete! You can now login with either account.');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedUsers();

