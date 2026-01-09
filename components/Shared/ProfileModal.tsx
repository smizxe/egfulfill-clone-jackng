'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, LoadingOutlined } from '@ant-design/icons';

interface User {
    name?: string | null;
    email?: string | null;
}

interface ProfileModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (updatedUser: any) => void;
    user: User | null;
}

export default function ProfileModal({ open, onCancel, onSuccess, user }: ProfileModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                newPassword: '',
                confirmPassword: '',
            });
        }
    }, [open, user, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    password: values.newPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            message.success('Profile updated successfully');
            onSuccess(data.user);
            onCancel();
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Edit Profile"
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Save Changes"
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <div className="text-sm text-gray-500 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800/30">
                    Update your personal information below. Leave password fields blank if you don't wish to change it.
                </div>

                <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                >
                    <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Your Name" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' }
                    ]}
                >
                    <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="name@example.com" />
                </Form.Item>

                <div className="border-t border-gray-100 dark:border-gray-800 my-4 pt-4">
                    <h4 className="text-sm font-semibold mb-3">Change Password</h4>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}
                    >
                        <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="New Password (optional)" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={['newPassword']}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    if (!getFieldValue('newPassword') && !value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Confirm New Password" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
}
