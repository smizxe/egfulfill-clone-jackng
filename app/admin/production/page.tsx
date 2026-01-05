'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, notification, Space, Tooltip, Badge } from 'antd';
import { ReloadOutlined, PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface Job {
    id: string;
    jobCode: string;
    status: string;
    sku: string;
    color: string | null;
    size: string | null;
    quantity: number; // Corrected from qty based on schema: schema says qty Int @default(1)
    qty: number; // schema field is `qty`
    createdAt: string;
    recipientName: string;
}

export default function ProductionPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch RECEIVED and IN_PROCESS jobs
            const res = await fetch('/api/admin/jobs?status=RECEIVED,IN_PROCESS');
            if (!res.ok) throw new Error('Failed to fetch jobs');
            const data = await res.json();
            setJobs(data);
        } catch (error) {
            notification.error({ title: 'Error loading production jobs' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBulkPrint = () => {
        if (selectedRowKeys.length === 0) {
            notification.warning({ message: 'Select at least one job to print' });
            return;
        }
        const ids = selectedRowKeys.join(',');
        window.open(`/admin/print/labels?ids=${ids}`, '_blank');
    };

    const columns = [
        {
            title: 'Job Code',
            dataIndex: 'jobCode',
            key: 'jobCode',
            render: (text: string) => <span className="font-bold">{text}</span>
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName',
        },
        {
            title: 'SKU Info',
            key: 'sku',
            render: (_: any, r: Job) => (
                <div>
                    <div className="font-mono text-blue-800">{r.sku}</div>
                    <div className="text-xs text-gray-500">{r.color || '-'} / {r.size || '-'}</div>
                </div>
            )
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            key: 'qty',
            width: 80
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'RECEIVED' ? 'blue' : status === 'IN_PROCESS' ? 'orange' : 'green'}>
                    {status.replace('_', ' ')}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => new Date(d).toLocaleString(),
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <Space>
                    <h1 className="text-2xl font-bold">Production Release</h1>
                    <Badge count={jobs.length} style={{ backgroundColor: '#108ee9' }} />
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handleBulkPrint}
                        disabled={selectedRowKeys.length === 0}
                    >
                        Generate Labels ({selectedRowKeys.length})
                    </Button>
                </Space>
            </div>

            <Card className="shadow-sm">
                <Table
                    rowSelection={rowSelection}
                    dataSource={jobs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 50 }}
                />
            </Card>
        </div>
    );
}
