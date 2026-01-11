'use client';

import React, { useState } from 'react';
import { Modal, Descriptions, Table, Tag, Button, Space, Alert } from 'antd';
import { WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
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
            title: 'Item',
            key: 'item',
            render: (_: any, record: any) => (
                <div>
                    <div className="font-medium">{record.sku}</div>
                    <div className="text-xs text-gray-500">{record.color} / {record.size}</div>
                </div>
            )
        },
        {
            title: 'Design',
            key: 'design',
            render: (_: any, record: any) => {
                try {
                    const designs = JSON.parse(record.designs || '[]');
                    const d = Array.isArray(designs) && designs.length > 0 ? designs[0] : null;
                    const position = d?.location || d?.position || 'N/A';

                    return (
                        <div className="text-xs">
                            <span className="text-gray-500">Pos:</span> {position}
                        </div>
                    );
                } catch {
                    return <span className="text-gray-400">N/A</span>;
                }
            }
        },
        {
            title: 'Link',
            key: 'link',
            render: (_: any, record: any) => {
                try {
                    const designs = JSON.parse(record.designs || '[]');
                    const url = (Array.isArray(designs) && designs.length > 0) ? designs[0].url : null;

                    if (url) {
                        return <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View</a>;
                    }
                } catch { }
                return <span className="text-gray-400">-</span>;
            }
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

    const firstJob = order.jobs?.[0] || {};
    const fullAddress = [
        firstJob.address1,
        firstJob.address2,
        firstJob.city,
        firstJob.state,
        firstJob.zip,
        firstJob.country || order.shippingCountry
    ].filter(Boolean).join(', ');

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

                    <Descriptions.Item label="Recipient">{firstJob.recipientName || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{firstJob.phone || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                        {fullAddress || 'N/A'}
                    </Descriptions.Item>
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
