'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, message, Result, Typography } from 'antd';
import { ScanOutlined } from '@ant-design/icons';

export default function ScanPage() {
    const [scanValue, setScanValue] = useState('');
    const [processing, setProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const inputRef = useRef<any>(null);

    useEffect(() => {
        // Auto focus input for continuous scanning
        inputRef.current?.focus();
    }, [lastResult]);

    const handleScan = async () => {
        if (!scanValue) return;
        const code = scanValue.trim();
        setScanValue('');
        setProcessing(true);
        setLastResult(null);

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();

            if (res.ok) {
                setLastResult({ success: true, message: data.message, type: data.type, link: data.link });
                if (data.type === 'FILE' && data.link) {
                    window.open(data.link, '_blank');
                }
                message.success('Scan processed successfully');
            } else {
                setLastResult({ success: false, message: data.error });
                message.error(data.error || 'Scan failed');
            }
        } catch (error) {
            setLastResult({ success: false, message: 'Network error' });
            message.error('Network error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md text-center">
                <Typography.Title level={2}>Production Scanner</Typography.Title>
                <div className="mb-6">
                    <Input
                        ref={inputRef}
                        prefix={<ScanOutlined />}
                        placeholder="Scan Barcode (F-JOB... / S-JOB...)"
                        value={scanValue}
                        onChange={e => setScanValue(e.target.value)}
                        onPressEnter={handleScan}
                        disabled={processing}
                        size="large"
                        autoFocus
                    />
                    <Button type="primary" onClick={handleScan} loading={processing} className="mt-2 w-full" size="large">
                        Process Scan
                    </Button>
                </div>

                {lastResult && (
                    <Result
                        status={lastResult.success ? 'success' : 'error'}
                        title={lastResult.success ? 'Success' : 'Error'}
                        subTitle={lastResult.message}
                    />
                )}
            </Card>
            <div className="mt-4 text-gray-500">
                Supported Codes: F-JOBxxxxx (File), S-JOBxxxxx (Status)
            </div>
        </div>
    );
}
