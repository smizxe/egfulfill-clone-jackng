
'use client';

import React, { useState, Suspense } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { SafetyCertificateOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get('email') || '';

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, email: values.email || emailFromQuery }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                message.success('Verification successful! You can now login.');
                router.push('/login');
            } else {
                message.error(data.error || 'Verification failed');
            }
        } catch (error) {
            message.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg rounded-xl">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-blue-900">Verify Account</h1>
                <p className="text-gray-500">Enter the code sent to your email</p>
            </div>

            <Form
                name="verify"
                className="verify-form"
                onFinish={onFinish}
                size="large"
                layout="vertical"
                initialValues={{ email: emailFromQuery }}
            >
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please input your Email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email" disabled={!!emailFromQuery} />
                </Form.Item>

                <Form.Item
                    name="code"
                    rules={[
                        { required: true, message: 'Please input the verification code!' },
                        { len: 6, message: 'Code must be 6 digits' }
                    ]}
                >
                    <Input prefix={<SafetyCertificateOutlined className="site-form-item-icon" />} placeholder="6-digit Code" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full bg-blue-900 hover:bg-blue-800" loading={loading}>
                        Verify
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}

export default function VerifyPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
