'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, notification } from 'antd';
import { WalletOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import TopUpModal from '@/app/dashboard/components/TopUpModal';

export default function WalletSidebar() {
    const [balance, setBalance] = useState<number | null>(null);
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchWallet = async () => {
        try {
            const res = await fetch('/api/wallet');
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance);
                setCurrency(data.currency);
                setUserId(data.sellerId); // Assuming api returns sellerId or we use logged in user context
                // Update: /api/wallet usually returns wallet object { balance, currency, sellerId ... }
            }
        } catch (error) {
            console.error('Failed to fetch wallet', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
        // Poll every 30 seconds
        const interval = setInterval(fetchWallet, 30000);
        return () => clearInterval(interval);
    }, []);

    // Also listen to custom event to refresh balance? 
    // For now simple polling.

    return (
        <div className="fixed right-0 top-20 bottom-0 w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col z-50 transition-all shadow-xl shadow-zinc-200/50 dark:shadow-black/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 text-lg">
                    <WalletOutlined className="text-zinc-400" /> Wallet
                </h3>
                <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    size="small"
                    onClick={() => { setLoading(true); fetchWallet(); }}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                />
            </div>

            {/* Balance Card - Simple & Clean */}
            <div className="relative p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 shadow-sm mb-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Total Balance</p>
                <div className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100 tracking-tight flex items-baseline gap-1">
                    {loading ? (
                        <Spin size="small" />
                    ) : (
                        <>
                            <span>${balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">{currency}</span>
                        </>
                    )}
                </div>

                <Button
                    type="primary"
                    block
                    size="large"
                    className="h-10 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 border-none shadow-lg shadow-zinc-500/10 dark:shadow-white/5 transition-all active:scale-[0.98]"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                >
                    Top Up Balance
                </Button>
            </div>

            {/* Divider / Info */}
            <div className="mt-auto mb-4">
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                        Funds are used for order fulfillment and subscription renewals.
                    </p>
                </div>
            </div>

            {userId && (
                <TopUpModal
                    visible={modalVisible}
                    onClose={() => { setModalVisible(false); fetchWallet(); }}
                    userId={userId}
                />
            )}
        </div>
    );
}
