'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, message, Popconfirm, Tabs, Image, Radio, Input } from 'antd';
import { EyeOutlined, InfoCircleOutlined, WarningOutlined, ReloadOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import OrderImportModal from './OrderImportModal';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    imageUrl?: string;
    status: string;
    createdAt: string;
    user: { email: string };
    order?: { orderCode: string };
    orderId?: string;
}

export default function TicketManagement() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [resolveModalVisible, setResolveModalVisible] = useState(false); // Kept for generic resolve if needed
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [adminReply, setAdminReply] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');
    const [activeTab, setActiveTab] = useState('SUPPORT'); // SUPPORT or ORDER_ISSUES

    // Replacement Modal State
    const [importModalVisible, setImportModalVisible] = useState(false);

    const router = useRouter();

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/tickets?status=${filterStatus}`);
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setTickets(data);
            } else {
                setTickets([]);
            }
        } catch (error) {
            message.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [filterStatus]);

    const handleView = (ticket: Ticket) => {
        router.push(`/admin/tickets/${ticket.id}`);
    };

    const handleResolve = async (ticketId: string, decision: 'APPROVE' | 'REJECT' | 'REFUND' | 'REPLACEMENT') => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/tickets/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, decision })
            });
            const data = await res.json();

            if (res.ok) {
                message.success(`Ticket ${decision.toLowerCase()} successful`);
                setTickets(prev => prev.filter(t => t.id !== ticketId));
            } else {
                message.error(data.error || 'Failed to resolve ticket');
            }
        } catch (error) {
            console.error(error);
            message.error('Error resolving ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleReplacementClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setImportModalVisible(true);
    };

    const handleImportSuccess = () => {
        setImportModalVisible(false);
        if (selectedTicket) {
            handleResolve(selectedTicket.id, 'REPLACEMENT');
        }
    };

    // Helper to render Actions
    const renderActions = (record: Ticket) => {
        // Order Issue Logic
        if (record.orderId) {
            const subject = (record.subject || '').toLowerCase();
            const isRefund = subject.includes('refund');
            const isReplacement = subject.includes('replacement');

            // If Refund Request
            if (isRefund) {
                return (
                    <div className="flex gap-2">
                        <Button size="small" onClick={() => handleView(record)} icon={<EyeOutlined />}>
                            View
                        </Button>
                        <Popconfirm
                            title="Issue Refund?"
                            description="This will refund the order value to the seller's wallet."
                            onConfirm={() => handleResolve(record.id, 'REFUND')}
                            okText="Refund"
                            cancelText="Cancel"
                            okButtonProps={{ loading: loading, danger: true }}
                        >
                            <Button type="primary" size="small" icon={<DollarCircleOutlined />} className="bg-green-600 hover:bg-green-500">
                                Refund
                            </Button>
                        </Popconfirm>
                        <Button danger size="small" onClick={() => handleResolve(record.id, 'REJECT')} loading={loading}>
                            Reject
                        </Button>
                    </div>
                );
            }

            // If Replacement Request
            if (isReplacement) {
                return (
                    <div className="flex gap-2">
                        <Button size="small" onClick={() => handleView(record)} icon={<EyeOutlined />}>
                            View
                        </Button>
                        <Button
                            type="primary"
                            size="small"
                            icon={<ReloadOutlined />}
                            className="bg-blue-600 hover:bg-blue-500"
                            onClick={() => handleReplacementClick(record)}
                        >
                            Replacement
                        </Button>
                        <Button danger size="small" onClick={() => handleResolve(record.id, 'REJECT')} loading={loading}>
                            Reject
                        </Button>
                    </div>
                );
            }
        }

        // Generic / Support Ticket Actions
        return (
            <div className="flex gap-2">
                <Button size="small" onClick={() => handleView(record)} icon={<EyeOutlined />}>
                    View
                </Button>
                {record.status === 'PENDING' && (
                    <Button type="primary" size="small" onClick={() => handleResolve(record.id, 'APPROVE')}>
                        Resolve
                    </Button>
                )}
            </div>
        );
    };

    const columns = [
        {
            title: 'Subject',
            dataIndex: 'subject',
            key: 'subject',
            render: (text: string) => <span className="font-medium">{text}</span>
        },
        {
            title: 'User',
            dataIndex: ['user', 'email'],
            key: 'user',
        },
        {
            title: 'Order Code',
            key: 'order',
            render: (_: any, record: Ticket) => record.order?.orderCode ? <Tag color="blue">{record.order.orderCode}</Tag> : '-'
        },
        {
            title: 'Evidence',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            render: (url: string) => (
                url ? <Image src={url} width={50} height={50} className="object-cover rounded" /> : 'No Image'
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'gold';
                if (status === 'RESOLVED') color = 'green';
                if (status === 'REJECTED') color = 'red';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_: any, record: Ticket) => renderActions(record)
        }
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Ticket Management</h1>

            <div className="mb-4 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm">
                <span className="font-semibold text-gray-600 dark:text-gray-300 mb-2 md:mb-0">Filter Tickets:</span>
                <Radio.Group
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    buttonStyle="solid"
                >
                    <Radio.Button value="PENDING">Unsolved (Pending)</Radio.Button>
                    <Radio.Button value="RESOLVED">Resolved</Radio.Button>
                    <Radio.Button value="REJECTED">Rejected</Radio.Button>
                    <Radio.Button value="ALL">All Tickets</Radio.Button>
                </Radio.Group>
            </div>

            {/* Tabs for Support vs Order Issues */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="px-4 pt-2"
                    items={[
                        {
                            key: 'SUPPORT',
                            label: 'Support Requests (General)',
                            icon: <InfoCircleOutlined />,
                            children: (
                                <Table
                                    dataSource={tickets.filter(t => !t.orderId)}
                                    columns={columns.filter(c => c.key !== 'order')} // Hide Order column for general support
                                    rowKey="id"
                                    loading={loading}

                                />
                            )
                        },
                        {
                            key: 'ORDER_ISSUES',
                            label: 'Order Issues / Reports',
                            icon: <WarningOutlined />,
                            children: (
                                <Table
                                    dataSource={tickets.filter(t => t.orderId)}
                                    columns={columns} // Show all columns including Order Code
                                    rowKey="id"
                                    loading={loading}
                                />
                            )
                        }
                    ]}
                />
            </div>

            {/* Replacement Import Modal */}
            {selectedTicket && (
                <OrderImportModal
                    visible={importModalVisible}
                    onCancel={() => setImportModalVisible(false)}
                    onSuccess={handleImportSuccess}
                    mode="REPLACEMENT"
                    sellerId={selectedTicket.user?.email} // using email as ID/identifier for now
                />
            )}
        </div>
    );
}

