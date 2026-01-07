'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, notification, Space } from 'antd';
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
            render: (status: string) => {
                let badgeClass = 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
                if (status === 'RECEIVED') {
                    badgeClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400';
                } else if (status === 'IN_PROCESS') {
                    badgeClass = 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400';
                } else {
                    badgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
                }

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                        {status.replace('_', ' ')}
                    </span>
                );
            },
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
            <div className="flex justify-between items-center mb-8">
                <Space>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-300 dark:to-purple-400 bg-clip-text text-transparent">
                        Production Release
                    </h1>
                    <span className="px-3 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full text-sm font-semibold border border-pink-500/20">
                        {jobs.length} Jobs
                    </span>
                </Space>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchData}
                        loading={loading}
                        className="border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-pink-500 dark:hover:text-pink-400 bg-transparent"
                    >
                        Refresh
                    </Button>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handleBulkPrint}
                        disabled={selectedRowKeys.length === 0}
                        className="bg-purple-600 hover:bg-purple-500 border-none shadow-md shadow-purple-500/20"
                    >
                        Generate Labels ({selectedRowKeys.length})
                    </Button>
                </Space>
            </div>

            <div className="glass-panel rounded-2xl p-1 overflow-hidden">
                <Table
                    rowSelection={rowSelection}
                    dataSource={jobs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 50 }}
                    className="glass-table"
                />
            </div>
        </div>
    );
}
