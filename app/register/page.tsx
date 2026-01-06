
'use client';

import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                message.success(data.message || 'Registration successful! Please verify your email.');
                router.push(`/verify?email=${encodeURIComponent(values.email)}`);
            } else {
                message.error(data.error || 'Registration failed');
            }
        } catch (error) {
            message.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md shadow-lg rounded-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-900">Create Account</h1>
                    <p className="text-gray-500">Sign up to get started</p>
                </div>

                <Form
                    name="register"
                    className="register-form"
                    onFinish={onFinish}
                    size="large"
                    layout="vertical"
                >
                    <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Please input your Name!' }]}
                    >
                        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Full Name" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            placeholder="Password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full bg-blue-900 hover:bg-blue-800" loading={loading}>
                            Register
                        </Button>
                    </Form.Item>

                    <div className="text-center">
                        Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-800">Login now</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
