'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Tooltip } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    UserOutlined,
    TeamOutlined,
    WalletOutlined,
    CustomerServiceOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PrinterOutlined,
    TruckOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import { Package } from 'lucide-react';
import { useTheme } from '@/components/Providers/ThemeContext';

interface AdminSidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

export default function AdminSidebar({ collapsed, onCollapse }: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();

    const menuItems = [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/admin/orders/approval', icon: <Package size={18} />, label: 'Order Approval' },
        { key: '/admin/products', icon: <ShoppingOutlined />, label: 'Products' },
        { key: '/admin/inventory', icon: <ShopOutlined />, label: 'Inventory' },
        { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
        { key: '/admin/wallet', icon: <WalletOutlined />, label: 'Wallet' },
        // { key: '/admin/tickets', icon: <CustomerServiceOutlined />, label: 'Tickets' }, // Not implemented
        { key: '/admin/production', icon: <PrinterOutlined />, label: 'Production Release' },
        { key: '/admin/shipping', icon: <TruckOutlined />, label: 'Shipping' },
        // { key: '/admin/print', icon: <PrinterOutlined />, label: 'Print Labels' }, // Removed per request
    ];

    return (
        <aside
            className={`
        fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        glass-panel border-r border-white/20
      `}
        >
            {/* LOGO */}
            <div className="h-16 flex items-center justify-center relative overflow-hidden">
                <div className={`
          font-bold text-2xl tracking-tight transition-all duration-300
          bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent
          ${collapsed ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}
        `}>
                    AdminPanel
                </div>
                <div className={`
          absolute transition-all duration-300 font-bold text-xl
          bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent
          ${collapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}>
                    AP
                </div>
            </div>

            {/* MENU */}
            <nav className="mt-4 px-3 space-y-2 overflow-y-auto h-[calc(100vh-8rem)] scrollbar-hide">
                {menuItems.map((item) => {
                    const isActive = pathname === item.key;
                    return (
                        <div key={item.key}>
                            <Tooltip title={collapsed ? item.label : ''} placement="right">
                                <button
                                    onClick={() => router.push(item.key)}
                                    className={`
                    w-full flex items-center transition-all duration-200 group relative
                    ${collapsed ? 'justify-center px-0 py-3 rounded-xl' : 'px-4 py-3 rounded-xl'}
                    ${isActive
                                            ? 'bg-pink-500/10 dark:bg-pink-400/20 text-pink-600 dark:text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'}
                  `}
                                >
                                    <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>

                                    <span className={`
                    ml-3 font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300
                    ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                  `}>
                                        {item.label}
                                    </span>

                                    {/* Active Indicator Line for Collapsed Mode */}
                                    {collapsed && isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full" />
                                    )}

                                    {/* Hover Glow Effect */}
                                    {!isActive && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    )}
                                </button>
                            </Tooltip>
                        </div>
                    );
                })}
            </nav>

            {/* COLLAPSE TOGGLE (Bottom) */}
            <div className="absolute bottom-4 left-0 w-full px-3 flex justify-center bg-transparent backdrop-blur-sm pt-2">
                <Button
                    type="text"
                    className="text-zinc-500 dark:text-zinc-400 hover:text-pink-500 dark:hover:text-pink-400"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => onCollapse(!collapsed)}
                />
            </div>
        </aside>
    );
}
