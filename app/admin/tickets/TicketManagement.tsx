'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Input, message, Image, Radio } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    imageUrl: string;
    status: string;
    createdAt: string;
    user: { email: string };
    order?: { orderCode: string };
}

export default function TicketManagement() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [resolveModalVisible, setResolveModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [adminReply, setAdminReply] = useState('');
    const [actionType, setActionType] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');

    const fetchTickets = async () => {
        setLoading(true);
        try {
            // Fetch all tickets and filter locally or fetch based on status if API supports it
            // Current API just returns PENDING, need to update API to support all or filter query
            // Updating API to support status query param first might be better, or fetch all.
            // For now, let's try to fetch all and filter client side or update API.
            // Actually, the previous API implementation hardcoded "where: { status: 'PENDING' }".
            // I should update the API to be flexible first.
            const res = await fetch(`/api/admin/tickets?status=${filterStatus}`);
            const data = await res.json();
            // If API still returns object with error, handle it
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

    const router = useRouter();

    const handleView = (ticket: Ticket) => {
        router.push(`/admin/tickets/${ticket.id}`);
    };

    const handleAction = (ticket: Ticket, type: 'RESOLVED' | 'REJECTED') => {
        setSelectedTicket(ticket);
        setActionType(type);
        setAdminReply('');
        setResolveModalVisible(true);
    };

    const submitResolution = async () => {
        if (!selectedTicket) return;
        try {
            const res = await fetch('/api/admin/tickets/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: selectedTicket.id,
                    resolution: actionType,
                    adminReply
                })
            });

            if (res.ok) {
                message.success(`Ticket marked as ${actionType}`);
                setResolveModalVisible(false);
                // Refresh list - if we are in PENDING view, the resolved ticket should disappear
                fetchTickets();
            } else {
                message.error('Failed to update ticket');
            }
        } catch (error) {
            message.error('Error submitting resolution');
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => new Date(d).toLocaleDateString()
        },
        {
            title: 'User',
            dataIndex: ['user', 'email'],
            key: 'user'
        },
        {
            title: 'Order',
            dataIndex: ['order', 'orderCode'],
            key: 'order',
            render: (text: string) => text || 'N/A'
        },
        {
            title: 'Subject',
            dataIndex: 'subject',
            key: 'subject',
            render: (text: string, record: Ticket) => (
                <div className="cursor-pointer hover:text-blue-500" onClick={() => handleView(record)}>
                    <div className="font-bold">{text}</div>
                    <div className="text-gray-500 text-xs truncate max-w-xs">{record.description}</div>
                </div>
            )
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
            render: (_: any, record: Ticket) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={() => handleView(record)}
                >
                    View Chat
                </Button>
            )
        }
    ];

    return (
        <div>
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

            <Table
                dataSource={tickets}
                columns={columns}
                rowKey="id"
                loading={loading}
                className="glass-table"
                onRow={(record) => ({
                    onClick: () => handleView(record), // Click row to view
                    style: { cursor: 'pointer' }
                })}
            />

            <Modal
                title={`${actionType === 'RESOLVED' ? 'Resolve' : 'Reject'} Ticket`}
                open={resolveModalVisible}
                onOk={submitResolution}
                onCancel={() => setResolveModalVisible(false)}
            >
                <p>User: {selectedTicket?.user.email}</p>
                <p>Subject: {selectedTicket?.subject}</p>
                <div className="mt-4">
                    <label className="block mb-2">Admin Note/Reply:</label>
                    <Input.TextArea
                        rows={4}
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        placeholder="Enter explanation or reply to user..."
                    />
                </div>
            </Modal>
        </div>
    );
}
