'use client';

import React, { useState } from 'react';
import { Card, Select, Typography, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import DailyBreakdownTable from './DailyBreakdownTable';
import ProductionReport from './ProductionReport';

const { Title } = Typography;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReportsPage() {
    const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
    const [selectedYear, setSelectedYear] = useState(dayjs().year());

    const items = [
        {
            key: 'financial',
            label: 'Financial Report',
            children: <DailyBreakdownTable month={selectedMonth} year={selectedYear} />,
        },
        {
            key: 'production',
            label: 'Production Report',
            children: <ProductionReport month={selectedMonth} year={selectedYear} />,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent m-0">
                        Detailed Reports
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        View granular daily breakdowns of orders and financials.
                    </p>
                </div>

                <Space size="large">
                    <Select
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        className="w-40"
                        size="large"
                        options={MONTHS.map((m, i) => ({ label: m, value: i }))}
                    />
                    <Select
                        value={selectedYear}
                        onChange={setSelectedYear}
                        className="w-32"
                        size="large"
                        options={Array.from({ length: 5 }, (_, i) => ({
                            label: dayjs().year() - i,
                            value: dayjs().year() - i
                        }))}
                    />
                </Space>
            </div>

            <Tabs defaultActiveKey="financial" items={items} type="card" className="glass-tabs" />
        </div>
    );
}
