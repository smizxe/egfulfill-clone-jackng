'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, notification, Modal, Form, Select, InputNumber, Tabs, Popconfirm } from 'antd';
import { WalletOutlined, PlusOutlined, ReloadOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';

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
    currency?: string;
    exchangeRate?: number;
    amountReceived?: number;
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
    const [rateModalVisible, setRateModalVisible] = useState(false);
    const [currentRate, setCurrentRate] = useState(25000);
    const [form] = Form.useForm();
    const [rateForm] = Form.useForm();
    const [api, contextHolder] = notification.useNotification();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/wallet');
            if (!res.ok) throw new Error('Failed to fetch data');
            const result = await res.json();
            setData(result);
            // Fetch Rate
            fetch('/api/settings').then(r => r.json()).then(d => {
                if (d.rate) {
                    setCurrentRate(d.rate);
                    rateForm.setFieldsValue({ rate: d.rate });
                }
            });
        } catch (error) {
            api.error({ message: 'Error loading admin wallet data' });
            // console.error(error);
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

            api.success({ message: 'Top-up successful' });
            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            api.error({ message: 'Failed to top up' });
        }
    };

    const handleUpdateRate = async (values: any) => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            if (!res.ok) throw new Error('Failed to update rate');
            const data = await res.json();

            api.success({ message: 'Exchange rate updated' });
            setCurrentRate(data.rate);
            setRateModalVisible(false);
        } catch (error) {
            api.error({ message: 'Failed to update rate' });
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

            api.success({ message: 'Request approved successfully' });
            fetchData();
        } catch (error) {
            api.error({ message: 'Failed to approve request' });
        }
    };

    const columnsHistory = [
        {
            title: 'DATE',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => <span className="text-zinc-500 dark:text-zinc-500">{new Date(text).toLocaleString()}</span>,
        },
        {
            title: 'USER',
            dataIndex: ['user', 'email'],
            key: 'user',
            render: (email: string) => <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
        },
        {
            title: 'TYPE',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${type.includes('TOP_UP')
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                    }`}>
                    {type.replace(/_/g, ' ')}
                </span>
            ),
        },
        {
            title: 'AMOUNT',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => <span className="font-bold text-zinc-800 dark:text-zinc-100">${amount.toFixed(2)}</span>,
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    {status}
                </span>
            ),
        },
    ];

    const columnsPending = [
        {
            title: 'DATE',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => <span className="text-zinc-500 dark:text-zinc-500">{new Date(text).toLocaleString()}</span>,
        },
        {
            title: 'USER',
            dataIndex: ['user', 'email'],
            key: 'user',
            render: (email: string) => <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
        },
        {
            title: 'SENT AMOUNT (VND)',
            key: 'amountVnd',
            render: (r: Transaction) => (
                <div>
                    <div className="font-bold text-zinc-800">{r.currency === 'VND' ? `${r.amount.toLocaleString()} VND` : '-'}</div>
                    {r.exchangeRate && <div className="text-xs text-zinc-500">Rate: {r.exchangeRate.toLocaleString()}</div>}
                </div>
            )
        },
        {
            title: 'RECEIVE (USD)',
            key: 'amountUsd',
            render: (r: Transaction) => (
                <span className="font-bold text-emerald-600">
                    ${(r.amountReceived ?? r.amount).toFixed(2)}
                </span>
            )
        },
        {
            title: 'EVIDENCE',
            dataIndex: 'evidenceUrl',
            key: 'evidenceUrl',
            render: (url: string) => (
                url ?
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View Proof
                    </a>
                    : <span className="text-gray-400">No Proof</span>
            ),
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    {status}
                </span>
            ),
        },
        {
            title: 'ACTION',
            key: 'action',
            render: (_: any, record: Transaction) => (
                <Popconfirm
                    title="Approve this top-up?"
                    onConfirm={() => handleApproveRequest(record.id)}
                    okText="Approve"
                    cancelText="Cancel"
                >
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-md shadow-emerald-500/20">
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
            {contextHolder}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">Wallet Management</h1>
                <div className="flex gap-2">
                    <Button
                        icon={<SettingOutlined />}
                        onClick={() => setRateModalVisible(true)}
                        className="h-10 px-4 rounded-xl"
                    >
                        Rate: {currentRate.toLocaleString('en-US')}
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-500/20 h-10 px-5 rounded-xl font-semibold"
                    >
                        Manual Add Funds
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="z-10 relative">
                        <div className="text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Total System Balance</div>
                        <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
                            ${data.users.reduce((acc, user) => acc + user.balance, 0).toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="z-10 relative">
                        <div className="text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Pending Requests</div>
                        <div className="text-3xl font-bold text-orange-500">
                            {pendingRequests.length}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-2 rounded-2xl">
                <div className="flex justify-end px-4 py-2">
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} type="text">Refresh</Button>
                </div>
                <Tabs
                    items={[
                        {
                            key: '1',
                            label: <span className="mx-2">Pending Requests ({pendingRequests.length})</span>,
                            children: (
                                <Table
                                    dataSource={pendingRequests}
                                    columns={columnsPending}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    className="glass-table"
                                />
                            )
                        },
                        {
                            key: '2',
                            label: <span className="mx-2">Transaction History</span>,
                            children: (
                                <Table
                                    dataSource={history}
                                    columns={columnsHistory}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 20 }}
                                    className="glass-table"
                                />
                            )
                        }
                    ]}
                    className="px-2"
                />
            </div>

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

            <Modal
                title="Update Exchange Rate"
                open={rateModalVisible}
                onCancel={() => setRateModalVisible(false)}
                onOk={() => rateForm.submit()}
                width={400}
            >
                <Form form={rateForm} layout="vertical" onFinish={handleUpdateRate}>
                    <Form.Item
                        name="rate"
                        label="VND per 1 USD"
                        rules={[{ required: true, message: 'Please enter rate' }]}
                        extra={`Current: ${currentRate.toLocaleString()} VND = 1 USD`}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
