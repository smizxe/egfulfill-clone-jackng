'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, Avatar, Typography, Button } from 'antd';
import { BellOutlined, WarningOutlined, FileTextOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Text } = Typography;

interface NotificationItem {
    key: string;
    type: string;
    title: string;
    description: string;
    link: string;
    icon: React.ReactNode;
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [count, setCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const notifs: NotificationItem[] = [];

            // 1. Check Low Stock from Inventory API
            try {
                // Fetch inventory with limit? No, for notification we might need to scan all? 
                // Or maybe the API supports a "low stock" filter now? 
                // For now, let's fetch default page or if possible all. 
                // Since pagination was added, /api/admin/inventory defaults to page 1 limit 15.
                // WE need a way to check ALL stock for notifications.
                // We shouldn't fetch 1000 items here. 
                // Ideall we create /api/admin/notifications to do this SERVER SIDE.
                // BUT, to stick to the pattern, let's try to fetch a larger limit or just the first page (MVP risk: missing low stock on page 2).
                // Better approach: Let's increase limit for now or check if API supports "all".
                // If we pass limit=1000 it might work.

                const params = new URLSearchParams({ limit: '100' }); // Check top 100 for now
                const invRes = await fetch(`/api/admin/inventory?${params}`);

                if (invRes.ok) {
                    const data = await invRes.json();
                    const products = data.data || [];

                    products.forEach((p: any) => {
                        if (p.variants && p.variants.length > 0) {
                            p.variants.forEach((v: any) => {
                                if (v.stock <= 2) {
                                    notifs.push({
                                        key: `stock-${v.id}`,
                                        type: 'stock',
                                        title: 'Low Stock Alert',
                                        description: `${p.name} (${v.color}-${v.size}) has ${v.stock} left.`,
                                        link: '/admin/inventory',
                                        icon: <WarningOutlined style={{ color: '#f5222d' }} />
                                    });
                                }
                            });
                        } else {
                            // No variants (virtual/standalone)
                            // "variants" array in API response handles standalone as well (see API logic)
                            // But let's check totalStock just in case API returns empty variants for standalone?
                            // API returns "variants" array populated even for standalone (with virtual variant).
                            // So the loop above should cover it.
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to fetch inventory for notifications');
            }

            // 2. Check Pending Orders
            try {
                const ordersRes = await fetch('/api/admin/orders');
                if (ordersRes.ok) {
                    const orders = await ordersRes.json();
                    const pending = orders.filter((o: any) => o.status === 'PENDING_APPROVAL');

                    if (pending.length > 0) {
                        notifs.push({
                            key: 'pending-orders',
                            type: 'order',
                            title: 'Orders Pending Approval',
                            description: `${pending.length} orders need approval.`,
                            link: '/admin/orders/approval',
                            icon: <FileTextOutlined style={{ color: '#1890ff' }} />
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch orders for notifications');
            }

            setNotifications(notifs);
            setCount(notifs.length);

        } catch (error) {
            console.error("Notification fetch error", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        {
            key: 'header',
            label: (
                <div className="py-2 px-4 font-bold border-b bg-gray-50">
                    Notifications ({count})
                </div>
            ),
            disabled: true
        },
        ...(notifications.length > 0 ? notifications.map(notif => ({
            key: notif.key,
            label: (
                <Link href={notif.link}>
                    <div className="py-2 px-4 hover:bg-gray-50 flex items-start gap-3">
                        <Avatar icon={notif.icon} style={{ backgroundColor: 'transparent' }} />
                        <div>
                            <Text strong style={{ display: 'block' }}>{notif.title}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{notif.description}</Text>
                        </div>
                    </div>
                </Link>
            )
        })) : [{
            key: 'empty',
            label: <div className="py-4 px-8 text-center text-gray-500">No new notifications</div>,
            disabled: true
        }])
    ];

    return (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Badge count={count} offset={[-2, 2]}>
                <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: '18px' }} />}
                    className="flex items-center justify-center"
                />
            </Badge>
        </Dropdown>
    );
}
