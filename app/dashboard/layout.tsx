'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, theme } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    ShoppingOutlined,
    OrderedListOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
    UserOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleMenuClick = ({ key }: { key: string }) => {
        router.push(key);
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: 'Profile',
            },
            {
                key: 'logout',
                label: 'Logout',
                onClick: () => router.push('/login'),
            },
        ],
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} className="bg-[#001529]">
                <div className="demo-logo-vertical h-16 flex items-center justify-center text-white font-bold text-xl">
                    {collapsed ? 'EG' : 'EgFulfill'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    onClick={handleMenuClick}
                    items={[
                        {
                            key: '/dashboard',
                            icon: <DashboardOutlined />,
                            label: 'Dashboard',
                        },
                        {
                            key: '/dashboard/catalog',
                            icon: <ShoppingOutlined />,
                            label: 'Catalog',
                        },
                        {
                            key: '/dashboard/orders',
                            icon: <OrderedListOutlined />,
                            label: 'Orders',
                        },
                        {
                            key: '/dashboard/wallet',
                            icon: <CreditCardOutlined />,
                            label: 'Billing',
                        },
                        {
                            key: '/dashboard/orders/import',
                            icon: <CloudUploadOutlined />,
                            label: 'Import Orders',
                        },
                        {
                            key: '/dashboard/tickets',
                            icon: <CustomerServiceOutlined />,
                            label: 'Tickets',
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center px-4 shadow-sm">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <div className="mr-8">
                        <Dropdown menu={userMenu}>
                            <div className="flex items-center cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                <Avatar icon={<UserOutlined />} className="mr-2" />
                                <span className="font-semibold">Jenny</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: 'transparent',
                        borderRadius: borderRadiusLG,
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
