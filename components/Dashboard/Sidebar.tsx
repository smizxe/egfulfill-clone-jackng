'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Tooltip } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
    CloudUploadOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    RightOutlined
} from '@ant-design/icons';
import { Package, Ticket } from 'lucide-react';
import { useTheme } from '@/components/Providers/ThemeContext';

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();

    const menuItems = [
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/dashboard/catalog', icon: <ShoppingOutlined />, label: 'Catalog' },
        { key: '/dashboard/orders', icon: <Package size={18} />, label: 'Orders' },
        { key: '/dashboard/wallet', icon: <CreditCardOutlined />, label: 'Billing' },
        { key: '/dashboard/orders/import', icon: <CloudUploadOutlined />, label: 'Import Orders' },
        { key: '/dashboard/tickets', icon: <Ticket size={18} />, label: 'Tickets' },
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
          bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent
          ${collapsed ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}
        `}>
                    EmFulFill
                </div>
                <div className={`
          absolute transition-all duration-300 font-bold text-xl
          bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent
          ${collapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}>
                    EM
                </div>
            </div>

            {/* MENU */}
            <nav className="mt-4 px-3 space-y-2">
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
                                            ? 'bg-sky-500/10 dark:bg-sky-400/20 text-sky-600 dark:text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
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

                                    {/* Active Indicator Line for Collapsed Mode (optional, nice touch) */}
                                    {collapsed && isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-r-full" />
                                    )}

                                    {/* Hover Glow Effect */}
                                    {!isActive && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    )}
                                </button>
                            </Tooltip>
                        </div>
                    );
                })}
            </nav>

            {/* COLLAPSE TOGGLE (Bottom) */}
            <div className="absolute bottom-4 left-0 w-full px-3 flex justify-center">
                <Button
                    type="text"
                    className="text-zinc-500 dark:text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => onCollapse(!collapsed)}
                />
            </div>
        </aside>
    );
}
