'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface ReportTicketModalProps {
    visible: boolean;
    onCancel: () => void;
    orderId: string;
    onSuccess: () => void; // To close both modals or just this one
}

export default function ReportTicketModal({ visible, onCancel, orderId, onSuccess }: ReportTicketModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (fileList.length === 0) {
                message.error('Please upload evidence image');
                return;
            }

            setLoading(true);

            // 1. Upload Image
            const formData = new FormData();
            formData.append('file', fileList[0].originFileObj as File);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Failed to upload image');
            const { url } = await uploadRes.json();

            // 2. Create Ticket
            const ticketRes = await fetch('/api/tickets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    subject: values.subject,
                    description: values.description,
                    imageUrl: url
                })
            });

            if (!ticketRes.ok) throw new Error('Failed to create ticket');

            message.success('Report submitted successfully');
            form.resetFields();
            setFileList([]);
            onSuccess();
        } catch (error) {
            console.error(error);
            message.error('Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Report Issue"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="Submit Report"
            okButtonProps={{ className: 'bg-red-500 hover:bg-red-600' }}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="subject"
                    label="Subject"
                    rules={[{ required: true, message: 'Please enter a subject' }]}
                >
                    <Input placeholder="e.g. Wrong item received, Damaged..." />
                </Form.Item>
                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please describe the issue' }]}
                >
                    <Input.TextArea rows={4} placeholder="Describe the issue in detail..." />
                </Form.Item>
                <Form.Item label="Evidence (Required)">
                    <Upload
                        listType="picture"
                        maxCount={1}
                        fileList={fileList}
                        onChange={({ fileList }) => setFileList(fileList)}
                        beforeUpload={() => false} // Manual upload
                    >
                        <Button icon={<UploadOutlined />}>Upload Image</Button>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
}
