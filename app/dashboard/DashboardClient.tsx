'use client';

import React, { useState } from 'react';
import { Row, Col, Button } from 'antd';
import {
    ShoppingOutlined,
    DollarOutlined,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    WalletOutlined,
    RiseOutlined
} from '@ant-design/icons';
import TopUpModal from './components/TopUpModal';

interface DashboardClientProps {
    user: any; // Ideally this should be typed strictly, but given deep relations, any is acceptable for now.
    stats: any[];
}

export default function DashboardClient({ user, stats }: DashboardClientProps) {
    const [topUpModalVisible, setTopUpModalVisible] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                    Dashboard Overview
                </h2>
            </div>

            <Row gutter={[24, 24]}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                        <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">
                                        {stat.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                        {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString('en-US') : stat.value}
                                    </h3>
                                </div>
                                <div
                                    className="p-3 rounded-xl bg-opacity-10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                                    style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                                >
                                    {stat.icon}
                                </div>
                            </div>

                            {stat.title === 'Your Balance' && (
                                <Button
                                    type="primary"
                                    block
                                    className="mt-4 bg-gradient-to-r from-sky-500 to-indigo-500 border-none hover:opacity-90 shadow-lg shadow-sky-500/20"
                                    onClick={() => setTopUpModalVisible(true)}
                                >
                                    Top Up Balance
                                </Button>
                            )}
                        </div>
                    </Col>
                ))}
            </Row>

            <div className="mt-8">
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Best Sellers</h3>
                    <div className="flex items-center justify-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                        <p className="text-zinc-400 dark:text-zinc-500">Scraped Catalog functionality coming soon...</p>
                    </div>
                </div>
            </div>

            <TopUpModal
                visible={topUpModalVisible}
                onClose={() => setTopUpModalVisible(false)}
                userId={user.id}
            />
        </div>
    );
}
