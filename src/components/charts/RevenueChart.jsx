import React, { useMemo, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { DollarSign } from 'lucide-react';
import ChartWrapper from './ChartWrapper';
import { getCurrencyColor } from '../../constants/colors';
import { formatCurrency, formatRevenueTotal } from '../../utils/formatters';

// Tooltip styles - defined outside to prevent recreation
const TOOLTIP_STYLE = {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
    color: '#fff'
};

const RevenueChart = React.memo(({
    data,
    activeCurrencies,
    visibleCurrencies,
    onToggleVisibility,
    chartType
}) => {
    // Memoize gradient definitions
    const gradients = useMemo(() => (
        activeCurrencies?.map((curr) => {
            const color = getCurrencyColor(curr);
            return (
                <linearGradient key={`gradient-rev-${curr}`} id={`gradient-rev-${curr}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
            );
        })
    ), [activeCurrencies]);

    const handleLegendClick = useCallback((payload) => {
        const clickedName = payload.value;
        if (clickedName && onToggleVisibility) {
            onToggleVisibility(clickedName);
        }
    }, [onToggleVisibility]);

    const tooltipFormatter = useCallback((value, name) => [formatCurrency(value) + ' RWF', name], []);

    const yAxisFormatter = useCallback((value) => formatCurrency(value, true), []);

    if (!data || data.length === 0) {
        return (
            <ChartWrapper
                title="Net Revenue Trends"
                subtitle="Revenue in RWF by currency source"
                icon={DollarSign}
                iconBgClass="bg-emerald-500/10 text-emerald-400"
            >
                <div className="flex items-center justify-center h-full text-slate-400">
                    No data available
                </div>
            </ChartWrapper>
        );
    }

    return (
        <ChartWrapper
            title="Net Revenue Trends"
            subtitle="Revenue in RWF by currency source"
            icon={DollarSign}
            iconBgClass="bg-emerald-500/10 text-emerald-400"
        >
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                    <AreaChart data={data}>
                        <defs>{gradients}</defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={yAxisFormatter}
                        />
                        <Tooltip
                            cursor={{ fill: '#1e293b' }}
                            contentStyle={TOOLTIP_STYLE}
                            formatter={tooltipFormatter}
                            labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                        />
                        <Legend
                            onClick={handleLegendClick}
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                            formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                        />
                        {activeCurrencies?.map((curr) => (
                            visibleCurrencies[curr] && (
                                <Area
                                    key={`area-rev-${curr}`}
                                    dataKey={curr}
                                    type="monotone"
                                    fill={`url(#gradient-rev-${curr})`}
                                    stroke={getCurrencyColor(curr)}
                                    name={curr}
                                    strokeWidth={2}
                                />
                            )
                        ))}
                    </AreaChart>
                ) : (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={yAxisFormatter}
                        />
                        <Tooltip
                            cursor={{ fill: '#1e293b' }}
                            contentStyle={TOOLTIP_STYLE}
                            formatter={tooltipFormatter}
                            labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                            formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                        />
                        {activeCurrencies?.map((curr) => (
                            visibleCurrencies[curr] && (
                                <Bar
                                    key={`bar-rev-${curr}`}
                                    dataKey={curr}
                                    stackId="a"
                                    fill={getCurrencyColor(curr)}
                                    name={curr}
                                />
                            )
                        ))}
                        <Bar
                            dataKey="total"
                            fill="transparent"
                            label={{
                                position: 'top',
                                formatter: formatRevenueTotal,
                                fontSize: 11,
                                fill: '#cbd5e1',
                                fontWeight: 'bold'
                            }}
                        />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </ChartWrapper>
    );
});

RevenueChart.displayName = 'RevenueChart';

export default RevenueChart;
