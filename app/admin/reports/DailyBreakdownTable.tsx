'use client';

import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Modal, Tabs, List, Space, Typography, Spin, Empty } from 'antd';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(localeData);
dayjs.extend(weekday);

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

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [dailyDetails, setDailyDetails] = useState<{ orders: any[], transactions: any[] }>({ orders: [], transactions: [] });

    // Fetch details for a specific date
    const fetchDailyDetails = async (date: string) => {
        setModalLoading(true);
        setSelectedDate(date);
        setIsModalOpen(true);
        try {
            const res = await fetch(`/api/admin/reports/daily-details?date=${date}`);
            if (res.ok) {
                const json = await res.json();
                setDailyDetails(json);
            }
        } catch (error) {
            console.error('Failed to fetch daily details', error);
        } finally {
            setModalLoading(false);
        }
    };

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
                onRow={(record) => {
                    return {
                        onClick: () => {
                            fetchDailyDetails(record.date);
                        },
                        style: { cursor: 'pointer' }
                    };
                }}
            />

            <Modal
                title={
                    <div className="flex flex-col">
                        <span className="text-lg font-bold">Daily Details</span>
                        <span className="text-sm font-normal text-zinc-500">
                            {selectedDate ? dayjs(selectedDate).format('MMMM D, YYYY') : ''}
                        </span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
                centered
            >
                {modalLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs
                        defaultActiveKey="1"
                        items={[
                            {
                                key: '1',
                                label: `Orders (${dailyDetails.orders.length})`,
                                children: (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        {dailyDetails.orders.length > 0 ? (
                                            <Table
                                                dataSource={dailyDetails.orders}
                                                rowKey="id"
                                                pagination={false}
                                                size="small"
                                                columns={[
                                                    {
                                                        title: 'Code',
                                                        dataIndex: 'orderCode',
                                                        key: 'orderCode',
                                                        render: (val) => <span className="font-medium text-blue-600">#{val}</span>
                                                    },
                                                    {
                                                        title: 'Seller',
                                                        dataIndex: ['seller', 'name'],
                                                        key: 'seller',
                                                        render: (val, record) => (
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-700 font-medium">{val}</span>
                                                                <span className="text-xs text-zinc-400">{record.seller.code}</span>
                                                            </div>
                                                        )
                                                    },
                                                    {
                                                        title: 'Items',
                                                        dataIndex: ['_count', 'jobs'],
                                                        key: 'items',
                                                        align: 'center',
                                                        render: (val) => <Tag>{val}</Tag>
                                                    },
                                                    {
                                                        title: 'Amount',
                                                        dataIndex: 'totalAmount',
                                                        key: 'totalAmount',
                                                        align: 'right',
                                                        render: (val) => <span className="font-semibold">${val.toFixed(2)}</span>
                                                    },
                                                    {
                                                        title: 'Status',
                                                        dataIndex: 'status',
                                                        key: 'status',
                                                        align: 'right',
                                                        render: (val) => <Tag color={val === 'FULFILLED' ? 'green' : 'orange'}>{val}</Tag>
                                                    }
                                                ]}
                                            />
                                        ) : (
                                            <Empty description="No orders on this day" />
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: '2',
                                label: `Wallet Transactions (${dailyDetails.transactions.length})`,
                                children: (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        {dailyDetails.transactions.length > 0 ? (
                                            <Table
                                                dataSource={dailyDetails.transactions}
                                                rowKey="id"
                                                pagination={false}
                                                size="small"
                                                columns={[
                                                    {
                                                        title: 'Type',
                                                        dataIndex: 'type',
                                                        key: 'type',
                                                        render: (val) => (
                                                            <Tag color={val === 'CREDIT' ? 'green' : 'red'}>
                                                                {val}
                                                            </Tag>
                                                        )
                                                    },
                                                    {
                                                        title: 'Seller',
                                                        dataIndex: ['seller', 'name'],
                                                        key: 'seller',
                                                    },
                                                    {
                                                        title: 'Reference',
                                                        dataIndex: 'refType',
                                                        key: 'refType',
                                                        render: (val, record) => (
                                                            <div className="flex flex-col text-xs">
                                                                <span>{val}</span>
                                                                <span className="text-zinc-400">{record.refId}</span>
                                                            </div>
                                                        )
                                                    },
                                                    {
                                                        title: 'Amount',
                                                        dataIndex: 'amount',
                                                        key: 'amount',
                                                        align: 'right',
                                                        render: (val, record) => (
                                                            <span className={`font-mono font-medium ${record.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                                                {record.type === 'CREDIT' ? '+' : '-'}${val.toFixed(2)}
                                                            </span>
                                                        )
                                                    }
                                                ]}
                                            />
                                        ) : (
                                            <Empty description="No wallet transactions on this day" />
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </Modal>
        </Card>
    );
}
