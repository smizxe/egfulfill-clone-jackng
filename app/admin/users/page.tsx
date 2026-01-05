'use client';

import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Tag, Space, Modal, notification } from 'antd';
import { SearchOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    balance: number;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            notification.error({ title: 'Error loading users' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSuspend = (userId: string) => {
        Modal.confirm({
            title: 'Suspend User?',
            content: 'This will temporarily disable user access.',
            onOk: async () => {
                // TODO: Implement suspend API
                notification.info({ title: 'Suspend feature coming soon' });
            }
        });
    };

    const handleBan = (userId: string) => {
        Modal.confirm({
            title: 'Ban User?',
            content: 'This will permanently ban the user.',
            okText: 'Ban',
            okType: 'danger',
            onOk: async () => {
                // TODO: Implement ban API
                notification.info({ title: 'Ban feature coming soon' });
            }
        });
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchText.toLowerCase()))
    );

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string | null) => name || '-',
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance: number) => `$${balance.toFixed(2)}`,
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space>
                    <Button
                        size="small"
                        icon={<StopOutlined />}
                        onClick={() => handleSuspend(record.id)}
                    >
                        Suspend
                    </Button>
                    <Button
                        size="small"
                        danger
                        onClick={() => handleBan(record.id)}
                    >
                        Ban
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">User Management</h2>

            <div className="mb-4">
                <Input
                    placeholder="Search by email or name..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                />
            </div>

            <Table
                dataSource={filteredUsers}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 20 }}
            />
        </div>
    );
}
