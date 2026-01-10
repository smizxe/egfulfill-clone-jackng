'use client';
import React, { useState } from 'react';
import { Modal, Typography, Form, InputNumber, Input, Button, notification, Divider, Upload, message } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Text, Title, Paragraph } = Typography;

interface TopUpModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    email?: string;
    onSuccess?: () => void;
}

export default function TopUpModal({ visible, onClose, userId, email, onSuccess }: TopUpModalProps) {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [form] = Form.useForm();

    // Display email only as requested  
    const transferNote = email || 'your-email';

    // Sync form value when transferNote changes (e.g. email loads)
    React.useEffect(() => {
        if (visible) {
            form.setFieldsValue({ note: transferNote });
            setFileList([]);
        }
    }, [transferNote, visible, form]);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            let evidenceUrl = '';

            // Upload Proof if exists
            if (fileList.length > 0) {
                const formData = new FormData();
                formData.append('file', fileList[0].originFileObj as File);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    evidenceUrl = data.url;
                }
            }

            const res = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: values.amount,
                    transferContent: values.note || transferNote,
                    evidenceUrl
                })
            });

            if (!res.ok) throw new Error('Failed to submit request');

            notification.success({ title: 'Top-up request submitted successfully' });
            form.resetFields();
            setFileList([]);
            onClose();
            if (onSuccess) onSuccess();

        } catch (error) {
            notification.error({ title: 'Failed to submit request' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Top Up Balance"
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={600}
        >
            <div style={{ padding: '0 20px' }}>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={5}>Option 1: Bank Transfer (Scan QR)</Title>
                    <div style={{
                        margin: '10px auto',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        width: 'fit-content'
                    }}>
                        <QRCodeSVG value="BANK_ACCOUNT_INFO_PLACEHOLDER" size={150} level="H" />
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Note: <Text code>{transferNote}</Text>
                    </Text>
                </div>

                <Divider>Confirm Transfer</Divider>

                <Title level={5}>Step 2: Submit Request</Title>
                <Paragraph type="secondary">
                    After transferring, please enter the amount below and attach proof.
                </Paragraph>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="amount"
                        label="Amount Transferred ($)"
                        rules={[{ required: true, message: 'Please enter amount' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            prefix="$"
                            placeholder="e.g. 1000"
                        />
                    </Form.Item>

                    <Form.Item
                        name="note"
                        label="Transfer Content / Transaction Ref"
                        initialValue={transferNote}
                    >
                        <Input placeholder="Enter transaction code or content used" />
                    </Form.Item>

                    <Form.Item label="Proof of Transfer (Optional)">
                        <Upload
                            listType="picture"
                            maxCount={1}
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false}
                        >
                            <Button icon={<UploadOutlined />}>Upload Evidence</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block size="large">
                            Submit Request
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
}
