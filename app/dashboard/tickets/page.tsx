'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Modal, Image, Button, Descriptions, Popconfirm, message } from 'antd';
import { MessageOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import CreateTicketModal from './CreateTicketModal';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    status: string;
    createdAt: string;
    adminReply?: string;
    imageUrl?: string;
    order?: { orderCode: string };
}

export default function UserTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const router = useRouter();

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tickets');
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                message.success('Ticket deleted successfully');
                fetchTickets();
            } else {
                const data = await res.json();
                message.error(data.error || 'Failed to delete ticket');
            }
        } catch (error) {
            message.error('Failed to delete ticket');
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => new Date(d).toLocaleDateString()
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
            render: (text: string) => <span className="font-medium">{text}</span>
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
            title: 'Action',
            key: 'action',
            render: (_: any, record: Ticket) => (
                <Space>
                    <Button
                        icon={<MessageOutlined />}
                        onClick={() => router.push(`/dashboard/tickets/${record.id}`)}
                    >
                        View
                    </Button>
                    {record.status === 'PENDING' && (
                        <Popconfirm
                            title="Delete this ticket?"
                            description="Are you sure you want to delete this ticket? This action cannot be undone."
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Support Tickets</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="bg-blue-600"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Ticket
                </Button>
            </div>

            <div className="glass-panel rounded-2xl p-4">
                <Table
                    dataSource={tickets}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    className="glass-table"
                />
            </div>

            <CreateTicketModal
                visible={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchTickets();
                }}
            />
        </div>
    );
}
