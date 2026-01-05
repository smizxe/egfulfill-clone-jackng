'use client';

import React from 'react';
import { Layout, Button, Avatar, Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import AdminSidebar from './components/AdminSidebar';

const { Header, Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AdminSidebar />
            <Layout>
                <Header style={{
                    background: '#fff',
                    padding: '0 24px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 500 }}>Administrator</span>
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#f5f5f5' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
