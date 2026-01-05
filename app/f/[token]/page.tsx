import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function FileViewerPage({ params }: { params: { token: string } }) {
    const { token } = await params;

    const qrToken = await prisma.qrToken.findUnique({
        where: { token },
        include: {
            job: true
        }
    });

    if (!qrToken || qrToken.type !== 'FILE') {
        return <div className="p-8 text-center text-red-500 font-bold text-2xl">Invalid File Token</div>;
    }

    const job = qrToken.job;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-400 text-sm">FILE VIEWER</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500 text-black'}`}>
                        {job.status}
                    </span>
                </div>

                <h1 className="text-4xl font-bold mb-2 tracking-tight">{job.jobCode}</h1>
                <p className="text-xl text-cyan-400 mb-8 font-mono">{job.sku}</p>

                <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                    <div className="bg-slate-700 p-3 rounded">
                        <span className="block text-slate-400 mb-1">Color</span>
                        <span className="font-bold text-lg">{job.color || '-'}</span>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                        <span className="block text-slate-400 mb-1">Size</span>
                        <span className="font-bold text-lg">{job.size || '-'}</span>
                    </div>
                    <div className="bg-slate-700 p-3 rounded col-span-2">
                        <span className="block text-slate-400 mb-1">Quantity/Qty</span>
                        <span className="font-bold text-3xl">{job.qty}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Primary Drive Link */}
                    {job.embroideryDriveLink && (
                        <a
                            href={job.embroideryDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-center rounded-lg font-bold text-lg transition-colors"
                        >
                            OPEN IN GOOGLE DRIVE
                        </a>
                    )}

                    {/* Local File Fallback (Placeholder) */}
                    {job.fileLocalPath && (
                        <a
                            href={`/api/files/${job.id}`} // Hypothetical endpoint
                            className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-center rounded-lg font-bold transition-colors"
                        >
                            DOWNLOAD LOCAL COPY
                        </a>
                    )}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-700 text-center text-slate-500 text-xs">
                    <p>EgFulfillment Production System</p>
                    <p>{new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
