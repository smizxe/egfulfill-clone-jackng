'use client';

import React, { useState } from 'react';
import { Card, Upload, Button, message, Steps, Result, List, Typography } from 'antd';
import { InboxOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;

export default function ImportOrdersPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        const formData = new FormData();
        fileList.forEach((file) => {
            // Ant Design stores actual file in originFileObj
            formData.append('file', (file.originFileObj || file) as any);
        });

        setUploading(true);

        try {
            const res = await fetch('/api/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
                setCurrentStep(2);
                message.success('Upload successful!');
            } else {
                message.error(data.error || 'Upload failed.');
            }
        } catch (error) {
            message.error('Upload failed.');
        } finally {
            setUploading(false);
        }
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
            setCurrentStep(1);
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
                    { title: 'Select File', subTitle: 'Upload Excel' },
                    { title: 'Review', subTitle: 'Confirm Upload' },
                    { title: 'Result', subTitle: 'Processing Status' }
                ]}
            />

            {currentStep === 0 && (
                <Card title="Upload Excel File">
                    <Dragger {...props} accept=".xlsx,.xls">
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        <p className="ant-upload-hint">
                            Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                            band files
                        </p>
                    </Dragger>
                    <div className="mt-4">
                        <Typography.Text type="secondary">
                            Required Columns: SKU, Quantity, Name, Phone, Address, City, State, Zip, Country, DesignURL
                        </Typography.Text>
                    </div>
                </Card>
            )}

            {currentStep === 1 && (
                <Card title="Review & Process">
                    {fileList.map((file) => (
                        <div key={file.uid} className="flex items-center justify-between p-4 border rounded mb-4 bg-white">
                            <div className="flex items-center gap-4">
                                <FileExcelOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                <div>
                                    <div className="font-medium">{file.name}</div>
                                    <div className="text-gray-500 text-sm">Ready to process</div>
                                </div>
                            </div>
                            <Button danger onClick={() => { setFileList([]); setCurrentStep(0); }}>
                                Remove
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="primary"
                        onClick={handleUpload}
                        loading={uploading}
                        className="mt-4"
                        style={{ width: '100%' }}
                        size="large"
                    >
                        Process Import
                    </Button>
                </Card>
            )}

            {currentStep === 2 && result && (
                <Card>
                    <Result
                        status="success"
                        title="Only processed successfully!"
                        subTitle={`Imported ${result.importedCount} orders. Total processed: ${result.totalRows}`}
                        extra={[
                            <Button type="primary" key="console" onClick={() => { setFileList([]); setCurrentStep(0); setResult(null); }}>
                                Import Another
                            </Button>,
                        ]}
                    />
                    {result.errors && result.errors.length > 0 && (
                        <div className="mt-4">
                            <Typography.Title level={5} type="danger">Errors:</Typography.Title>
                            <div className="border rounded p-4 bg-red-50">
                                {result.errors.map((error: any, index: number) => (
                                    <div key={index} className="py-1 text-red-600 border-b last:border-0 border-red-100">
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
