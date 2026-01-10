'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Table, InputNumber, message, Divider, Space, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface EditOrderModalProps {
    visible: boolean;
    onCancel: () => void;
    order: any;
    onSuccess: () => void;
}

export default function EditOrderModal({ visible, onCancel, order, onSuccess }: EditOrderModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (visible && order) {
            // Pre-fill form
            // Assume first job has recipient info
            const firstJob = order.jobs && order.jobs.length > 0 ? order.jobs[0] : {};

            form.setFieldsValue({
                recipientName: firstJob.recipientName || '',
                address1: firstJob.address1 || '',
                address2: firstJob.address2 || '',
                city: firstJob.city || '',
                state: firstJob.state || '',
                zip: firstJob.zip || '',
                country: firstJob.country || order.shippingCountry || '',
                phone: firstJob.phone || ''
            });

            // Pre-fill items
            setItems(order.jobs.map((j: any) => {
                let dUrl = '';
                let dPos = '';
                try {
                    const designs = JSON.parse(j.designs || '[]');
                    if (Array.isArray(designs) && designs.length > 0) {
                        dUrl = designs[0].url || '';
                        dPos = designs[0].location || designs[0].position || '';
                    }
                } catch (e) {
                    // ignore parse error
                }

                return {
                    id: j.id,
                    sku: j.sku,
                    color: j.color,
                    size: j.size,
                    qty: j.qty,
                    designUrl: dUrl,
                    designPosition: dPos,
                    key: j.id // Antd table key
                };
            }));
        }
    }, [visible, order, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            // Validate items
            if (items.length === 0) {
                message.error('Order must have at least one item');
                return;
            }
            for (const item of items) {
                if (!item.sku || !item.qty) {
                    message.error('All items must have SKU and Quantity');
                    return;
                }
            }

            setLoading(true);

            const payload = {
                orderId: order.id,
                ...values,
                items: items // Now includes designUrl and designPosition
            };

            const res = await fetch('/api/orders/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                message.success('Order updated successfully');
                onSuccess();
                router.refresh(); // Refresh page data
            } else {
                message.error(data.error || 'Failed to update order');
            }

        } catch (error) {
            console.error(error);
            message.error('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (key: string, field: string, value: any) => {
        const newItems = [...items];
        const index = newItems.findIndex(i => i.key === key);
        if (index > -1) {
            newItems[index][field] = value;
            setItems(newItems);
        }
    };

    // Columns for Items Table
    const columns = [
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            render: (text: string, record: any) => (
                <Input
                    value={text}
                    onChange={e => handleItemChange(record.key, 'sku', e.target.value)}
                    placeholder="SKU"
                    className="w-24"
                />
            )
        },
        {
            title: 'Color',
            dataIndex: 'color',
            key: 'color',
            render: (text: string, record: any) => (
                <Input
                    value={text}
                    onChange={e => handleItemChange(record.key, 'color', e.target.value)}
                    placeholder="Color"
                    className="w-20"
                />
            )
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (text: string, record: any) => (
                <Input
                    value={text}
                    onChange={e => handleItemChange(record.key, 'size', e.target.value)}
                    className="w-16"
                    placeholder="Size"
                />
            )
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            key: 'qty',
            render: (val: number, record: any) => (
                <InputNumber
                    min={1}
                    value={val}
                    onChange={val => handleItemChange(record.key, 'qty', val)}
                    className="w-16"
                />
            )
        },
        {
            title: 'Design Link',
            dataIndex: 'designUrl',
            key: 'designUrl',
            render: (text: string, record: any) => (
                <Input
                    value={text}
                    onChange={e => handleItemChange(record.key, 'designUrl', e.target.value)}
                    placeholder="URL"
                    className="w-32"
                />
            )
        },
        {
            title: 'Position',
            dataIndex: 'designPosition',
            key: 'designPosition',
            render: (text: string, record: any) => (
                <Input
                    value={text}
                    onChange={e => handleItemChange(record.key, 'designPosition', e.target.value)}
                    placeholder="Front/Back"
                    className="w-24"
                />
            )
        },
    ];

    return (
        <Modal
            title="Edit Order"
            open={visible}
            onCancel={onCancel}
            onOk={handleSave}
            confirmLoading={loading}
            width={800}
            okText="Save Changes"
        >
            <Form form={form} layout="vertical" className="mt-4">
                <Divider>Recipient Details</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="recipientName" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone">
                        <Input />
                    </Form.Item>
                    <Form.Item name="address1" label="Address 1" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="address2" label="Address 2">
                        <Input />
                    </Form.Item>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-2">
                        <Form.Item name="state" label="State" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="zip" label="Zip" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </div>
                    <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </div>

                <Divider>Order Items</Divider>
                <Table
                    dataSource={items}
                    columns={columns}
                    pagination={false}
                    size="small"
                    scroll={{ x: true }}
                />
                <div className="text-gray-500 text-xs mt-2">
                    * Modifying items will update inventory reservations. SKU must exist in catalog.
                </div>
            </Form>
        </Modal>
    );
}
