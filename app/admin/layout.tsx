'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from 'antd';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import AdminTopBar from '@/components/Admin/AdminTopBar';
import { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen transition-colors duration-500 ease-in-out">
            {/* Background Decorations - Slightly different colors for Admin to distinguish */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pink-500/5 blur-3xl" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-3xl" />
                <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />

            <AdminTopBar collapsed={collapsed} />

            <main
                className={`
                    relative z-10 pt-20 pb-8 px-6 transition-all duration-300
                    ${collapsed ? 'ml-20' : 'ml-64'}
                `}
            >
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
