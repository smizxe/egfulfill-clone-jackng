'use client';

import React, { useState } from 'react';
import { theme } from 'antd';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import WalletSidebar from '@/components/Dashboard/WalletSidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const {
        token: { borderRadiusLG },
    } = theme.useToken();

    // Show Right Sidebar on all pages EXECPT tickets
    // Also excluding explicit auth pages if any inside dashboard, but mostly tickets.
    const showRightSidebar = !pathname.includes('/dashboard/tickets');

    return (
        <div className="min-h-screen transition-colors duration-500 ease-in-out">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-3xl" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-sky-500/5 blur-3xl" />
                <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-3xl" />
            </div>

            <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

            <TopBar collapsed={collapsed} />

            <main
                className={`
                    relative z-10 pt-20 pb-8 px-6 transition-all duration-300
                    ${collapsed ? 'ml-20' : 'ml-64'}
                    ${showRightSidebar ? 'mr-72' : ''}
                `}
            >
                <div
                    className="animate-fade-in"
                >
                    {children}
                </div>
            </main>


            {showRightSidebar && <WalletSidebar />}
        </div >
    );
}
