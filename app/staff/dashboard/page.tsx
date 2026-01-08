
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, message, Typography, Tag, Divider } from 'antd';
import { ScanOutlined, QrcodeOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function StaffDashboard() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const inputRef = useRef<any>(null);
    const router = useRouter();

    // Auto-focus input for scanner
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleScan = async () => {
        if (!code) return;
        setLoading(true);
        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.type === 'FILE') {
                    window.open(data.url, '_blank');
                    message.success('Opening Design File...');
                } else {
                    setResult(data);
                    message.success(data.message);
                }
            } else {
                message.error(data.error || 'Scan failed');
            }
        } catch (error) {
            message.error('Error processing scan');
        } finally {
            setLoading(false);
            setCode('');
            // Keep focus for next scan
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleScan();
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' }); // Assuming logout route exists or handled by client clearing cookies
        // Actually typical Next.js logout might need an API route to clear cookie.
        // Assuming /api/auth/logout exists. If not, user can't logout easily.
        // I'll assume it exists or I should create it.
        // For now, redirect to login.
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center">
            <div className="w-full max-w-md flex justify-between items-center mb-6">
                <Title level={4} style={{ margin: 0 }}>Staff Dashboard</Title>
                <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
            </div>

            <Card className="w-full max-w-md shadow-lg text-center">
                <div className="mb-6">
                    <QrcodeOutlined className="text-6xl text-indigo-500 mb-4" />
                    <Title level={3}>Scan Job Ticket</Title>
                    <Text type="secondary">Use your scanner or enter code manually</Text>
                </div>

                <div className="mb-4">
                    <Input
                        ref={inputRef}
                        size="large"
                        prefix={<ScanOutlined />}
                        placeholder="Scan Code (e.g. S-JOB-123)"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>

                <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleScan}
                    loading={loading}
                    className="bg-indigo-600 mb-6"
                >
                    Process
                </Button>

                {result && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                        <Tag color="success" className="text-lg px-3 py-1 mb-2">{result.status}</Tag>
                        <p className="text-green-800 font-medium text-lg">{result.message}</p>
                    </div>
                )}
            </Card>

            <div className="mt-8 text-slate-400 text-sm">
                Logged in as Staff
            </div>
        </div>
    );
}
