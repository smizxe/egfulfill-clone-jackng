'use client';

import React from 'react';
import { Avatar, Dropdown, MenuProps } from 'antd';
import { UserOutlined, MoonOutlined, SunOutlined, BellOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/Providers/ThemeContext';
import { useUser } from '@/components/Providers/UserContext';
import AdminNotifications from '@/app/admin/components/AdminNotifications';
import ProfileModal from '@/components/Shared/ProfileModal';

interface AdminTopBarProps {
    collapsed: boolean;
}

export default function AdminTopBar({ collapsed }: AdminTopBarProps) {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useUser();
    const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

    const userMenu: MenuProps['items'] = [
        {
            key: 'profile',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => setIsProfileModalOpen(true),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: 'Logout',
            danger: true,
            onClick: logout,
        },
    ];

    return (
        <>
            <header className={`
      fixed top-0 right-0 z-40 transition-all duration-300 ease-in-out h-16
      glass-panel border-b border-white/10 flex items-center justify-between px-6
      ${collapsed ? 'left-20' : 'left-64'}
    `}>
                {/* Left Area: Search */}
                <div className="flex items-center text-zinc-500 dark:text-zinc-400">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all">
                        <SearchOutlined className="text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Admin Search..."
                            className="bg-transparent border-none outline-none text-sm placeholder:text-zinc-400 text-zinc-700 dark:text-zinc-200 w-48"
                        />
                    </div>
                </div>

                {/* Right Area: Actions */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <SunOutlined className="text-amber-400" /> : <MoonOutlined className="text-indigo-600" />}
                    </button>

                    {/* Notifications */}
                    <div className="flex items-center">
                        {/* We can reuse the existing notification component or style it */}
                        <AdminNotifications />
                    </div>

                    {/* User Profile */}
                    <Dropdown menu={{ items: userMenu }} trigger={['click']}>
                        <div className="flex items-center gap-3 cursor-pointer pl-2 py-1 transition-opacity hover:opacity-80">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-none">
                                    {user?.name || 'Administrator'}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 capitalize">
                                    {user?.role?.toLowerCase() || 'Super Admin'}
                                </div>
                            </div>
                            <div className="relative">
                                <Avatar
                                    size="large"
                                    icon={<UserOutlined />}
                                    className="bg-gradient-to-br from-pink-500 to-purple-500 shadow-md shadow-pink-500/20"
                                />
                                <div className="absolute inset-0 rounded-full ring-2 ring-white/20 dark:ring-black/20" />
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </header>

            <ProfileModal
                open={isProfileModalOpen}
                onCancel={() => setIsProfileModalOpen(false)}
                onSuccess={(updatedUser) => {
                    // Force reload or better state management
                    window.location.reload();
                }}
                user={user}
            />
        </>
    );
}
