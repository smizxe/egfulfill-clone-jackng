'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, notification, Modal, Input } from 'antd';
import { ReloadOutlined, RocketOutlined } from '@ant-design/icons';

interface Order {
    id: string;
    externalId: string | null;
    status: string;
    totalPrice: number;
    trackingId: string | null;
    createdAt: string;
    user: { email: string };
    jobs: { id: string }[];
}

export default function ShippingPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/shipping');
            if (!res.ok) throw new Error('Failed to fetch orders');
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            notification.error({ title: 'Error loading shipping orders' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShip = async () => {
        if (!shippingOrderId) return;

        try {
            // Simulate shipping API
            const res = await fetch('/api/admin/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: shippingOrderId, trackingNumber: trackingNumber || `TRK-${Date.now()}` })
            });

            if (!res.ok) throw new Error('Shipping failed');

            notification.success({ title: 'Order Shipped' });
            setShippingOrderId(null);
            setTrackingNumber('');
            fetchData();
        } catch (error) {
            notification.error({ title: 'Failed to ship order' });
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string, record: Order) => record.externalId || id.substring(0, 8),
        },
        {
            title: 'Customer',
            dataIndex: ['user', 'email'],
            key: 'user',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={status === 'READY_TO_SHIP' ? 'green' : 'blue'}>{status}</Tag>,
        },
        {
            title: 'Tracking',
            dataIndex: 'trackingId',
            key: 'trackingId',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Order) => (
                <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    disabled={record.status === 'SHIPPED'}
                    onClick={() => { setShippingOrderId(record.id); setTrackingNumber(''); }}
                >
                    {record.status === 'SHIPPED' ? 'Shipped' : 'Create Label'}
                </Button>
            )
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Shipping Management</h1>
                <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            </div>

            <Card title="Orders Ready to Ship">
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                />
            </Card>

            <Modal
                title="Create Shipment"
                open={!!shippingOrderId}
                onCancel={() => setShippingOrderId(null)}
                onOk={handleShip}
                okText="Generate Label"
            >
                <p>Confirm shipment for Order ID: {shippingOrderId?.substring(0, 8)}</p>
                <div className="mb-4">
                    <label>Manual Tracking Number (Optional):</label>
                    <Input
                        placeholder="Leave empty to auto-generate"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                    />
                </div>
                <p className="text-gray-500 text-sm">This will generate a PDF label and update tracking.</p>
            </Modal>
        </div>
    );
}
