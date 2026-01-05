'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintableLabels({ jobs }: { jobs: any[] }) {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    if (!origin) return <div>Loading...</div>;

    return (
        <div className="print-container p-4">
            <style jsx global>{`
                @media print {
                    @page { size: auto; margin: 0mm; }
                    body { margin: 0; }
                    .no-print { display: none; }
                }
                .label-card {
                    width: 100mm; /* Approx 4 inches */
                    height: 150mm; /* Approx 6 inches */
                    border: 1px dashed #ccc;
                    padding: 5mm;
                    margin-bottom: 2mm;
                    page-break-inside: avoid;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
            `}</style>

            <div className="no-print mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
                <p className="font-bold">Instructions:</p>
                <ul className="list-disc ml-5">
                    <li>Use Ctrl+P (Cmd+P) to print.</li>
                    <li>Select "Save as PDF" or your Label Printer.</li>
                    <li>Ensure "Background Graphics" is ON if needed.</li>
                    <li>Check margins/scale.</li>
                </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:block">
                {jobs.map((job) => {
                    const fileToken = job.tokens.find((t: any) => t.type === 'FILE')?.token;
                    const statusToken = job.tokens.find((t: any) => t.type === 'STATUS')?.token;

                    const fileUrl = `${origin}/f/${fileToken}`;
                    const statusUrl = `${origin}/s/${statusToken}`;

                    return (
                        <div key={job.id} className="label-card bg-white relative">
                            {/* Header */}
                            <div className="text-center border-b pb-2 mb-2">
                                <h2 className="text-xl font-bold">{job.jobCode}</h2>
                                <p className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</p>
                            </div>

                            {/* Main Info */}
                            <div className="flex-grow flex flex-col justify-center space-y-2 text-sm">
                                <div>
                                    <span className="font-bold block">RECIPIENT:</span>
                                    <span className="text-lg uppercase truncate block">{job.recipientName || 'N/A'}</span>
                                    <span className="text-xs text-gray-600 block">{job.address1} {job.city}</span>
                                </div>
                                <div className="border-t pt-2">
                                    <span className="font-bold block">PRODUCT / SKU:</span>
                                    <span className="text-xl font-mono block">{job.sku}</span>
                                    <div className="flex space-x-4 mt-1">
                                        <span className="bg-black text-white px-2 py-0.5 rounded text-sm">{job.color || 'No Color'}</span>
                                        <span className="bg-black text-white px-2 py-0.5 rounded text-sm">{job.size || 'STD'}</span>
                                        <span className="font-bold text-lg">x{job.qty}</span>
                                    </div>
                                </div>
                            </div>

                            {/* QR Codes Footer */}
                            <div className="mt-4 flex flex-row justify-between items-end pt-2 border-t">
                                <div className="text-center">
                                    <QRCodeSVG value={fileUrl} size={90} level="M" />
                                    <p className="text-[10px] font-bold mt-1">FILE / DESIGN</p>
                                </div>

                                <div className="text-center">
                                    <QRCodeSVG value={statusUrl} size={90} level="M" />
                                    <p className="text-[10px] font-bold mt-1">UPDATE STATUS</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
