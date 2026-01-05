'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, notification, Modal, Form, Select, InputNumber, Tabs, Popconfirm } from 'antd';
import { WalletOutlined, PlusOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    user: {
        email: string;
        name: string | null;
    };
    isRequest?: boolean;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    balance: number;
}

export default function AdminWalletPage() {
    const [data, setData] = useState<{ transactions: Transaction[], users: User[] }>({ transactions: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/wallet');
            if (!res.ok) throw new Error('Failed to fetch data');
            const result = await res.json();
            setData(result);
        } catch (error) {
            notification.error({ title: 'Error loading admin wallet data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleManualTopUp = async (values: any) => {
        try {
            const res = await fetch('/api/admin/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            if (!res.ok) throw new Error('Transaction failed');

            notification.success({ title: 'Top-up successful' });
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            notification.error({ title: 'Failed to top up' });
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            const res = await fetch('/api/admin/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'confirm_request',
                    topupRequestId: requestId
                })
            });
            if (!res.ok) throw new Error('Confirmation failed');

            notification.success({ title: 'Request approved successfully' });
            fetchData();
        } catch (error) {
            notification.error({ title: 'Failed to approve request' });
        }
    };

    const columnsHistory = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'User',
            dataIndex: ['user', 'email'],
            key: 'user',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color={type.includes('TOP_UP') ? 'green' : 'blue'}>{type}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `$${amount.toFixed(2)}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color="green">{status}</Tag>,
        },
    ];

    const columnsPending = [
        ...columnsHistory.filter(c => c.key !== 'status'), // Reuse columns
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color="gold">{status}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Transaction) => (
                <Popconfirm
                    title="Approve this top-up?"
                    onConfirm={() => handleApproveRequest(record.id)}
                    okText="Approve"
                    cancelText="Cancel"
                >
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                        Approve
                    </Button>
                </Popconfirm>
            )
        }
    ];

    const pendingRequests = data.transactions.filter(t => t.status === 'PENDING');
    const history = data.transactions.filter(t => t.status !== 'PENDING');

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Wallet Management</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Manual Add Funds
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="text-gray-500">Total System Balance</div>
                    <div className="text-2xl font-bold">
                        ${data.users.reduce((acc, user) => acc + user.balance, 0).toFixed(2)}
                    </div>
                </Card>
                <Card>
                    <div className="text-gray-500">Pending Requests</div>
                    <div className="text-2xl font-bold text-orange-500">
                        {pendingRequests.length}
                    </div>
                </Card>
            </div>

            <Card extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />}>
                <Tabs items={[
                    {
                        key: '1',
                        label: `Pending Requests (${pendingRequests.length})`,
                        children: (
                            <Table
                                dataSource={pendingRequests}
                                columns={columnsPending}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 10 }}
                            />
                        )
                    },
                    {
                        key: '2',
                        label: 'Transaction History',
                        children: (
                            <Table
                                dataSource={history}
                                columns={columnsHistory}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 20 }}
                            />
                        )
                    }
                ]} />
            </Card>

            <Modal
                title="Manual Add Funds (Admin)"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleManualTopUp}>
                    <Form.Item name="userId" label="User" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="label">
                            {data.users.map(user => (
                                <Select.Option key={user.id} value={user.id} label={user.email}>
                                    {user.email} (Bal: ${user.balance})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="amount" label="Amount ($)" rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="type" label="Type" initialValue="ADMIN_TOP_UP">
                        <Select>
                            <Select.Option value="ADMIN_TOP_UP">Top Up</Select.Option>
                            <Select.Option value="ADJUSTMENT">Adjustment</Select.Option>
                            <Select.Option value="BONUS">Bonus</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
