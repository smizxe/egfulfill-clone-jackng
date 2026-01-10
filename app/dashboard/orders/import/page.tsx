'use client';

import React, { useState } from 'react';
import { Card, Upload, Button, App, Steps, Result, Table, Tag, Typography, Alert, Modal, Space, Collapse } from 'antd';
import { InboxOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined, WalletOutlined, DollarCircleOutlined, CalculatorOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

const { Dragger } = Upload;
const { Text } = Typography;

export default function ImportOrdersPage() {
    const { message } = App.useApp(); // Use hook for context-aware message

    const [currentStep, setCurrentStep] = useState(0);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    // Parsed Data State
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [importResult, setImportResult] = useState<any>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);

    const handleFileUpload = async () => {
        const formData = new FormData();
        fileList.forEach((file) => {
            formData.append('file', (file.originFileObj || file) as any);
        });

        setUploading(true);
        try {
            // Step 1: Parse content (Dry Run)
            const res = await fetch('/api/import', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success && data.dryRun) {
                // Add unique keys for Table
                const rows = data.parsedOrders.map((o: any, idx: number) => ({
                    ...o,
                    key: o.id || o.tempId || `row-${idx}`
                }));
                setParsedData(rows);
                setWalletBalance(data.walletBalance || 0);
                // Auto-select valid rows
                const validKeys = rows.filter((r: any) => r.valid).map((r: any) => r.key);
                setSelectedRowKeys(validKeys);

                setCurrentStep(1); // Move to Review
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

        // Calculate selected total cost
        const selectedTotal = parsedData
            .filter(row => selectedRowKeys.includes(row.key))
            .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

        // Check balance (Note: Wallet will deduct only on Admin approval)
        // This is just a warning/block for now
        if (selectedTotal > walletBalance) {
            message.error(`Insufficient wallet balance. Required: $${selectedTotal.toFixed(2)}, Available: $${walletBalance.toFixed(2)}`);
            return;
        }

        setUploading(true);
        try {
            // Filter selected orders
            const ordersToImport = parsedData.filter(row => selectedRowKeys.includes(row.key));

            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: ordersToImport })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setImportResult({
                    success: true,
                    count: data.importedCount,
                    message: data.message
                });
                setCurrentStep(2); // Move to Result
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

    // Table Columns
    const columns: ColumnsType<any> = [
        {
            title: 'Status',
            key: 'valid',
            render: (_, record) => (
                record.valid ? <Tag color="success">Valid</Tag> : <Tag color="error">Error</Tag>
            ),
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
                <div>
                    {record.items.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs">
                            {item.sku} x{item.qty} ({item.color}/{item.size})
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: 'Cost',
            dataIndex: 'totalCost',
            key: 'cost',
            render: (val) => <Text strong type="success">${val ? val.toFixed(2) : '0.00'}</Text>
        },
        {
            title: 'Issues',
            dataIndex: 'errors',
            key: 'errors',
            render: (errors) => (
                errors && errors.length > 0 ? (
                    <div className="text-xs text-red-500 max-h-20 overflow-y-auto">
                        {errors.map((e: string, i: number) => <div key={i}>- {e}</div>)}
                    </div>
                ) : <CheckCircleOutlined className="text-green-500" />
            )
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
        getCheckboxProps: (record: any) => ({
            disabled: !record.valid, // Disable selection if invalid
        }),
    };

    const props = {
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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Import Orders</h1>

            <Steps
                current={currentStep}
                className="mb-8"
                items={[
                    { title: 'Upload', subTitle: 'Select File' },
                    { title: 'Review', subTitle: 'Select Orders' },
                    { title: 'Result', subTitle: 'Finished' }
                ]}
            />

            {/* Step 0: Upload */}
            {currentStep === 0 && (
                <Card title="Upload Excel File">
                    <Dragger {...props} accept=".xlsx,.xls" maxCount={1}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag file here</p>
                        <p className="ant-upload-hint">
                            Supports Excel files. Design 1 & Position 1 are required.
                        </p>
                    </Dragger>
                    <Button
                        type="primary"
                        onClick={handleFileUpload}
                        disabled={fileList.length === 0}
                        loading={uploading}
                        className="mt-4 w-full"
                        size="large"
                    >
                        Analyze File
                    </Button>

                    <div className="mt-6">
                        <Space className="w-full justify-between" align="center">
                            <Text strong>Need a template?</Text>
                            <Button
                                icon={<DownloadOutlined />}
                                href="/template_import_orders.xlsx"
                                download="template_import_orders.xlsx"
                            >
                                Download Excel Template
                            </Button>
                        </Space>
                    </div>

                    <div className="mt-8">
                        <Collapse
                            items={[{
                                key: '1',
                                label: <Space><InfoCircleOutlined className="text-blue-500" /> <Text strong>Import Rules & Requirements</Text></Space>,
                                children: (
                                    <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                                        <li><Text strong>File Format:</Text> .xlsx or .xls only.</li>
                                        <li><Text strong>Design 1 & Position 1:</Text> Must be present together. If you specify a design file, you must specify the print position.</li>
                                        <li><Text strong>Required Fields:</Text>
                                            <ul className="list-circle pl-5 mt-1">
                                                <li>Order ID (leave blank for new auto-gen ID)</li>
                                                <li>SKU (must match an existing product variant)</li>
                                                <li>Recipient Name</li>
                                                <li>Address Line 1</li>
                                                <li>City, State, Zip, Country</li>
                                            </ul>
                                        </li>
                                        <li><Text strong>Strict Validation:</Text> Any row with missing required fields will be marked as invalid and cannot be imported.</li>
                                    </ul>
                                )
                            }]}
                        />
                    </div>
                </Card>
            )}

            {/* Step 1: Review Table */}
            {currentStep === 1 && (
                <Card
                    title={
                        <div className="flex justify-between items-center">
                            <span>Review Orders ({selectedRowKeys.length} selected)</span>
                            <div>
                                <span className="mr-4 text-gray-500">
                                    Total Cost: <span className="text-green-600 font-bold">
                                        ${parsedData.filter(r => selectedRowKeys.includes(r.key)).reduce((acc, curr) => acc + curr.totalCost, 0).toFixed(2)}
                                    </span>
                                </span>
                                <Button onClick={() => { setCurrentStep(0); setFileList([]); }}>Cancel</Button>
                                <Button type="primary" className="ml-2" onClick={handleConfirmImport} loading={uploading}>
                                    Import Selected
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="mb-8">
                        <Alert
                            title="Check the orders you want to import. Invalid orders cannot be selected."
                            type="info"
                            showIcon
                        />
                    </div>

                    {/* Balance & Stats Cards */}
                    {(() => {
                        const selectedTotal = parsedData.filter(r => selectedRowKeys.includes(r.key)).reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
                        const isInsufficient = selectedTotal > walletBalance;
                        const remaining = walletBalance - selectedTotal;

                        return (
                            <div className="mb-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Wallet Balance Card */}
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider">Wallet Balance</p>
                                            <p className={`text-2xl font-bold ${walletBalance === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                                ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                            <WalletOutlined style={{ fontSize: '24px' }} />
                                        </div>
                                    </div>

                                    {/* Selected Cost Card */}
                                    <div className={`p-4 rounded-lg border shadow-sm flex items-center justify-between ${isInsufficient ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider">Selected Total</p>
                                            <p className={`text-2xl font-bold ${isInsufficient ? 'text-red-600' : 'text-blue-600'}`}>
                                                ${selectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-full ${isInsufficient ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <DollarCircleOutlined style={{ fontSize: '24px' }} />
                                        </div>
                                    </div>

                                    {/* Remaining Card */}
                                    <div className={`p-4 rounded-lg border shadow-sm flex items-center justify-between ${remaining < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider">Remaining (Est)</p>
                                            <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-full ${remaining < 0 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            <CalculatorOutlined style={{ fontSize: '24px' }} />
                                        </div>
                                    </div>
                                </div>

                                {isInsufficient && (
                                    <Alert
                                        message={<span className="font-bold">Insufficient Balance</span>}
                                        description="You do not have enough funds to proceed with this import. Please top up your wallet or deselect some orders to proceed."
                                        type="error"
                                        showIcon
                                        className="border-red-200 bg-red-50"
                                    />
                                )}
                            </div>
                        );
                    })()}
                    <Table
                        dataSource={parsedData}
                        columns={columns}
                        rowSelection={rowSelection}
                        pagination={{ pageSize: 10 }}
                        size="small"
                        rowClassName={(record) => !record.valid ? 'bg-red-50' : ''}
                    />
                </Card>
            )}

            {/* Step 2: Result */}
            {currentStep === 2 && importResult && (
                <Card>
                    <Result
                        status="success"
                        title="Import Successful!"
                        subTitle={`Created ${importResult.count} orders. Status: PENDING_APPROVAL.`}
                        extra={[
                            <Button type="primary" key="console" onClick={() => {
                                setCurrentStep(0);
                                setFileList([]);
                                setParsedData([]);
                                setSelectedRowKeys([]);
                            }}>
                                Import More
                            </Button>
                        ]}
                    >
                        <div className="desc">
                            <Text>
                                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Your orders have been created and are waiting for Admin Approval.
                            </Text>
                            <br />
                            <Text type="secondary" className="ml-5">
                                Note: Wallet will be deducted only when Admin approves the order.
                            </Text>
                        </div>
                    </Result>
                </Card>
            )}
        </div>
    );
}
