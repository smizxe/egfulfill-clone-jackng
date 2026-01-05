'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    ShoppingOutlined,
    WalletOutlined,
    OrderedListOutlined,
    RocketOutlined,
    LogoutOutlined,
    CheckSquareOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Overview',
        },
        {
            key: '/admin/orders/approval',
            icon: <CheckSquareOutlined />,
            label: 'Order Approvals',
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'User Management',
        },
        {
            key: '/admin/products',
            icon: <ShoppingOutlined />,
            label: 'Products',
        },
        {
            key: '/admin/wallet',
            icon: <WalletOutlined />,
            label: 'Wallet & Transactions',
        },
        {
            key: '/admin/inventory',
            icon: <ShoppingOutlined />, // Reusing Shopping for Inventory
            label: 'Inventory',
        },
        {
            key: '/admin/production',
            icon: <OrderedListOutlined />, // Reusing OrderedList
            label: 'Production (Release)',
        },
        {
            key: '/admin/shipping',
            icon: <RocketOutlined />,
            label: 'Shipping',
        },
    ];

    return (
        <Sider theme="light" width={250} style={{ minHeight: '100vh', borderRight: '1px solid #f0f0f0' }}>
            <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    EG Fulfillment
                </h1>
                <span style={{ fontSize: '12px', color: '#999' }}>Admin Panel</span>
            </div>

            <Menu
                mode="inline"
                selectedKeys={[pathname]}
                style={{ borderRight: 0 }}
                items={menuItems}
                onClick={({ key }) => router.push(key)}
            />

            <div style={{ position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid #f0f0f0' }}>
                <Menu
                    mode="inline"
                    items={[
                        {
                            key: 'logout',
                            icon: <LogoutOutlined />,
                            label: 'Back to Site',
                        }
                    ]}
                    onClick={() => router.push('/')}
                />
            </div>
        </Sider>
    );
}
