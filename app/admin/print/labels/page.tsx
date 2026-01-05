import React from 'react';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode.react'; // Need to check if this package is installed or use a different one
// package.json has "qrcode.react": "^4.2.0". It's a client component library usually? 
// Actually qrcode.react is for Client. In Server Component I should use 'qrcode' package or render on client.
// To avoid hydration issues, I'll make this a Client Page or Client Component wrapper.
// Since we need to read Params and Fetch Data, I'll fetch data in Server Page, pass to Client Component for Rendering.

import PrintableLabels from './PrintableLabels';

export default async function PrintLabelsPage({ searchParams }: { searchParams: { ids: string } }) {
    // searchParams needs await in Next 15, but usually handled by destructuring in function arg in Page? 
    // In Next 15 `searchParams` is a promise. In Next 14 it's an object. 
    // "next": "16.1.1" -> strictly async searchParams.

    // Safety check for searchParams being available
    const sp = await searchParams;
    const ids = sp.ids ? sp.ids.split(',') : [];

    if (ids.length === 0) {
        return <div>No Jobs Selected</div>;
    }

    const jobs = await prisma.job.findMany({
        where: { id: { in: ids } },
        include: { tokens: true, order: true }
    });

    return (
        <div className="bg-white min-h-screen text-black">
            <PrintableLabels jobs={jobs} />
        </div>
    );
}
