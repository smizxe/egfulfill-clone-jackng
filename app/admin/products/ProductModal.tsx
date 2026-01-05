'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, message, Select, InputNumber, Table, Button, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface ProductModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    product?: any | null;
}

interface VariantRow {
    key: string;
    color: string;
    size: string;
    price: number;
    existingId?: string;
}

export default function ProductModal({ open, onCancel, onSuccess, product }: ProductModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEdit = !!product;
    const [variantList, setVariantList] = useState<VariantRow[]>([]);

    useEffect(() => {
        if (open) {
            if (product) {
                form.setFieldsValue({
                    ...product,
                    colors: product.colors || [],
                    sizes: product.sizes || [],
                    basePrice: product.basePrice || 0
                });

                if (product.variants && product.variants.length > 0) {
                    const mapped = product.variants.map((v: any) => ({
                        key: `${v.color || 'Default'}-${v.size || 'Default'}`,
                        color: v.color || 'Default',
                        size: v.size || 'Default',
                        price: v.basePrice,
                        existingId: v.id
                    }));
                    setVariantList(mapped);
                } else {
                    setVariantList([]);
                }
            } else {
                form.resetFields();
                form.setFieldsValue({ isActive: true, colors: [], sizes: [], basePrice: 0 });
                setVariantList([]);
            }
        }
    }, [open, product, form]);

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if ('colors' in changedValues || 'sizes' in changedValues) {
            updateVariants(allValues.colors || [], allValues.sizes || [], allValues.basePrice || 0);
        }
    };

    const updateVariants = (colors: string[], sizes: string[], currentBasePrice: number) => {
        const cList = (colors.length > 0) ? colors : ['Default'];
        const sList = (sizes.length > 0) ? sizes : ['Default'];

        const newRows: VariantRow[] = [];

        cList.forEach(color => {
            sList.forEach(size => {
                const key = `${color}-${size}`;
                const existing = variantList.find(v => v.key === key);

                if (existing) {
                    newRows.push(existing);
                } else {
                    newRows.push({
                        key,
                        color,
                        size,
                        price: currentBasePrice,
                    });
                }
            });
        });

        setVariantList(newRows);
    };

    const handlePriceChange = (key: string, newPrice: number) => {
        setVariantList(prev => prev.map(v => v.key === key ? { ...v, price: newPrice } : v));
    };

    const handleDeleteVariant = (key: string) => {
        setVariantList(prev => prev.filter(v => v.key !== key));
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            values.sku = values.sku.toUpperCase();

            const payload = {
                ...values,
                variants: variantList.map(v => ({
                    id: v.existingId,
                    color: v.color === 'Default' ? null : v.color,
                    size: v.size === 'Default' ? null : v.size,
                    basePrice: v.price
                }))
            };

            const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');

            message.success(isEdit ? 'Product updated' : 'Product created');
            onSuccess();
            onCancel();
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Color',
            dataIndex: 'color',
            key: 'color',
            render: (text: string) => text === 'Default' ? <span className="text-gray-400">Default</span> : <Tag>{text}</Tag>
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (text: string) => text === 'Default' ? <span className="text-gray-400">Default</span> : <Tag>{text}</Tag>
        },
        {
            title: 'Price ($)',
            dataIndex: 'price',
            key: 'price',
            render: (_: any, record: VariantRow) => (
                <InputNumber
                    min={0}
                    value={record.price}
                    onChange={(val) => handlePriceChange(record.key, val || 0)}
                    precision={2}
                    style={{ width: 100 }}
                />
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: VariantRow) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteVariant(record.key)}
                />
            )
        }
    ];

    return (
        <Modal
            title={isEdit ? 'Edit Product' : 'Create Product'}
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={800}
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
            >
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
                        <Input placeholder="E.g. TS-001" disabled={isEdit} />
                    </Form.Item>
                    <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                        <Input placeholder="New Product" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Form.Item name="basePrice" label="Default Price ($)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="colors" label="Colors (Enter tag)">
                        <Select mode="tags" placeholder="Blue, Red..." tokenSeparators={[',']} />
                    </Form.Item>
                    <Form.Item name="sizes" label="Sizes (Enter tag)">
                        <Select mode="tags" placeholder="S, M, XL..." tokenSeparators={[',']} />
                    </Form.Item>
                </div>
            </Form>

            <div className="mt-4">
                <h4 className="font-semibold mb-2">Variant Pricing</h4>
                <Table
                    dataSource={variantList}
                    columns={columns}
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                />
            </div>
        </Modal>
    );
}
