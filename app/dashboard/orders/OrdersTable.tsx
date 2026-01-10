'use client';

import React from 'react';
import { Table, Tag, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface OrderType {
    id: string;
    orderCode: string;
    status: string;
    totalAmount: number;
    trackingNumber: string | null;
    createdAt: Date;
    source?: string;
}

const columns: ColumnsType<OrderType> = [
    {
        title: 'ORDER ID',
        dataIndex: 'orderCode',
        key: 'orderCode',
        render: (text) => <a className="text-blue-600 hover:underline">{text}</a>,
    },
    {
        title: 'STATUS',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
            let color = 'geekblue';
            const statusLower = status?.toLowerCase() || '';

            if (statusLower.includes('cancel') || statusLower.includes('reject')) {
                color = 'red';
            } else if (statusLower.includes('completed') || statusLower.includes('paid')) {
                color = 'green';
            } else if (statusLower.includes('received')) {
                color = 'blue';
            } else if (statusLower.includes('process')) {
                color = 'orange';
            } else if (statusLower.includes('pending')) {
                color = 'gold';
            }

            return (
                <Tag color={color} key={status}>
                    {status?.toUpperCase().replace('_', ' ')}
                </Tag>
            );
        },
    },
    {
        title: 'SOURCE',
        key: 'source',
        render: (_, record) => record.source || 'Direct',
    },
    {
        title: 'TOTAL',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (val) => val ? `$${val.toFixed(2)}` : '$0.00'
    },
    {
        title: 'DATE CREATED',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: Date) => {
            try {
                return new Date(date).toISOString().split('T')[0];
            } catch {
                return 'Invalid Date';
            }
        }
    },
    {
        title: 'TRACKING ID',
        dataIndex: 'trackingNumber',
        key: 'trackingNumber',
        render: (id) => <span className="text-gray-500">{id || 'N/A'}</span>,
    },
];


import { EyeOutlined, WarningOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Tooltip, Select } from 'antd';
import { useState, useMemo } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import ReportTicketModal from './ReportTicketModal';
import EditOrderModal from './EditOrderModal';

export default function OrdersTable({ orders }: { orders: any[] }) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Edit Order State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);

    const filteredOrders = useMemo(() => {
        if (!statusFilter || statusFilter === 'ALL') return orders;
        return orders.filter(o => (o.status || '').toUpperCase() === statusFilter);
    }, [orders, statusFilter]);

    // Ticket Report State
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [orderForTicket, setOrderForTicket] = useState<any>(null);

    const handleViewDetails = (order: any) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    const handleEditOrder = (order: any) => {
        setEditingOrder(order);
        setEditModalVisible(true);
    };

    const handleReportIssue = (order: any) => {
        setOrderForTicket(order);
        setReportModalVisible(true);
    };

    const columns: ColumnsType<OrderType> = [
        {
            title: 'ORDER ID',
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (text, record) => (
                <span
                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-sky-500 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(record)}
                >
                    {text}
                </span>
            ),
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusLower = status?.toLowerCase() || '';
                let badgeClass = 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';

                if (statusLower.includes('cancel') || statusLower.includes('reject')) {
                    badgeClass = 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400';
                } else if (statusLower.includes('completed') || statusLower.includes('paid')) {
                    badgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                } else if (statusLower.includes('received')) {
                    badgeClass = 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]';
                } else if (statusLower.includes('process')) {
                    badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
                } else if (statusLower.includes('pending')) {
                    badgeClass = 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400';
                }

                return (
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-medium border
                        ${badgeClass}
                        backdrop-blur-sm transition-all duration-300
                    `}>
                        {status?.toUpperCase().replace('_', ' ')}
                    </span>
                );
            },
        },
        {
            title: 'SOURCE',
            key: 'source',
            render: (_, record) => (
                <span className="text-zinc-600 dark:text-zinc-400">
                    {record.source || 'Direct'}
                </span>
            ),
        },
        {
            title: 'TOTAL',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (val) => (
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {val ? `$${val.toFixed(2)}` : '$0.00'}
                </span>
            )
        },
        {
            title: 'DATE CREATED',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: Date) => (
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {new Date(date).toLocaleDateString()}
                </span>
            )
        },
        {
            title: 'TRACKING ID',
            dataIndex: 'trackingNumber',
            key: 'trackingNumber',
            render: (id) => (
                <span className="text-zinc-400 font-mono text-xs">
                    {id || '-'}
                </span>
            ),
        },
        {
            title: 'REPORT',
            key: 'report',
            align: 'center',
            render: (_, record) => {
                const s = (record.status || '').toUpperCase();
                // Allow report only if Shipped, Completed, or Received (Paid is usually before shipping, so check)
                // User said: "only orders that have shipped"
                // Let's assume SHIPPED, COMPLETED.
                const canReport = s.includes('SHIPPED') || s.includes('COMPLETED') || s.includes('RECEIVED');

                return (
                    <Tooltip title={canReport ? "Report Issue / Refund Request" : "Order must be shipped to report issue"}>
                        <Button
                            type="text"
                            danger
                            disabled={!canReport}
                            icon={<WarningOutlined />}
                            onClick={() => canReport && handleReportIssue(record)}
                            className={canReport ? "hover:bg-red-50 dark:hover:bg-red-900/20" : "opacity-30"}
                        />
                    </Tooltip>
                );
            }
        },
        {
            title: 'ACTION',
            key: 'action',
            render: (_, record) => {
                const canEdit = (record.status || '').toUpperCase() === 'PENDING_APPROVAL';
                return (
                    <div className="flex gap-2">
                        <Tooltip title="View Details">
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                className="text-zinc-500 hover:text-sky-500"
                                onClick={() => handleViewDetails(record)}
                            />
                        </Tooltip>
                        {canEdit && (
                            <Tooltip title="Edit Order">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    className="text-zinc-500 hover:text-blue-500"
                                    onClick={() => handleEditOrder(record)}
                                />
                            </Tooltip>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="glass-panel rounded-2xl p-1 overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 flex gap-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800">
                <Select
                    placeholder="Filter by Status"
                    allowClear
                    style={{ width: 200 }}
                    onChange={val => setStatusFilter(val)}
                    options={[
                        { label: 'All Statuses', value: 'ALL' },
                        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
                        { label: 'Processing', value: 'PROCESSING' },
                        { label: 'Shipped', value: 'SHIPPED' },
                        { label: 'Completed', value: 'COMPLETED' },
                        { label: 'Cancelled', value: 'CANCELLED' },
                    ]}
                />
            </div>

            <Table
                columns={columns}
                dataSource={filteredOrders}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                className="glass-table"
                scroll={{ x: true }}
            />

            <OrderDetailsModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                order={selectedOrder}
            />

            {orderForTicket && (
                <ReportTicketModal
                    visible={reportModalVisible}
                    onCancel={() => setReportModalVisible(false)}
                    orderId={orderForTicket.id}
                    onSuccess={() => setReportModalVisible(false)}
                />
            )}

            {editingOrder && (
                <EditOrderModal
                    visible={editModalVisible}
                    onCancel={() => setEditModalVisible(false)}
                    order={editingOrder}
                    onSuccess={() => setEditModalVisible(false)}
                />
            )}
        </div>
    );
}
