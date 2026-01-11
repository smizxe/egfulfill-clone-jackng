'use client';

import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Segmented, Button, Tag, Space, Card, Modal } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: string;
    refType: string;
    refId: string;
    note: string;
    createdAt: string;
}

export default function BillingClient() {
    const [range, setRange] = useState<'day' | 'month' | 'year'>('month');
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                range,
                date: selectedDate.toISOString()
            });
            const res = await fetch(`/api/billing/transactions?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [range, selectedDate]);

    const handlePrint = () => {
        // Open a print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const totalAmount = transactions.reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);

            printWindow.document.write(`
                <html>
                <head>
                    <title>Invoice - ${selectedDate.format('DD/MM/YYYY')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { margin-bottom: 30px; }
                        .total { margin-top: 20px; font-weight: bold; font-size: 1.2em; text-align: right; }
                        .footer { margin-top: 50px; text-align: center; color: #888; font-size: 0.8em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Summary Statement / Invoice</h1>
                        <p>Date Range: ${range.toUpperCase()} - ${selectedDate.format('DD/MM/YYYY')}</p>
                        <p>Generated on: ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Reference</th>
                                <th>Note</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(t => `
                                <tr>
                                    <td>${dayjs(t.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                                    <td>${t.type}</td>
                                    <td>${t.refType} #${t.refId || '-'}</td>
                                    <td>${t.note || ''}</td>
                                    <td>${t.type === 'DEBIT' ? '-' : ''}$${t.amount.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="total">
                        Total Movement: $${totalAmount.toFixed(2)}
                    </div>

                    <div class="footer">
                        <p>Thank you for your business!</p>
                    </div>

                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'CREDIT' ? 'green' : 'red'}>{type}</Tag>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number, record: Transaction) => (
                <span className={record.type === 'CREDIT' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {record.type === 'DEBIT' ? '-' : '+'}${amount.toFixed(2)}
                </span>
            )
        },
        {
            title: 'Reference',
            key: 'ref',
            render: (_: any, record: Transaction) => (
                <span>{record.refType} <span className="text-gray-400">#{record.refId?.substring(0, 8)}...</span></span>
            )
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note',
        }
    ];

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent m-0">
                    Billing & Invoices
                </h1>

                <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <Segmented
                        options={[
                            { label: 'Day', value: 'day' },
                            { label: 'Month', value: 'month' },
                            { label: 'Year', value: 'year' },
                        ]}
                        value={range}
                        onChange={(val: any) => setRange(val)}
                    />
                    <DatePicker
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date || dayjs())}
                        picker={range === 'day' ? 'date' : range}
                        allowClear={false}
                        className="w-32"
                    />
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        disabled={transactions.length === 0}
                    >
                        Print Invoice
                    </Button>
                </div>
            </div>

            <div className="glass-panel rounded-2xl p-1 overflow-hidden">
                <Table
                    dataSource={transactions}
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
