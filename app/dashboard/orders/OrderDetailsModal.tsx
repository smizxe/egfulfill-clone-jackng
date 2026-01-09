'use client';

import React, { useState } from 'react';
import { Modal, Descriptions, Table, Tag, Button, Space } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import ReportTicketModal from './ReportTicketModal';

interface OrderDetailsModalProps {
    visible: boolean;
    onCancel: () => void;
    order: any; // Using any for simplicity as Order type is complex with relations
    showReportButton?: boolean;
}

export default function OrderDetailsModal({ visible, onCancel, order, showReportButton = true }: OrderDetailsModalProps) {
    const [reportModalVisible, setReportModalVisible] = useState(false);

    if (!order) return null;

    const columns = [
        {
            title: 'Job Code',
            dataIndex: 'jobCode',
            key: 'jobCode',
        },
        {
            title: 'Item',
            key: 'item',
            render: (_: any, record: any) => (
                <div>
                    <div>{record.sku}</div>
                    <div className="text-xs text-gray-500">{record.color} / {record.size}</div>
                </div>
            )
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            key: 'qty',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag>{status}</Tag>
        }
    ];

    const footerButtons = [
        <Button key="close" onClick={onCancel}>Close</Button>
    ];

    // Only show Report Issue if explicitly requested AND order is SHIPPED
    if (showReportButton && order.status === 'SHIPPED') {
        footerButtons.push(
            <Button
                key="report"
                danger
                icon={<WarningOutlined />}
                onClick={() => setReportModalVisible(true)}
            >
                Report Issue
            </Button>
        );
    }

    return (
        <>
            <Modal
                title={`Order Details: ${order.orderCode}`}
                open={visible}
                onCancel={onCancel}
                width={800}
                footer={footerButtons}
            >
                <Descriptions bordered column={2} size="small" className="mb-6">
                    <Descriptions.Item label="Order ID">{order.orderCode}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={order.status === 'COMPLETED' ? 'green' : 'blue'}>{order.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total">${order.totalAmount?.toFixed(2)}</Descriptions.Item>
                    <Descriptions.Item label="Date">{new Date(order.createdAt).toLocaleDateString()}</Descriptions.Item>
                    <Descriptions.Item label="Tracking">{order.trackingNumber || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Carrier">{order.carrier || 'N/A'}</Descriptions.Item>
                    {order.shippingCountry && <Descriptions.Item label="Destination">{order.shippingCountry}</Descriptions.Item>}
                </Descriptions>

                <h3 className="font-bold mb-2">Order Items (Jobs)</h3>
                <Table
                    dataSource={order.jobs || []}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                />
            </Modal>

            <ReportTicketModal
                visible={reportModalVisible}
                onCancel={() => setReportModalVisible(false)}
                orderId={order.id}
                onSuccess={() => {
                    setReportModalVisible(false);
                    // Optionally close parent modal too, or keep it open
                    // onCancel(); 
                }}
            />
        </>
    );
}
