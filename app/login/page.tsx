'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                message.success('Login successful!');
                router.push('/dashboard');
            } else {
                message.error(data.error || 'Login failed');
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
                        Welcome Back
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Sign in to continue to your dashboard
                    </p>
                </div>

                <Form
                    name="normal_login"
                    className="login-form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Please input your Email!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-zinc-400" />}
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

                    <div className="flex justify-between items-center mb-6">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="text-zinc-600 dark:text-zinc-400">Remember me</Checkbox>
                        </Form.Item>

                        <a className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium text-sm transition-colors" href="">
                            Forgot password?
                        </a>
                    </div>

                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 border-none shadow-lg shadow-indigo-500/20 h-10 font-semibold rounded-xl"
                            loading={loading}
                        >
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
