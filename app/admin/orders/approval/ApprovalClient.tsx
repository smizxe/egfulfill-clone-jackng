'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Modal, message, Card, List } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function ApprovalClient({ orders }: { orders: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAction = (orderId: string, action: 'APPROVE' | 'REJECT') => {
        Modal.confirm({
            title: `Are you sure you want to ${action} this order?`,
            content: action === 'REJECT' ? 'Seller will be refunded automatically.' : 'Production process will start.',
            okText: action === 'APPROVE' ? 'Approve' : 'Reject',
            okType: action === 'APPROVE' ? 'primary' : 'danger',
            onOk: async () => {
                try {
                    setLoading(true);
                    const res = await fetch('/api/admin/orders/approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, action }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    message.success(`Order ${action}D successfully`);
                    router.refresh();
                } catch (error: any) {
                    message.error(error.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const expandedRowRender = (record: any) => {
        return (
            <div className="bg-gray-50 p-4 rounded">
                <List
                    header={<div className="font-bold">Order Items ({record.jobs.length})</div>}
                    dataSource={record.jobs}
                    renderItem={(job: any) => {
                        let designs = [];
                        try {
                            designs = JSON.parse(job.designs || '[]');
                        } catch (e) { designs = []; }

                        return (
                            <List.Item>
                                <div className="w-full flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold">{job.sku} - {job.color}/{job.size}</div>
                                        <div className="text-sm text-gray-500">Qty: {job.qty} | Price: ${job.priceToCharge}</div>
                                        <div>Ship to: {job.recipientName}, {job.city}, {job.state}</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {designs.map((d: any, idx: number) => (
                                            <div key={idx} className="text-xs border p-1 rounded bg-white">
                                                <span className="font-bold mr-1">{d.location}:</span>
                                                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate max-w-[200px] inline-block align-bottom">
                                                    View Design
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            </div>
        );
    };

    const columns = [
        {
            title: 'Order Code',
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (text: string) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Seller',
            dataIndex: ['seller', 'name'],
            key: 'seller',
        },
        {
            title: 'Total Items',
            dataIndex: 'jobs',
            key: 'totalItems',
            render: (jobs: any[]) => jobs.length
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (val: number) => `$${val.toFixed(2)}`
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleAction(record.id, 'APPROVE')}
                        loading={loading}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleAction(record.id, 'REJECT')}
                        loading={loading}
                    >
                        Reject
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <Card title="Pending Approval Queue" variant="borderless">
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                expandable={{ expandedRowRender, defaultExpandedRowKeys: [] }}
            />
        </Card>
    );
}
