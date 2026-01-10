'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space, Input } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface Job {
    id: string;
    sku: string;
    color: string;
    size: string;
    qty: number;
    priceToCharge: number;
    recipientName: string;
    city: string;
    state: string;
    designs: string; // JSON string
    designPosition: string;
    mockupLinks: string | null;
    designLinks: string | null;
    status: string;
}

interface Order {
    id: string;
    orderCode: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    jobs: Job[];
    seller?: {
        name: string;
    };
}

export default function ApprovalClient({ orders: initialOrders }: { orders: any[] }) {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [loading, setLoading] = useState(false);

    // Rejection State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const handleAction = (orderId: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'REJECT') {
            setSelectedOrderId(orderId);
            setRejectReason('');
            setRejectModalVisible(true);
            return;
        }

        // Approve Logic (Immediate)
        Modal.confirm({
            title: 'Are you sure you want to APPROVE this order?',
            content: 'Production process will start.',
            okText: 'Approve',
            okType: 'primary',
            onOk: async () => submitAction(orderId, 'APPROVE')
        });
    };

    const submitAction = async (orderId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/orders/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, action, rejectionReason: reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            message.success(`Order ${action}D successfully`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            router.refresh();
            setRejectModalVisible(false);
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const expandedRowRender = (record: Order) => {
        return (
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
                <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-3">Order Items ({record.jobs.length})</h4>
                <div className="space-y-3">
                    {record.jobs.map((job: Job, index: number) => {
                        let designs: any[] = [];
                        try {
                            designs = JSON.parse(job.designs || '[]');
                        } catch (e) { designs = []; }

                        return (
                            <div key={job.id || index} className="flex flex-col sm:flex-row justify-between items-start gap-4 p-3 bg-white/60 dark:bg-black/40 rounded-lg">
                                <div>
                                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{job.sku} - {job.color}/{job.size}</div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Qty: {job.qty} | Price: ${job.priceToCharge}</div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Ship to: {job.recipientName}, {job.city}, {job.state}</div>
                                </div>
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    {designs.map((d: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between gap-2 text-xs border border-zinc-200 dark:border-zinc-700 p-2 rounded bg-white/80 dark:bg-black/20">
                                            <span className="font-bold text-zinc-700 dark:text-zinc-300">{d.location}:</span>
                                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 underline truncate max-w-[150px]">
                                                View Design
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const columns = [
        {
            title: 'ORDER CODE',
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (text: string) => <span className="font-bold text-zinc-800 dark:text-zinc-200">{text}</span>
        },
        {
            title: 'SELLER',
            dataIndex: ['seller', 'name'],
            key: 'seller',
            render: (text: string) => <span className="text-zinc-600 dark:text-zinc-400">{text || 'Unknown'}</span>
        },
        {
            title: 'ITEMS',
            dataIndex: 'jobs',
            key: 'totalItems',
            render: (jobs: any[]) => <span className="text-zinc-600 dark:text-zinc-400">{jobs.length} items</span>
        },
        {
            title: 'TOTAL',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (val: number) => <span className="font-bold text-emerald-600 dark:text-emerald-400">${val.toFixed(2)}</span>
        },
        {
            title: 'DATE',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <span className="text-zinc-500 dark:text-zinc-500">{new Date(date).toLocaleDateString('en-US')}</span>
        },
        {
            title: 'ACTIONS',
            key: 'action',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleAction(record.id, 'APPROVE')}
                        loading={loading}
                        className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-md shadow-emerald-500/20"
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleAction(record.id, 'REJECT')}
                        loading={loading}
                        className="shadow-md shadow-red-500/10"
                    >
                        Reject
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-300 dark:to-purple-400 bg-clip-text text-transparent">
                    Order Approval
                </h2>
            </div>

            <div className="glass-panel rounded-2xl p-1 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="id"
                    expandable={{ expandedRowRender, defaultExpandedRowKeys: [] }}
                    className="glass-table"
                    pagination={{ pageSize: 10 }}
                />
            </div>
            {/* Rejection Modal */}
            <Modal
                title="Reject Order"
                open={rejectModalVisible}
                onOk={() => {
                    if (!rejectReason.trim()) {
                        message.error('Please provide a reason for rejection');
                        return;
                    }
                    if (selectedOrderId) {
                        submitAction(selectedOrderId, 'REJECT', rejectReason);
                    }
                }}
                onCancel={() => setRejectModalVisible(false)}
                okText="Reject Order"
                okButtonProps={{ danger: true, loading: loading }}
            >
                <div>
                    <p className="mb-2 text-gray-500">Please provide a reason. The seller will see this message.</p>
                    <Input.TextArea
                        rows={4}
                        placeholder="e.g. Invalid shipping address, Model out of stock..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}
