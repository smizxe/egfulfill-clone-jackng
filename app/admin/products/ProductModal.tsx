'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, message, Select, InputNumber, Table, Checkbox, Divider } from 'antd';

interface ProductModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    product?: any | null;
}

export default function ProductModal({ open, onCancel, onSuccess, product }: ProductModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEdit = !!product;

    // Special pricing toggles
    const [enableColorPricing, setEnableColorPricing] = useState(false);
    const [enableSizePricing, setEnableSizePricing] = useState(false);

    // Price adjustments: { 'RED': 2, 'BLUE': 0 }
    const [colorAdjustments, setColorAdjustments] = useState<Record<string, number>>({});
    const [sizeAdjustments, setSizeAdjustments] = useState<Record<string, number>>({});

    // Track current colors/sizes from form for dynamic tables
    const [currentColors, setCurrentColors] = useState<string[]>([]);
    const [currentSizes, setCurrentSizes] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            if (product) {
                form.setFieldsValue({
                    sku: product.sku,
                    name: product.name,
                    isActive: product.isActive,
                    colors: product.colors || [],
                    sizes: product.sizes || [],
                    basePrice: product.basePrice || 0
                });
                setCurrentColors(product.colors || []);
                setCurrentSizes(product.sizes || []);

                // Analyze existing variants to detect special pricing
                if (product.variants && product.variants.length > 0) {
                    const basePrice = product.basePrice || Math.min(...product.variants.map((v: any) => v.basePrice));

                    // Detect color adjustments
                    const colorAdj: Record<string, number> = {};
                    const sizeAdj: Record<string, number> = {};
                    let hasColorDiff = false;
                    let hasSizeDiff = false;

                    product.variants.forEach((v: any) => {
                        const c = v.color || 'Default';
                        const s = v.size || 'Default';
                        // This is simplified detection - just use 0 for now and let user adjust
                        if (!(c in colorAdj)) colorAdj[c] = 0;
                        if (!(s in sizeAdj)) sizeAdj[s] = 0;
                    });

                    setColorAdjustments(colorAdj);
                    setSizeAdjustments(sizeAdj);
                }
            } else {
                form.resetFields();
                form.setFieldsValue({ isActive: true, colors: [], sizes: [], basePrice: 0 });
                setCurrentColors([]);
                setCurrentSizes([]);
                setColorAdjustments({});
                setSizeAdjustments({});
                setEnableColorPricing(false);
                setEnableSizePricing(false);
            }
        }
    }, [open, product, form]);

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if ('colors' in changedValues) {
            const newColors = allValues.colors || [];
            setCurrentColors(newColors);
            // Initialize new colors with 0 adjustment
            const updated = { ...colorAdjustments };
            newColors.forEach((c: string) => {
                if (!(c in updated)) updated[c] = 0;
            });
            // Remove deleted colors
            Object.keys(updated).forEach(k => {
                if (!newColors.includes(k)) delete updated[k];
            });
            setColorAdjustments(updated);
        }
        if ('sizes' in changedValues) {
            const newSizes = allValues.sizes || [];
            setCurrentSizes(newSizes);
            const updated = { ...sizeAdjustments };
            newSizes.forEach((s: string) => {
                if (!(s in updated)) updated[s] = 0;
            });
            Object.keys(updated).forEach(k => {
                if (!newSizes.includes(k)) delete updated[k];
            });
            setSizeAdjustments(updated);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            values.sku = values.sku.toUpperCase();
            const basePrice = parseFloat(values.basePrice) || 0;
            const colors = values.colors?.length > 0 ? values.colors : [null];
            const sizes = values.sizes?.length > 0 ? values.sizes : [null];

            // Generate variants with calculated prices
            const variants: any[] = [];
            colors.forEach((color: string | null) => {
                sizes.forEach((size: string | null) => {
                    const colorAdj = (enableColorPricing && color) ? (colorAdjustments[color] || 0) : 0;
                    const sizeAdj = (enableSizePricing && size) ? (sizeAdjustments[size] || 0) : 0;
                    const finalPrice = basePrice + colorAdj + sizeAdj;

                    variants.push({
                        color: color,
                        size: size,
                        basePrice: finalPrice
                    });
                });
            });

            const payload = {
                sku: values.sku,
                name: values.name,
                isActive: values.isActive,
                variants: variants
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

    // Color adjustment table
    const colorColumns = [
        { title: 'Color', dataIndex: 'color', key: 'color' },
        {
            title: 'Price Adjustment ($)',
            dataIndex: 'adjustment',
            key: 'adjustment',
            render: (_: any, record: { color: string }) => (
                <InputNumber
                    value={colorAdjustments[record.color] || 0}
                    onChange={(val) => setColorAdjustments(prev => ({ ...prev, [record.color]: val || 0 }))}
                    precision={2}
                    style={{ width: 120 }}
                    prefix="+"
                />
            )
        }
    ];

    const colorData = currentColors.map(c => ({ key: c, color: c }));

    // Size adjustment table
    const sizeColumns = [
        { title: 'Size', dataIndex: 'size', key: 'size' },
        {
            title: 'Price Adjustment ($)',
            dataIndex: 'adjustment',
            key: 'adjustment',
            render: (_: any, record: { size: string }) => (
                <InputNumber
                    value={sizeAdjustments[record.size] || 0}
                    onChange={(val) => setSizeAdjustments(prev => ({ ...prev, [record.size]: val || 0 }))}
                    precision={2}
                    style={{ width: 120 }}
                    prefix="+"
                />
            )
        }
    ];

    const sizeData = currentSizes.map(s => ({ key: s, size: s }));

    return (
        <Modal
            title={isEdit ? 'Edit Product' : 'Create Product'}
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
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

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="basePrice" label="Base Price ($)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="$" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </div>

                <Divider orientation="left">Variants</Divider>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="colors" label="Colors (Type and press Enter)">
                        <Select mode="tags" placeholder="Red, Blue, Black..." tokenSeparators={[',']} />
                    </Form.Item>
                    <Form.Item name="sizes" label="Sizes (Type and press Enter)">
                        <Select mode="tags" placeholder="S, M, L, XL..." tokenSeparators={[',']} />
                    </Form.Item>
                </div>
            </Form>

            {/* Special Pricing Sections */}
            {currentColors.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                    <Checkbox
                        checked={enableColorPricing}
                        onChange={(e) => setEnableColorPricing(e.target.checked)}
                    >
                        <span className="font-medium">Special Pricing by Color</span>
                    </Checkbox>
                    {enableColorPricing && (
                        <Table
                            dataSource={colorData}
                            columns={colorColumns}
                            pagination={false}
                            size="small"
                            className="mt-2"
                        />
                    )}
                </div>
            )}

            {currentSizes.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                    <Checkbox
                        checked={enableSizePricing}
                        onChange={(e) => setEnableSizePricing(e.target.checked)}
                    >
                        <span className="font-medium">Special Pricing by Size</span>
                    </Checkbox>
                    {enableSizePricing && (
                        <Table
                            dataSource={sizeData}
                            columns={sizeColumns}
                            pagination={false}
                            size="small"
                            className="mt-2"
                        />
                    )}
                </div>
            )}

            {/* Price Preview */}
            {(enableColorPricing || enableSizePricing) && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                    <strong>Price Preview:</strong>
                    <ul className="mt-1 list-disc list-inside">
                        {(currentColors.length > 0 ? currentColors : [null]).slice(0, 2).map((color) =>
                            (currentSizes.length > 0 ? currentSizes : [null]).slice(0, 2).map((size) => {
                                const base = parseFloat(form.getFieldValue('basePrice')) || 0;
                                const cAdj = (enableColorPricing && color) ? (colorAdjustments[color] || 0) : 0;
                                const sAdj = (enableSizePricing && size) ? (sizeAdjustments[size] || 0) : 0;
                                return (
                                    <li key={`${color}-${size}`}>
                                        {color || 'Default'} / {size || 'Default'}: ${(base + cAdj + sAdj).toFixed(2)}
                                    </li>
                                );
                            })
                        )}
                        {(currentColors.length > 2 || currentSizes.length > 2) && <li>...</li>}
                    </ul>
                </div>
            )}
        </Modal>
    );
}
