'use client';

import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50/50 to-sky-100/50 dark:from-slate-900 dark:to-slate-800">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            <div className="glass-panel w-full max-w-md shadow-2xl rounded-2xl p-8 relative z-10 mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent mb-2">
                        Create Account
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Sign up to get started
                    </p>
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
                        <Input
                            prefix={<UserOutlined className="text-zinc-400" />}
                            placeholder="Full Name"
                            className="bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 focus:border-indigo-500 hover:bg-white/80 dark:hover:bg-black/40 transition-all"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="text-zinc-400" />}
                            placeholder="Email"
                            className="bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 focus:border-indigo-500 hover:bg-white/80 dark:hover:bg-black/40 transition-all"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-zinc-400" />}
                            placeholder="Password"
                            className="bg-white/50 dark:bg-black/20 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 focus:border-indigo-500 hover:bg-white/80 dark:hover:bg-black/40 transition-all"
                        />
                    </Form.Item>

                    <Form.Item className="mb-6">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 border-none shadow-lg shadow-indigo-500/20 h-10 font-semibold rounded-xl"
                            loading={loading}
                        >
                            Register
                        </Button>
                    </Form.Item>

                    <div className="text-center text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Already have an account? </span>
                        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors">
                            Login now
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    );
}
