'use client';

import React, { useState } from 'react';
import { Table, Tag, Space, Button, Badge, Modal, message } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import ProductModal from './ProductModal';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    sku: string;
    name: string;
    isActive: boolean;
    variantCount: number;
    priceRange: string;
}

export default function ProductsClient({ products }: { products: Product[] }) {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const handleCreate = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this product?',
            content: 'This action cannot be undone.',
            onOk: async () => {
                try {
                    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed to delete');
                    message.success('Product deleted');
                    router.refresh();
                } catch (error: any) {
                    message.error(error.message);
                }
            }
        });
    };

    const columns = [
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            render: (sku: string) => <Tag>{sku}</Tag>
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: '40%',
        },
        {
            title: 'Variants',
            dataIndex: 'variantCount',
            key: 'variantCount',
            render: (count: number) => <Badge count={count} showZero color={count > 0 ? 'blue' : 'gray'} />
        },
        {
            title: 'Price Range',
            dataIndex: 'priceRange',
            key: 'priceRange',
            render: (range: string) => <b>{range}</b>,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_: any, record: Product) => (
                <Space size="small">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">Total: {products.length} products</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Create Product
                </Button>
            </div>

            <Table
                dataSource={products}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />

            <ProductModal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                product={editingProduct}
                onSuccess={() => {
                    setModalOpen(false);
                    router.refresh();
                }}
            />
        </div>
    );
}
