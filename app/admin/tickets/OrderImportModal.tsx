'use client';

import React, { useState } from 'react';
import { Modal, Upload, Button, Steps, Result, Table, Tag, Typography, Alert, message, Space } from 'antd';
import { InboxOutlined, CheckCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

const { Dragger } = Upload;
const { Text } = Typography;

interface OrderImportModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: (orderIds: string[]) => void;
    sellerId?: string; // Optional if not replacement
    mode?: 'NORMAL' | 'REPLACEMENT';
}

export default function OrderImportModal({ visible, onCancel, onSuccess, sellerId, mode = 'NORMAL' }: OrderImportModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [importResult, setImportResult] = useState<any>(null);

    const handleFileUpload = async () => {
        const formData = new FormData();
        fileList.forEach((file) => {
            formData.append('file', (file.originFileObj || file) as any);
        });

        setUploading(true);
        try {
            // Dry Run (Mode 1) doesn't need sellerId usually as it just parses, 
            // but if validation depended on wallet, it might. 
            // Current implementation of Mode 1 doesn't seem to check specific seller wallet deeply other than returning balance.
            // Let's passed it just in case future-proofing, but standard Route Mode 1 might need update if we want exact wallet check.
            // For now, let's assume Mode 1 is generic parsing.
            const res = await fetch('/api/import', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success && data.dryRun) {
                const rows = data.parsedOrders.map((o: any, idx: number) => ({
                    ...o,
                    key: o.id || o.tempId || `row-${idx}`
                }));
                setParsedData(rows);

                const validKeys = rows.filter((r: any) => r.valid).map((r: any) => r.key);
                setSelectedRowKeys(validKeys);

                setCurrentStep(1);
            } else {
                message.error(data.error || 'Failed to parse file');
            }
        } catch (error) {
            console.error(error);
            message.error('Network error during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Please select at least one order to import');
            return;
        }

        setUploading(true);
        try {
            const ordersToImport = parsedData.filter(row => selectedRowKeys.includes(row.key));

            // Include targetSellerId for Admin override
            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orders: ordersToImport,
                    targetSellerId: sellerId
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setImportResult({
                    success: true,
                    count: data.importedCount,
                });
                setCurrentStep(2);
                setTimeout(() => {
                    onSuccess([]); // Callback to parent
                }, 2000);
            } else {
                message.error(data.error || 'Import failed');
            }
        } catch (error) {
            console.error(error);
            message.error('Import execution failed');
        } finally {
            setUploading(false);
        }
    };

    const columns: ColumnsType<any> = [
        {
            title: 'Status',
            key: 'valid',
            render: (_, record) => record.valid ? <Tag color="success">Valid</Tag> : <Tag color="error">Error</Tag>,
            width: 80
        },
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (text) => text || <Text type="secondary">(New)</Text>
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipient',
        },
        {
            title: 'Items',
            key: 'items',
            render: (_, record) => (
                <div className="text-xs">
                    {record.items.map((item: any, idx: number) => (
                        <div key={idx}>{item.sku} x{item.qty}</div>
                    ))}
                </div>
            )
        },
        {
            title: 'Cost',
            dataIndex: 'totalCost',
            key: 'cost',
            render: (val) => <Text strong type="success">${val ? val.toFixed(2) : '0.00'}</Text>
        }
    ];

    const uploadProps = {
        onRemove: (file: UploadFile) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file: UploadFile) => {
            setFileList([file]);
            return false;
        },
        fileList,
    };

    return (
        <Modal
            title="Import Replacement Orders"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            destroyOnClose
        >
            <Steps
                current={currentStep}
                className="mb-6"
                size="small"
                items={[
                    { title: 'Upload' },
                    { title: 'Review' },
                    { title: 'Result' }
                ]}
            />

            {currentStep === 0 && (
                <div className="text-center">
                    <Dragger {...uploadProps} accept=".xlsx,.xls" maxCount={1} className="mb-4">
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Click or drag Excel file here</p>
                    </Dragger>
                    <Button type="primary" onClick={handleFileUpload} disabled={fileList.length === 0} loading={uploading} block>
                        Analyze File
                    </Button>
                </div>
            )}

            {currentStep === 1 && (
                <div>
                    <Alert
                        message="Replacement Order Review"
                        description="These orders will be created for the seller designated in the ticket."
                        type="info"
                        showIcon
                        className="mb-4"
                    />
                    <Table
                        dataSource={parsedData}
                        columns={columns}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (keys) => setSelectedRowKeys(keys),
                            getCheckboxProps: (r) => ({ disabled: !r.valid })
                        }}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        scroll={{ x: true }}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setCurrentStep(0)}>Back</Button>
                        <Button type="primary" onClick={handleConfirmImport} loading={uploading}>
                            Create Replacements
                        </Button>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <Result
                    status="success"
                    title="Replacement Created"
                    subTitle="The order has been created successfully."
                    extra={[
                        <Button type="primary" key="close" onClick={() => onSuccess([])}>
                            Close & Resolve Ticket
                        </Button>
                    ]}
                />
            )}
        </Modal>
    );
}
