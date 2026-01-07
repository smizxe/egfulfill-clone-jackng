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
            notification.error({ title: 'Error', description: 'Failed to load shipping orders' });
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
            notification.error({ title: 'Error', description: error.message || 'Failed to fetch shipping rates' });
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
                title: 'Shipment Created!',
                description: `Tracking: ${data.trackingNumber}`
            });

            setLabelUrl(data.labelUrl);
            fetchOrders(); // Refresh list
        } catch (error: any) {
            notification.error({ title: 'Error', description: error.message || 'Failed to create shipment' });
        } finally {
            setCreating(false);
        }
    };

    const columns = [
        {
            title: 'ORDER CODE',
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (code: string) => <span className="font-bold text-zinc-800 dark:text-zinc-200">{code}</span>
        },
        {
            title: 'SELLER',
            dataIndex: ['seller', 'name'],
            key: 'seller',
            render: (name: string | null) => <span className="text-zinc-600 dark:text-zinc-400">{name || 'N/A'}</span>,
        },
        {
            title: 'RECIPIENT',
            key: 'recipient',
            render: (_: any, record: Order) => <span className="text-zinc-700 dark:text-zinc-300 font-medium">{record.jobs[0]?.recipientName || 'N/A'}</span>,
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${status === 'SHIPPED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                    }`}>
                    {status}
                </span>
            ),
        },
        {
            title: 'TRACKING',
            dataIndex: 'trackingNumber',
            key: 'trackingNumber',
            render: (tracking: string | null) => tracking ? (
                <span className="font-mono text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">{tracking}</span>
            ) : '-',
        },
        {
            title: 'ACTION',
            key: 'action',
            render: (_: any, record: Order) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<RocketOutlined />}
                        disabled={record.status === 'SHIPPED'}
                        onClick={() => openShippingModal(record)}
                        className={`${record.status === 'SHIPPED'
                                ? 'bg-zinc-200 text-zinc-400 border-transparent dark:bg-white/5 dark:text-zinc-600'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-none shadow-md shadow-blue-500/20'
                            }`}
                        size="small"
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
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent m-0">Shipping Management</h1>
                    {isSandbox !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${isSandbox
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            }`}>
                            {isSandbox ? 'Sandbox / Test Mode' : 'Production Mode'}
                        </span>
                    )}
                </div>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchOrders}
                    loading={loading}
                    className="bg-white/50 dark:bg-white/10 border-zinc-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20"
                >
                    Refresh
                </Button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden p-1 shadow-sm">
                <div className="px-5 py-4 border-b border-black/5 dark:border-white/5">
                    <h3 className="font-semibold text-zinc-700 dark:text-zinc-200">Orders Ready to Ship (Stallion Express)</h3>
                </div>
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                    className="glass-table"
                />
            </div>

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
                        {loadingRates && (
                            <Spin tip="Fetching rates...">
                                <div className="p-8 text-center text-gray-400">Loading...</div>
                            </Spin>
                        )}

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

