'use client';

import React, { useEffect, useState } from 'react';
import { Table, Card, Tag } from 'antd';
import dayjs from 'dayjs';

interface DailyStats {
    date: string;
    orders: number;
    revenue: number;
    cost: number;
    profit: number;
}

interface DailyBreakdownTableProps {
    month: number;
    year: number;
}

export default function DailyBreakdownTable({ month, year }: DailyBreakdownTableProps) {
    const [data, setData] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMonthlyStats = async () => {
            setLoading(true);
            try {
                // Reuse the monthly stats API or create a new one that returns detailed daily stats
                // The current /api/admin/stats/monthly returns { date: string, count: number (orders), ... }
                // Use monthly API for now, assuming it returns enough or update it.
                // Actually the current monthly API returns { date, wallet, orders, releases } (counts mostly).
                // We need REVENUE and COST. 
                // The current monthly API might not return revenue. Let's check or assume I need a new endpoint.
                // The user asked for "Tabular daily breakdown" with financial columns.
                // I should create a new API param or endpoint for "detailed monthly".
                // Let's use /api/admin/stats/monthly-financials?month=..&year=..

                const res = await fetch(`/api/admin/stats/monthly-financials?month=${month}&year=${year}`);
                if (res.ok) {
                    const json = await res.json();

                    // Sort descending by date
                    const sorted = json.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setData(sorted);
                }
            } catch (error) {
                console.error("Failed to fetch report data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyStats();
    }, [month, year]);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => dayjs(text).format('MMMM D, YYYY'),
            width: 150,
        },
        {
            title: 'Orders',
            dataIndex: 'orders',
            key: 'orders',
            align: 'center' as const,
            render: (val: number) => <Tag color="blue">{val}</Tag>,
        },
        {
            title: 'Total Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right' as const,
            render: (val: number) => <span className="font-medium text-emerald-600">${val?.toFixed(2) || '0.00'}</span>,
        },
        {
            title: 'Total Cost',
            dataIndex: 'cost',
            key: 'cost',
            align: 'right' as const,
            render: (val: number) => <span className="text-zinc-500">${val?.toFixed(2) || '0.00'}</span>,
        },
        {
            title: 'Net Profit',
            dataIndex: 'profit',
            key: 'profit',
            align: 'right' as const,
            render: (val: number) => (
                <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ${val?.toFixed(2) || '0.00'}
                </span>
            ),
        },
    ];

    return (
        <Card className="glass-card border-zinc-200 dark:border-zinc-800 shadow-sm" styles={{ body: { padding: 0 } }}>
            <Table
                dataSource={data}
                columns={columns}
                rowKey="date"
                loading={loading}
                pagination={{ pageSize: 31, hideOnSinglePage: true }} // Show all days of month
                scroll={{ x: 600 }}
            />
        </Card>
    );
}
