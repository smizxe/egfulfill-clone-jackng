'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, notification, Modal, InputNumber, Space, Typography, Input } from 'antd';
import { ReloadOutlined, EditOutlined, BankOutlined, InboxOutlined, EyeOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface VariantData {
    id: string;
    sku: string;
    color: string;
    size: string;
    stock: number;
    reserved: number;
}

interface ProductGroup {
    id: string;
    sku: string;
    name: string;
    totalStock: number;
    variants: VariantData[];
}

export default function InventoryPage() {
    const [products, setProducts] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination & Search State
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 15,
        total: 0
    });

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductGroup | null>(null);
    const [editedVariants, setEditedVariants] = useState<VariantData[]>([]);

    const fetchData = async (page = 1, pageSize = 15, searchTerm = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                search: searchTerm
            });
            const res = await fetch(`/api/admin/inventory?${params}`);
            if (!res.ok) throw new Error('Failed to fetch inventory');
            const data = await res.json();

            setProducts(data.data);
            setPagination(prev => ({
                ...prev,
                current: data.page,
                total: data.total
            }));
        } catch (error) {
            notification.error({ title: 'Error loading inventory' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize, search);
    }, []);

    const handleTableChange = (newPagination: any) => {
        setPagination(prev => ({ ...prev, current: newPagination.current }));
        fetchData(newPagination.current, newPagination.pageSize, search);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
        fetchData(1, pagination.pageSize, value);
    };

    const handleView = (record: ProductGroup) => {
        setEditingProduct(record);
        const variants = record.variants ? JSON.parse(JSON.stringify(record.variants)) : [];
        setEditedVariants(variants);
        setIsReadOnly(true);
        setIsModalVisible(true);
    };

    const handleEdit = (record: ProductGroup) => {
        setEditingProduct(record);
        // Safely copy variants, defaulting to empty array if undefined
        const variants = record.variants ? JSON.parse(JSON.stringify(record.variants)) : [];
        setEditedVariants(variants);
        setIsReadOnly(false);
        setIsModalVisible(true);
    };

    const handleStockChange = (variantId: string, newStock: number) => {
        if (isReadOnly) return;
        setEditedVariants(prev => prev.map(v =>
            v.id === variantId ? { ...v, stock: newStock } : v
        ));
    };

    const handleSaveBulk = async () => {
        if (isReadOnly) {
            setIsModalVisible(false);
            return;
        }

        if (!editedVariants.length) return;

        try {
            // Prepare payload: Array of updates
            const payload = editedVariants.map(v => ({
                sku: v.sku, // Parent SKU
                color: v.color,
                size: v.size,
                stock: v.stock
            }));

            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Update failed');

            notification.success({ title: 'Inventory updated successfully' });
            setIsModalVisible(false);
            setEditingProduct(null);
            fetchData(pagination.current, pagination.pageSize, search); // Refresh to get aggregates
        } catch (error) {
            notification.error({ title: 'Failed to update inventory' });
        }
    };

    const columns = [
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            width: 150,
            render: (sku: string) => <span className="px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5">{sku}</span>
        },
        {
            title: 'PRODUCT NAME',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span className="font-medium text-zinc-800 dark:text-zinc-200">{text}</span>
        },
        {
            title: 'TOTAL STOCK',
            dataIndex: 'totalStock',
            key: 'totalStock',
            width: 120,
            render: (total: number) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${total > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
                    }`}>
                    {total}
                </span>
            )
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            align: 'center' as const,
            width: 150,
            render: (_: any, record: ProductGroup) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleView(record)}
                        className="text-indigo-600 border-indigo-200 hover:text-indigo-700 hover:border-indigo-300 dark:text-indigo-400 dark:border-indigo-500/30 dark:hover:bg-indigo-900/20 bg-transparent"
                    >
                        View
                    </Button>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                        className="bg-indigo-600 hover:bg-indigo-500 border-none shadow-md shadow-indigo-500/20"
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    // Sub-table for modal or verification? No, requirements say "Bulk Edit Modal"
    const modalColumns = [
        {
            title: 'Color',
            dataIndex: 'color',
            key: 'color',
            render: (c: string) => c || <span className="text-gray-400">N/A</span>
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (s: string) => s || <span className="text-gray-400">N/A</span>
        },
        {
            title: 'Reserved',
            dataIndex: 'reserved',
            key: 'reserved',
            render: (r: number) => <span className="text-orange-500">{r}</span>
        },
        {
            title: isReadOnly ? 'On Hand' : 'On Hand (Edit)',
            key: 'stock',
            render: (_: any, record: VariantData) => (
                isReadOnly ? (
                    <span className="font-medium">{record.stock}</span>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            size="small"
                            onClick={() => handleStockChange(record.id, Math.max(0, record.stock - 1))}
                        >
                            -
                        </Button>
                        <InputNumber
                            min={0}
                            value={record.stock}
                            onChange={(val) => handleStockChange(record.id, val || 0)}
                            className="w-20"
                        />
                        <Button
                            size="small"
                            onClick={() => handleStockChange(record.id, record.stock + 1)}
                        >
                            +
                        </Button>
                    </div>
                )
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                        <InboxOutlined style={{ fontSize: '24px' }} />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent m-0">
                        Warehouse Inventory
                    </h2>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 w-[300px] focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <InboxOutlined className="text-zinc-400" />
                        <input
                            className="bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-200 w-full placeholder:text-zinc-400"
                            placeholder="Search SKU or Name"
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchData(pagination.current, pagination.pageSize, search)}
                        loading={loading}
                        className="bg-white/50 dark:bg-white/10 border-zinc-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20"
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden p-1 shadow-sm">
                <Table
                    dataSource={products}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    className="glass-table"
                />
            </div>

            <Modal
                title={`${isReadOnly ? 'View' : 'Manage'} Inventory: ${editingProduct?.name || ''}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleSaveBulk}
                width={700}
                okText={isReadOnly ? "Close" : "Save All Changes"}
                cancelButtonProps={{ style: { display: isReadOnly ? 'none' : 'inline-block' } }}
                maskClosable={true}
            >
                <div className="mb-4 text-gray-500">
                    {isReadOnly
                        ? "View current stock levels for each variant."
                        : "Adjust stock levels for each variant below. Changes are saved in bulk."}
                </div>
                <Table
                    dataSource={editedVariants}
                    columns={modalColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                />
            </Modal>
        </div>
    );
}
