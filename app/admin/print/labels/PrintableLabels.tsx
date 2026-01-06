'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

export default function PrintableLabels({ jobs }: { jobs: any[] }) {
    const [origin, setOrigin] = useState('');
    const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Use configured public URL or fallback to current window origin
        const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
        setOrigin(configuredUrl || window.location.origin);
    }, []);

    const toggleSelectAll = () => {
        if (selectedJobIds.size === jobs.length) {
            setSelectedJobIds(new Set());
        } else {
            setSelectedJobIds(new Set(jobs.map(j => j.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedJobIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedJobIds(newSet);
    };

    const handlePrintSelected = () => {
        if (selectedJobIds.size === 0) return;

        // Build HTML for all selected labels
        const labelsHTML = Array.from(selectedJobIds).map(id => {
            const el = document.getElementById(`label-${id}`);
            return el ? el.outerHTML : '';
        }).join('<div style="page-break-after: always; break-after: page;"></div>');

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Print Labels</title>
                <style>
                    @page {
                        size: 59mm 101mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .label-card-screen {
                        width: 59mm;
                        height: 101mm;
                        border: none;
                        padding: 2mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        overflow: hidden;
                        font-family: sans-serif;
                        page-break-inside: avoid;
                    }
                    /* Utility classes matching main app roughly */
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .text-xs { font-size: 10px; }
                    .text-sm { font-size: 11px; }
                    .text-lg { font-size: 14px; }
                    .text-xl { font-size: 16px; }
                    .uppercase { text-transform: uppercase; }
                    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .flex { display: flex; }
                    .flex-col { flex-direction: column; }
                    .justify-between { justify-content: space-between; }
                    .items-end { align-items: flex-end; }
                    .mt-1 { margin-top: 2px; }
                    .mb-1 { margin-bottom: 2px; }
                    .border-b { border-bottom: 1px solid #000; }
                    .border-t { border-top: 1px solid #000; }
                    
                    /* Custom compact styles for small label */
                    .sku-badge { 
                        display: inline-block; 
                        background: #000; 
                        color: #fff; 
                        padding: 1px 4px; 
                        border-radius: 2px; 
                        font-size: 10px;
                        margin-right: 2px;
                    }
                </style>
            </head>
            <body>
                ${labelsHTML}
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 10000);
    };

    const handlePrintSingle = (jobId: string) => {
        // Reuse logic but for single ID
        const prevSelected = new Set(selectedJobIds);
        setSelectedJobIds(new Set([jobId]));

        // Use timeout to let state update if needed, but actually we need to pass ID directly to a reusable function
        // For simplicity, let's just trigger print for this single ID using the same iframe helper logic
        // duplicating code slightly for safety or refactor

        const labelElement = document.getElementById(`label-${jobId}`);
        if (!labelElement) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Print Label</title>
                <style>
                    @page {
                        size: 59mm 101mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .label-card-screen {
                        width: 59mm;
                        height: 101mm;
                        border: none;
                        padding: 2mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        overflow: hidden;
                        font-family: sans-serif;
                    }
                    /* SAME UTILS */
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .text-xs { font-size: 10px; }
                    .text-sm { font-size: 11px; }
                    .text-lg { font-size: 14px; }
                    .text-xl { font-size: 16px; }
                    .uppercase { text-transform: uppercase; }
                    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .flex { display: flex; }
                    .flex-col { flex-direction: column; }
                    .justify-between { justify-content: space-between; }
                    .items-end { align-items: flex-end; }
                    .mt-1 { margin-top: 2px; }
                    .mb-1 { margin-bottom: 2px; }
                    .border-b { border-bottom: 1px solid #000; }
                    .border-t { border-top: 1px solid #000; }
                </style>
            </head>
            <body>
                ${labelElement.outerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 100);
                    }
                </script>
            </body>
            </html>
        `);
        doc.close();
        setTimeout(() => document.body.removeChild(iframe), 10000);
    };

    if (!origin) return <div>Loading...</div>;

    const allSelected = jobs.length > 0 && selectedJobIds.size === jobs.length;

    return (
        <div className="print-container p-4">
            <style jsx global>{`
                .label-card-screen {
                    width: 59mm;
                    height: 101mm;
                    border: 1px dashed #ccc;
                    background: white;
                    padding: 2mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                }
            `}</style>

            <div className="no-print mb-4 p-4 bg-white border rounded shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg">Label Printer (59mm x 101mm)</h3>
                    <p className="text-sm text-gray-600">Compatible with Dymo 30256 & Other Thermal Printers</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="selectAll" className="font-medium cursor-pointer">Select All</label>
                    </div>
                    {selectedJobIds.size > 0 && (
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            onClick={handlePrintSelected}
                        >
                            Print Selected ({selectedJobIds.size})
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-8 justify-center">
                {jobs.map((job) => {
                    const fileToken = job.tokens.find((t: any) => t.type === 'FILE')?.token;
                    const statusToken = job.tokens.find((t: any) => t.type === 'STATUS')?.token;
                    const fileUrl = `${origin}/f/${fileToken}`;
                    const statusUrl = `${origin}/s/${statusToken}`;
                    const isSelected = selectedJobIds.has(job.id);

                    return (
                        <div key={job.id} className="relative group">
                            {/* Checkbox Overlay */}
                            <div className="absolute -top-3 -left-3 z-20">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelect(job.id)}
                                    className="w-6 h-6 text-blue-600 rounded shadow-md cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className={`flex flex-col items-center space-y-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                                {/* The Label Itself */}
                                <div
                                    id={`label-${job.id}`}
                                    className={`label-card-screen cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                    onClick={() => toggleSelect(job.id)}
                                >
                                    {/* Header */}
                                    <div className="text-center border-b pb-1 mb-1 pointer-events-none">
                                        <h2 className="text-xl font-bold leading-tight">{job.jobCode}</h2>
                                        <p className="text-[10px] text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-grow flex flex-col space-y-1 text-sm overflow-hidden pointer-events-none">
                                        <div className="leading-tight">
                                            <span className="font-bold text-[10px] block text-gray-400">RECIPIENT</span>
                                            <span className="text-sm font-bold uppercase block truncate">{job.recipientName || 'N/A'}</span>
                                            <span className="text-[10px] text-gray-600 block leading-tight">
                                                {job.address1}
                                                {job.city && `, ${job.city}`}
                                            </span>
                                        </div>
                                        <div className="border-t pt-1 mt-1">
                                            <span className="font-bold text-[10px] block text-gray-400">PRODUCT</span>
                                            <span className="text-sm font-mono block truncate font-bold">{job.sku}</span>
                                            <div className="flex flex-wrap mt-1 gap-1">
                                                {job.color && <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px]">{job.color}</span>}
                                                <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px]">{job.size || 'STD'}</span>
                                                <span className="font-bold text-sm ml-auto">x{job.qty}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {job.notes && (
                                        <div className="border-t pt-1 mt-1 w-full pointer-events-none">
                                            <span className="font-bold text-[8px] block text-gray-400 uppercase">Note</span>
                                            <p className="text-[10px] font-bold bg-yellow-100 p-1 rounded leading-tight break-words">
                                                {job.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* QR Codes Footer */}
                                    <div className="mt-auto flex flex-row justify-between items-end pt-1 border-t pointer-events-none">
                                        <div className="text-center">
                                            <QRCodeSVG value={fileUrl} size={45} level="M" />
                                            <p className="text-[8px] font-bold mt-0.5">FILE</p>
                                        </div>

                                        <div className="text-center">
                                            <QRCodeSVG value={statusUrl} size={45} level="M" />
                                            <p className="text-[8px] font-bold mt-0.5">STATUS</p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="small"
                                    type="default"
                                    icon={<PrinterOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrintSingle(job.id);
                                    }}
                                >
                                    Print Single
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
