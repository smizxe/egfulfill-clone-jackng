const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('=== Email Test Script ===');
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    try {
        // Verify connection
        console.log('\nVerifying SMTP connection...');
        await transporter.verify();
        console.log('✓ SMTP connection verified!');

        // Send test email
        console.log('\nSending test email to:', process.env.GMAIL_USER);
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to self for testing
            subject: 'Test Email - Registration System',
            html: '<h1>Test Email</h1><p>If you see this, email is working!</p>',
        });

        console.log('✓ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('✗ Error:', error.message);
        if (error.code === 'EAUTH') {
            console.log('\n>>> Authentication failed! Please check:');
            console.log('1. GMAIL_USER is correct');
            console.log('2. GMAIL_APP_PASSWORD is a valid App Password (not your regular password)');
            console.log('3. 2-Step Verification is enabled on your Google account');
        }
    }
}

testEmail();
