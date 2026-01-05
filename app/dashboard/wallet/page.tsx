'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Statistic, Button, Tag, notification } from 'antd';
import { WalletOutlined, ReloadOutlined, PlusCircleOutlined } from '@ant-design/icons';
import TopUpModal from '../components/TopUpModal';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    note?: string;
}

export default function WalletPage() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [email, setEmail] = useState(''); // Added email state
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wallet');
            if (!res.ok) throw new Error('Failed to fetch wallet data');
            const data = await res.json();
            setBalance(data.balance);
            setTransactions(data.transactions);
            setEmail(data.email || ''); // Set email
        } catch (error) {
            notification.error({ title: 'Error loading wallet data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color={type === 'TOP_UP_REQUEST' ? 'orange' : type === 'CREDIT' ? 'green' : 'red'}>{type}</Tag>,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number, record: Transaction) => (
                <span style={{
                    color: record.type === 'DEBIT' ? 'red' : record.type === 'TOP_UP_REQUEST' ? '#faad14' : 'green',
                    fontWeight: 500
                }}>
                    {record.type === 'DEBIT' ? '-' : '+'}${amount.toFixed(2)}
                </span>
            ),
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note',
            responsive: ['md'],
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'PENDING' ? 'gold' : status === 'COMPLETED' ? 'green' : 'default'}>
                    {status}
                </Tag>
            ),
        },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Billing</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <Statistic
                        title="Wallet Balance"
                        value={balance}
                        precision={2}
                        styles={{ content: { color: '#3f8600' } }}
                        prefix="$"
                        suffix={<WalletOutlined />}
                    />
                    <Button
                        type="primary"
                        className="mt-4"
                        icon={<PlusCircleOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        block
                    >
                        Top Up Balance
                    </Button>
                </Card>
            </div>

            <Card title="Transaction History" extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />}>
                <Table
                    dataSource={transactions}
                    columns={columns as any}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <TopUpModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                userId="me"
                email={email} // Pass email
                onSuccess={fetchData}
            />
        </div>
    );
}
