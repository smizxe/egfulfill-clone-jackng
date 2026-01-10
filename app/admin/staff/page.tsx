
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Tag, Space, Card } from 'antd';
import { UserAddOutlined, HistoryOutlined, EditOutlined } from '@ant-design/icons';

interface StaffUser {
    id: string;
    email: string;
    name?: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        assignedJobs: number;
    };
}

interface JobHistory {
    id: string;
    jobCode: string;
    sku: string;
    status: string;
    updatedAt: string;
}

export default function StaffManagementPage() {
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm] = Form.useForm();
    const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
    const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/staff');
            const data = await res.json();
            if (Array.isArray(data)) {
                setStaff(data);
            } else {
                message.error('Failed to load staff list');
            }
        } catch (error) {
            message.error('Error fetching staff');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleCreate = async (values: any) => {
        try {
            const res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await res.json();
            if (res.ok) {
                message.success('Staff created successfully');
                setIsModalOpen(false);
                form.resetFields();
                fetchStaff();
            } else {
                message.error(data.error || 'Failed to create staff');
            }
        } catch (error) {
            message.error('Error creating staff');
        }
    };

    const handleEdit = (record: StaffUser) => {
        setEditingStaff(record);
        editForm.setFieldsValue({
            name: record.name,
            email: record.email,
        });
        setEditModalOpen(true);
    };

    const handleUpdate = async (values: any) => {
        if (!editingStaff) return;
        try {
            const res = await fetch('/api/admin/staff/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, id: editingStaff.id }),
            });
            const data = await res.json();
            if (res.ok) {
                message.success('Staff updated successfully');
                setEditModalOpen(false);
                editForm.resetFields();
                setEditingStaff(null);
                fetchStaff();
            } else {
                message.error(data.error || 'Failed to update staff');
            }
        } catch (error) {
            message.error('Error updating staff');
        }
    };

    const viewHistory = async (record: StaffUser) => {
        setSelectedStaff(record);
        setHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/admin/staff/${record.id}/jobs`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setJobHistory(data);
            }
        } catch (error) {
            message.error('Error fetching history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => text || <span className="text-gray-400">N/A</span>
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleDateString(),
        },
        {
            title: 'Jobs Processed',
            dataIndex: ['_count', 'assignedJobs'],
            key: 'jobs',
            render: (count: number) => <Tag color="blue">{count} Jobs</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: StaffUser) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        icon={<HistoryOutlined />}
                        onClick={() => viewHistory(record)}
                    >
                        History
                    </Button>
                </Space>
            ),
        },
    ];

    const historyColumns = [
        { title: 'Job Code', dataIndex: 'jobCode', key: 'jobCode' },
        { title: 'SKU', dataIndex: 'sku', key: 'sku' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'COMPLETED' ? 'green' : 'orange'}>{status}</Tag>
            )
        },
        {
            title: 'Last Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (text: string) => new Date(text).toLocaleString()
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Add New Staff
                </Button>
            </div>

            <Card className="shadow-sm">
                <Table
                    dataSource={staff}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            {/* Create Modal */}
            <Modal
                title="Create New Staff"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Staff Name"
                        rules={[{ required: true, message: 'Please enter staff name' }]}
                    >
                        <Input placeholder="Enter full name" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, min: 6 }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Create Account
                    </Button>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Staff"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                footer={null}
            >
                <Form form={editForm} onFinish={handleUpdate} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Staff Name"
                        rules={[{ required: true, message: 'Please enter staff name' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="New Password"
                        help="Leave blank to keep current password"
                    >
                        <Input.Password placeholder="Enter new password to change" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Update Staff
                    </Button>
                </Form>
            </Modal>

            <Modal
                title={`Job History: ${selectedStaff?.email}`}
                open={historyModalOpen}
                onCancel={() => setHistoryModalOpen(false)}
                footer={null}
                width={800}
            >
                <Table
                    dataSource={jobHistory}
                    columns={historyColumns}
                    rowKey="id"
                    loading={historyLoading}
                    pagination={{ pageSize: 5 }}
                />
            </Modal>
        </div>
    );
}
