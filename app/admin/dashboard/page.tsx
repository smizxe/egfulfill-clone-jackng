import { prisma } from '@/lib/prisma';
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, ShoppingOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';

export default async function AdminOverviewPage() {
    // Quick Stats
    const sellersCount = await prisma.seller.count();
    const productsCount = await prisma.product.count();
    const ordersCount = await prisma.order.count();

    // Total Balance is now on Wallet model, not User
    const walletAgg = await prisma.wallet.aggregate({
        _sum: { balance: true }
    });
    const totalBalance = walletAgg._sum.balance || 0;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
            <Row gutter={16}>
                <Col span={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Total Sellers"
                            value={sellersCount}
                            prefix={<TeamOutlined />}
                            styles={{ content: { color: '#3f8600' } }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Total Products"
                            value={productsCount}
                            prefix={<ShoppingOutlined />}
                            styles={{ content: { color: '#1890ff' } }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Total Orders"
                            value={ordersCount}
                            prefix={<UserOutlined />}
                            styles={{ content: { color: '#722ed1' } }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card variant="borderless">
                        <Statistic
                            title="Wallet Balances Hold"
                            value={totalBalance}
                            precision={2}
                            prefix={<DollarOutlined />}
                            styles={{ content: { color: '#cf1322' } }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
                <h3>Welcome back, Admin</h3>
                <p className="text-gray-500">Select a section from the sidebar to manage the platform.</p>
            </div>
        </div>
    );
}
