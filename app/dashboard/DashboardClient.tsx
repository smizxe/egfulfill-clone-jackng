'use client';

import React, { useState } from 'react';
import { Card, Statistic, Row, Col, Button } from 'antd';
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Dashboard overview</h2>
            </div>

            <Row gutter={[16, 16]}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                        <Card variant="borderless" hoverable className="h-full shadow-sm">
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.prefix}
                                styles={stat.styles}
                                precision={stat.title === 'Your Balance' ? 2 : 0}
                            />
                            <div style={{ color: stat.color, marginTop: 10, fontSize: 24 }}>
                                {stat.icon}
                            </div>
                            {stat.title === 'Your Balance' && (
                                <Button
                                    type="primary"
                                    block
                                    style={{ marginTop: 16 }}
                                    onClick={() => setTopUpModalVisible(true)}
                                >
                                    Top Up Balance
                                </Button>
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>

            <div className="mt-8">
                <Card title="Best Sellers" variant="borderless" className="shadow-sm">
                    <p className="text-gray-500 text-center py-10">Scraped Catalog functionality coming soon...</p>
                </Card>
            </div>

            <TopUpModal
                visible={topUpModalVisible}
                onClose={() => setTopUpModalVisible(false)}
                userId={user.id}
            />
        </div>
    );
}
