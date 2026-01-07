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
            title: 'EMAIL',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
        },
        {
            title: 'NAME',
            dataIndex: 'name',
            key: 'name',
            render: (name: string | null) => <span className="text-zinc-600 dark:text-zinc-400">{name || '-'}</span>,
        },
        {
            title: 'BALANCE',
            dataIndex: 'balance',
            key: 'balance',
            render: (balance: number) => <span className="font-bold text-emerald-600 dark:text-emerald-400">${balance.toFixed(2)}</span>,
        },
        {
            title: 'ROLE',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${role === 'ADMIN'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                    }`}>
                    {role}
                </span>
            ),
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space>
                    <Button
                        size="small"
                        icon={<StopOutlined />}
                        onClick={() => handleSuspend(record.id)}
                        className="text-amber-600 border-amber-200 hover:text-amber-700 hover:border-amber-300 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-900/20 bg-transparent"
                    >
                        Suspend
                    </Button>
                    <Button
                        size="small"
                        danger
                        onClick={() => handleBan(record.id)}
                        className="bg-transparent"
                    >
                        Ban
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">User Management</h2>

            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 w-[300px] focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
                    <SearchOutlined className="text-zinc-400" />
                    <input
                        className="bg-transparent border-none outline-none text-sm text-zinc-700 dark:text-zinc-200 w-full placeholder:text-zinc-400"
                        placeholder="Search by email or name..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden p-1">
                <Table
                    dataSource={filteredUsers}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                    className="glass-table"
                />
            </div>
        </div>
    );
}
