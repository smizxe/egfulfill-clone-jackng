'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, notification, Modal, Input, Select, Spin, Descriptions, Space } from 'antd';
import { ReloadOutlined, RocketOutlined, PrinterOutlined, LinkOutlined } from '@ant-design/icons';

interface Job {
    id: string;
    status: string;
    recipientName: string | null;
    phone: string | null;
    address1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    sku: string;
    qty: number;
}

interface Order {
    id: string;
    orderCode: string;
    status: string;
    totalAmount: number;
    trackingNumber: string | null;
    carrier: string | null;
    createdAt: string;
    seller: { contactEmail: string | null; name: string | null };
    jobs: Job[];
}

interface ShippingRate {
    postage_type: string;
    postage_description: string;
    price: number;
    currency: string;
    estimated_delivery_days?: number;
}

export default function ShippingPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isSandbox, setIsSandbox] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Shipping form state
    const [weight, setWeight] = useState('0.5');
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [loadingRates, setLoadingRates] = useState(false);
    const [selectedRate, setSelectedRate] = useState<string>('');
    const [creating, setCreating] = useState(false);
    const [labelUrl, setLabelUrl] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/shipping');
            if (!res.ok) throw new Error('Failed to fetch orders');
            const data = await res.json();
            setOrders(data.orders || []);
            setIsSandbox(data.isSandbox);
        } catch (error) {
            notification.error({ message: 'Error', description: 'Failed to load shipping orders' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const openShippingModal = (order: Order) => {
        setSelectedOrder(order);
        setModalVisible(true);
        setRates([]);
        setSelectedRate('');
        setLabelUrl(null);
        setWeight('0.5');
    };

    const fetchRates = async () => {
        if (!selectedOrder || selectedOrder.jobs.length === 0) return;

        const job = selectedOrder.jobs[0];
        setLoadingRates(true);

        try {
            const res = await fetch('/api/admin/shipping/rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toAddress: {
                        name: job.recipientName,
                        street1: job.address1,
                        city: job.city,
                        state: job.state,
                        zip: job.zip,
                        countryCode: job.country || 'US',
                        phone: job.phone,
                    },
                    weight: parseFloat(weight),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to get rates');
            }

            const data = await res.json();
            setRates(data.rates || []);
            if (data.rates?.length > 0) {
                setSelectedRate(data.rates[0].postage_type);
            }
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message || 'Failed to fetch shipping rates' });
        } finally {
            setLoadingRates(false);
        }
    };

    const createShipment = async () => {
        if (!selectedOrder || !selectedRate) return;

        setCreating(true);
        try {
            const res = await fetch('/api/admin/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    postageType: selectedRate,
                    weight: parseFloat(weight),
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create shipment');
            }

            const data = await res.json();
            notification.success({
                message: 'Shipment Created!',
                description: `Tracking: ${data.trackingNumber}`
            });

            setLabelUrl(data.labelUrl);
            fetchOrders(); // Refresh list
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message || 'Failed to create shipment' });
        } finally {
            setCreating(false);
        }
    };

    const columns = [
        {
            title: 'Order Code',
            dataIndex: 'orderCode',
            key: 'orderCode',
        },
        {
            title: 'Seller',
            dataIndex: ['seller', 'name'],
            key: 'seller',
            render: (name: string | null) => name || 'N/A',
        },
        {
            title: 'Recipient',
            key: 'recipient',
            render: (_: any, record: Order) => record.jobs[0]?.recipientName || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'SHIPPED' ? 'green' : status === 'COMPLETED' ? 'blue' : 'default'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Tracking',
            dataIndex: 'trackingNumber',
            key: 'trackingNumber',
            render: (tracking: string | null) => tracking || '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Order) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<RocketOutlined />}
                        disabled={record.status === 'SHIPPED'}
                        onClick={() => openShippingModal(record)}
                    >
                        {record.status === 'SHIPPED' ? 'Shipped' : 'Create Label'}
                    </Button>
                </Space>
            ),
        },
    ];

    const selectedRateInfo = rates.find(r => r.postage_type === selectedRate);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Shipping Management</h1>
                    {isSandbox !== null && (
                        <Tag color={isSandbox ? 'orange' : 'green'} className="font-bold uppercase">
                            {isSandbox ? 'Sandbox / Test Mode' : 'Production Mode'}
                        </Tag>
                    )}
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>Refresh</Button>
            </div>

            <Card title="Orders Ready to Ship (Stallion Express)">
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                />
            </Card>

            <Modal
                title={`Create Shipment - ${selectedOrder?.orderCode}`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        {/* Order Details */}
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Recipient">
                                {selectedOrder.jobs[0]?.recipientName || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone">
                                {selectedOrder.jobs[0]?.phone || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Address" span={2}>
                                {selectedOrder.jobs[0]?.address1}, {selectedOrder.jobs[0]?.city}, {selectedOrder.jobs[0]?.state} {selectedOrder.jobs[0]?.zip}, {selectedOrder.jobs[0]?.country}
                            </Descriptions.Item>
                            <Descriptions.Item label="Items">
                                {selectedOrder.jobs.map(j => `${j.sku} x${j.qty}`).join(', ')}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Weight Input */}
                        <div className="flex items-center gap-4">
                            <label className="font-medium">Package Weight (kg):</label>
                            <Input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                style={{ width: 120 }}
                                min="0.1"
                                step="0.1"
                            />
                            <Button onClick={fetchRates} loading={loadingRates}>
                                Get Rates
                            </Button>
                        </div>

                        {/* Rates Selection */}
                        {loadingRates && <Spin tip="Fetching rates..." />}

                        {rates.length > 0 && (
                            <div>
                                <label className="font-medium block mb-2">Select Shipping Service:</label>
                                <Select
                                    value={selectedRate}
                                    onChange={setSelectedRate}
                                    style={{ width: '100%' }}
                                >
                                    {rates.map(rate => (
                                        <Select.Option key={rate.postage_type} value={rate.postage_type}>
                                            {rate.postage_description} - ${rate.price.toFixed(2)} {rate.currency}
                                            {rate.estimated_delivery_days && ` (${rate.estimated_delivery_days} days)`}
                                        </Select.Option>
                                    ))}
                                </Select>

                                {selectedRateInfo && (
                                    <div className="mt-2 p-3 bg-blue-50 rounded text-center">
                                        <span className="text-lg font-bold">
                                            Total: ${selectedRateInfo.price.toFixed(2)} {selectedRateInfo.currency}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Label URL (after creation) */}
                        {labelUrl && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded">
                                <p className="font-bold text-green-700 mb-2">✅ Shipment Created Successfully!</p>
                                <Button
                                    type="primary"
                                    icon={<PrinterOutlined />}
                                    onClick={() => window.open(labelUrl, '_blank')}
                                >
                                    Download / Print Label
                                </Button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!labelUrl && (
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                                <Button
                                    type="primary"
                                    icon={<RocketOutlined />}
                                    onClick={createShipment}
                                    loading={creating}
                                    disabled={!selectedRate || rates.length === 0}
                                >
                                    Create Shipment & Get Label
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

