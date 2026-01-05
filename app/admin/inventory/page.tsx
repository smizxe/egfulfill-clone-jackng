'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, InputNumber, Tag, notification, Space, Tooltip } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';

interface Product {
    id: string;
    sku: string;
    name: string;
    stock: number; // OnHand
    reservedStock: number;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState<string>('');
    const [editValue, setEditValue] = useState<number>(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/inventory');
            if (!res.ok) throw new Error('Failed to fetch inventory');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            notification.error({ title: 'Error loading inventory' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (id: string) => {
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: id, stock: editValue })
            });

            if (!res.ok) throw new Error('Update failed');

            notification.success({ title: 'Inventory updated' });
            setEditingKey('');
            fetchData();
        } catch (error) {
            notification.error({ title: 'Failed to update inventory' });
        }
    };

    const columns = [
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'On Hand',
            dataIndex: 'stock',
            key: 'stock',
            render: (stock: number, record: Product) => {
                if (editingKey === record.id) {
                    return (
                        <Space>
                            <InputNumber
                                value={editValue}
                                onChange={(val) => setEditValue(val || 0)}
                                min={0}
                            />
                            <Button icon={<SaveOutlined />} type="primary" size="small" onClick={() => handleSave(record.id)} />
                            <Button size="small" onClick={() => setEditingKey('')}>Cancel</Button>
                        </Space>
                    );
                }
                return (
                    <Tooltip title="Click to edit">
                        <div
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() => { setEditingKey(record.id); setEditValue(stock); }}
                        >
                            {stock}
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Reserved',
            dataIndex: 'reservedStock',
            key: 'reservedStock',
            render: (reserved: number) => <Tag color="orange">{reserved}</Tag>,
        },
        {
            title: 'Available',
            key: 'available',
            render: (_: any, record: Product) => {
                const available = record.stock - record.reservedStock;
                return <Tag color={available > 0 ? 'green' : 'red'}>{available}</Tag>;
            }
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Inventory Management</h1>
                <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            </div>

            <Card>
                <Table
                    dataSource={products}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                />
            </Card>
        </div>
    );
}
