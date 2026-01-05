'use client';

import React from 'react';
import { Table, Tag, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface OrderType {
    id: string;
    orderCode: string;
    status: string;
    totalAmount: number;
    trackingNumber: string | null;
    createdAt: Date;
    source?: string;
}

const columns: ColumnsType<OrderType> = [
    {
        title: 'ORDER ID',
        dataIndex: 'orderCode',
        key: 'orderCode',
        render: (text) => <a className="text-blue-600 hover:underline">{text}</a>,
    },
    {
        title: 'STATUS',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
            let color = 'geekblue';
            const statusLower = status?.toLowerCase() || '';

            if (statusLower.includes('cancel') || statusLower.includes('reject')) {
                color = 'red';
            } else if (statusLower.includes('completed') || statusLower.includes('paid')) {
                color = 'green';
            } else if (statusLower.includes('received')) {
                color = 'blue';
            } else if (statusLower.includes('process')) {
                color = 'orange';
            } else if (statusLower.includes('pending')) {
                color = 'gold';
            }

            return (
                <Tag color={color} key={status}>
                    {status?.toUpperCase().replace('_', ' ')}
                </Tag>
            );
        },
    },
    {
        title: 'SOURCE',
        key: 'source',
        render: (_, record) => record.source || 'Direct',
    },
    {
        title: 'TOTAL',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (val) => val ? `$${val.toFixed(2)}` : '$0.00'
    },
    {
        title: 'DATE CREATED',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: Date) => {
            try {
                return new Date(date).toISOString().split('T')[0];
            } catch {
                return 'Invalid Date';
            }
        }
    },
    {
        title: 'TRACKING ID',
        dataIndex: 'trackingNumber',
        key: 'trackingNumber',
        render: (id) => <span className="text-gray-500">{id || 'N/A'}</span>,
    },
];

export default function OrdersTable({ orders }: { orders: any[] }) {
    return (
        <Card variant="borderless" className="shadow-sm">
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
}
