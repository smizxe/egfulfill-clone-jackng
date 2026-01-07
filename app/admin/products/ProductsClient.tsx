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
    images: string; // JSON
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
            title: 'IMAGE',
            key: 'images',
            width: 80,
            render: (_: any, record: Product) => {
                let img = '';
                try {
                    const arr = JSON.parse(record.images || '[]');
                    img = arr[0] || '';
                } catch (e) { }

                return (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5 flex items-center justify-center">
                        {img ? (
                            <img src={img} alt={record.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <span className="text-[10px]">No Img</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            render: (sku: string) => <span className="px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5">{sku}</span>
        },
        {
            title: 'NAME',
            dataIndex: 'name',
            key: 'name',
            width: '40%',
            render: (text: string) => <span className="text-zinc-800 dark:text-zinc-200 font-medium">{text}</span>
        },
        {
            title: 'VARIANTS',
            dataIndex: 'variantCount',
            key: 'variantCount',
            render: (count: number) => (
                <div className="flex items-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${count > 0
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500'
                        }`}>
                        {count} variants
                    </span>
                </div>
            )
        },
        {
            title: 'PRICE RANGE',
            dataIndex: 'priceRange',
            key: 'priceRange',
            render: (range: string) => <span className="font-semibold text-zinc-700 dark:text-zinc-300">{range}</span>,
        },
        {
            title: 'STATUS',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${isActive
                    ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
                    }`}>
                    {isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            title: 'ACTIONS',
            key: 'action',
            render: (_: any, record: Product) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                        className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    />
                </Space>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Total: {products.length} products</span>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 border-none h-10 px-6 rounded-xl font-semibold"
                >
                    Create Product
                </Button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden p-1">
                <Table
                    dataSource={products}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    className="glass-table"
                />
            </div>

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
