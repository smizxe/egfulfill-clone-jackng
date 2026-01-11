'use client';

import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Spin } from 'antd';
import dayjs from 'dayjs';

interface ProductionStats {
    date: string;
    totalOrders: number;
    received: number; // Received/Paid
    processing: number; // In Process
    shipped: number; // Shipped/Completed
    cancelled: number; // Cancelled/Rejected
}

interface ProductionReportProps {
    month: number;
    year: number;
}

export default function ProductionReport({ month, year }: ProductionReportProps) {
    const [data, setData] = useState<ProductionStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/stats/monthly-production?month=${month}&year=${year}`);
                if (res.ok) {
                    const json = await res.json();
                    const sorted = json.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setData(sorted);
                }
            } catch (error) {
                console.error("Failed to fetch production stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [month, year]);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => dayjs(text).format('MMMM D, YYYY'),
            width: 200,
        },
        {
            title: 'Total Orders',
            dataIndex: 'totalOrders',
            key: 'totalOrders',
            align: 'center' as const,
            render: (val: number) => <span className="font-bold">{val}</span>,
        },
        {
            title: 'Received',
            dataIndex: 'received',
            key: 'received',
            align: 'center' as const,
            render: (val: number) => (val > 0 ? <Tag color="blue">{val}</Tag> : <span className="text-zinc-300">-</span>),
        },
        {
            title: 'Processing',
            dataIndex: 'processing',
            key: 'processing',
            align: 'center' as const,
            render: (val: number) => (val > 0 ? <Tag color="orange">{val}</Tag> : <span className="text-zinc-300">-</span>),
        },
        {
            title: 'Shipped / Completed',
            dataIndex: 'shipped',
            key: 'shipped',
            align: 'center' as const,
            render: (val: number) => (val > 0 ? <Tag color="green">{val}</Tag> : <span className="text-zinc-300">-</span>),
        },
        {
            title: 'Cancelled / Rejected',
            dataIndex: 'cancelled',
            key: 'cancelled',
            align: 'center' as const,
            render: (val: number) => (val > 0 ? <Tag color="red">{val}</Tag> : <span className="text-zinc-300">-</span>),
        },
    ];

    return (
        <Card className="glass-card border-zinc-200 dark:border-zinc-800 shadow-sm" styles={{ body: { padding: 0 } }}>
            <Table
                dataSource={data}
                columns={columns}
                rowKey="date"
                loading={loading}
                pagination={{ pageSize: 15 }}
                scroll={{ x: 800 }}
            />
        </Card>
    );
}
