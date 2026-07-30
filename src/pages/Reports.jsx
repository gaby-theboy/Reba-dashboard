import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users, TrendingUp, CreditCard, Download, Calendar,
    ArrowUpRight, ArrowDownRight, UserPlus, UserCheck,
    PieChart as PieChartIcon, BarChart3, Globe, Mail
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// Components
import { Card, ShimmerChart, Sidebar } from '../components';
import DateRangePicker from '../components/modals/DateRangePicker';

// Hooks
import { usePaymentData, useExchangeRates, useProcessedData } from '../hooks';

// Utils & Constants
import { formatCurrency } from '../utils/formatters';
import { PLAN_COLORS, getCurrencyColor } from '../constants/colors';

// --- Report Card Component ---
const ReportCard = ({ title, subtitle, icon: Icon, iconBgClass, children }) => (
    <Card className="min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
            {Icon && (
                <div className={`p-2 ${iconBgClass} rounded-lg`}>
                    <Icon className="text-current" size={20} />
                </div>
            )}
        </div>
        <div className="h-[300px] w-full">
            {children}
        </div>
    </Card>
);

// --- Metric Card ---
const MetricCard = ({ title, value, subtext, trend, icon: Icon, iconBgClass }) => (
    <Card>
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
                <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
                {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend).toFixed(1)}% vs prev period
                    </div>
                )}
            </div>
            {Icon && (
                <div className={`p-3 rounded-xl ${iconBgClass}`}>
                    <Icon size={20} className="text-white" />
                </div>
            )}
        </div>
    </Card>
);

// --- Top Customers Table ---
const TopCustomersTable = ({ customers }) => (
    <Card>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Users className="text-slate-400" size={20} />
                <h3 className="font-bold text-white text-lg">Top Customers by Revenue</h3>
            </div>
            <span className="text-sm text-slate-400">Top 10</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-700">
                        <th className="py-3 font-medium uppercase tracking-wider">Customer</th>
                        <th className="py-3 font-medium uppercase tracking-wider text-center">Transactions</th>
                        <th className="py-3 font-medium text-right uppercase tracking-wider">Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.slice(0, 10).map((customer, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors text-sm">
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {customer.email?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-slate-300 truncate max-w-[200px]">{customer.email}</span>
                                </div>
                            </td>
                            <td className="py-4 text-center">
                                <span className="bg-slate-700/50 px-2 py-1 rounded-lg text-xs font-medium text-white">
                                    {customer.count}
                                </span>
                            </td>
                            <td className="py-4 text-right">
                                <span className="font-bold text-emerald-400">
                                    {formatCurrency(customer.totalRevenue)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {customers.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                    <p className="text-lg">No customer data available</p>
                </div>
            )}
        </div>
    </Card>
);

// --- Custom Tooltip for Charts ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                <p className="text-white font-medium mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {typeof entry.value === 'number' && entry.value > 1000
                            ? formatCurrency(entry.value)
                            : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// --- Export Button ---
const ExportButton = ({ onClick, label }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50 hover:border-slate-500"
    >
        <Download size={16} />
        {label}
    </button>
);

// --- Main Reports Page ---
export default function Reports() {
    const {
        rawData,
        setRawData,
        loading,
        fileName,
        error,
        detectedCurrencies,
        fetchForTimeRange
    } = usePaymentData();

    const {
        exchangeRates,
        initializeCurrencies
    } = useExchangeRates();

    const [timeRange, setTimeRange] = useState('THIS_MONTH');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const processedData = useProcessedData(rawData, timeRange, customRange, exchangeRates, null);

    // Initialize currencies
    useEffect(() => {
        if (detectedCurrencies.length > 0) {
            initializeCurrencies(detectedCurrencies);
        }
    }, [detectedCurrencies, initializeCurrencies]);

    // Fetch initial data on mount
    useEffect(() => {
        fetchForTimeRange(timeRange, customRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch once on mount

    // Fetch data for time range on change
    const handleTimeRangeChange = useCallback((newRange, customStart = null, customEnd = null) => {
        setTimeRange(newRange);

        const newCustomRange = newRange === 'CUSTOM' && customStart && customEnd
            ? { start: new Date(customStart), end: new Date(customEnd) }
            : { start: null, end: null };

        if (newRange === 'CUSTOM' && customStart && customEnd) {
            setCustomRange(newCustomRange);
        } else if (newRange !== 'CUSTOM') {
            setCustomRange({ start: null, end: null });
        }

        fetchForTimeRange(newRange, newCustomRange);
    }, [fetchForTimeRange]);

    // Customer Analytics
    const customerAnalytics = useMemo(() => {
        if (!processedData?.filtered) return null;

        const successfulTx = processedData.filtered.filter(tx => tx.status === 'success');
        const customerMap = new Map();

        successfulTx.forEach(tx => {
            const email = tx.email || 'Unknown';
            if (!customerMap.has(email)) {
                customerMap.set(email, {
                    email,
                    count: 0,
                    totalRevenue: 0,
                    firstPurchase: tx.date,
                    lastPurchase: tx.date,
                    plans: new Set(),
                    currencies: new Set()
                });
            }
            const customer = customerMap.get(email);
            customer.count++;
            customer.totalRevenue += tx.netRWF;
            if (tx.date < customer.firstPurchase) customer.firstPurchase = tx.date;
            if (tx.date > customer.lastPurchase) customer.lastPurchase = tx.date;
            customer.plans.add(tx.plan);
            customer.currencies.add(tx.currency);
        });

        const customers = Array.from(customerMap.values())
            .map(c => ({
                ...c,
                plans: Array.from(c.plans),
                currencies: Array.from(c.currencies)
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        const newCustomers = customers.filter(c => c.count === 1).length;
        const returningCustomers = customers.filter(c => c.count > 1).length;
        const avgRevenuePerCustomer = customers.length > 0
            ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length
            : 0;
        const avgTransactionsPerCustomer = customers.length > 0
            ? customers.reduce((sum, c) => sum + c.count, 0) / customers.length
            : 0;

        return {
            customers,
            newCustomers,
            returningCustomers,
            avgRevenuePerCustomer,
            avgTransactionsPerCustomer,
            totalCustomers: customers.length
        };
    }, [processedData?.filtered]);

    // Plan Distribution
    const planDistribution = useMemo(() => {
        if (!processedData?.filtered) return [];

        const successfulTx = processedData.filtered.filter(tx => tx.status === 'success');
        const planMap = new Map();

        successfulTx.forEach(tx => {
            const plan = tx.plan || 'Unknown';
            if (!planMap.has(plan)) {
                planMap.set(plan, { name: plan, count: 0, revenue: 0 });
            }
            const entry = planMap.get(plan);
            entry.count++;
            entry.revenue += tx.netRWF;
        });

        return Array.from(planMap.values())
            .sort((a, b) => b.revenue - a.revenue);
    }, [processedData?.filtered]);

    // Currency Distribution
    const currencyDistribution = useMemo(() => {
        if (!processedData?.filtered) return [];

        const successfulTx = processedData.filtered.filter(tx => tx.status === 'success');
        const currencyMap = new Map();

        successfulTx.forEach(tx => {
            const currency = tx.currency || 'Unknown';
            if (!currencyMap.has(currency)) {
                currencyMap.set(currency, { name: currency, count: 0, revenue: 0 });
            }
            const entry = currencyMap.get(currency);
            entry.count++;
            entry.revenue += tx.netRWF;
        });

        return Array.from(currencyMap.values())
            .sort((a, b) => b.revenue - a.revenue);
    }, [processedData?.filtered]);

    // Country Distribution (if available)
    const countryDistribution = useMemo(() => {
        if (!processedData?.filtered) return [];

        const successfulTx = processedData.filtered.filter(tx => tx.status === 'success');
        const countryMap = new Map();

        successfulTx.forEach(tx => {
            const country = tx.country || 'Unknown';
            if (!countryMap.has(country)) {
                countryMap.set(country, { name: country, count: 0, revenue: 0 });
            }
            const entry = countryMap.get(country);
            entry.count++;
            entry.revenue += tx.netRWF;
        });

        return Array.from(countryMap.values())
            .filter(c => c.name !== 'Unknown')
            .sort((a, b) => b.revenue - a.revenue);
    }, [processedData?.filtered]);

    // Daily revenue for bar chart
    const dailyRevenue = useMemo(() => {
        if (!processedData?.revenueChartData) return [];
        return processedData.revenueChartData.slice(-14); // Last 14 data points
    }, [processedData?.revenueChartData]);

    // Export to CSV
    const exportToCSV = useCallback((data, filename) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h];
                if (val instanceof Date) return val.toISOString();
                if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                return val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }, []);

    const exportCustomerReport = useCallback(() => {
        if (!customerAnalytics?.customers) return;
        const exportData = customerAnalytics.customers.map(c => ({
            email: c.email,
            transactions: c.count,
            totalRevenue: c.totalRevenue.toFixed(2),
            firstPurchase: c.firstPurchase?.toISOString().split('T')[0],
            lastPurchase: c.lastPurchase?.toISOString().split('T')[0],
            plans: c.plans.join('; ')
        }));
        exportToCSV(exportData, 'customer_report');
    }, [customerAnalytics, exportToCSV]);

    const exportPlanReport = useCallback(() => {
        if (!planDistribution.length) return;
        const exportData = planDistribution.map(p => ({
            plan: p.name,
            subscriptions: p.count,
            revenue: p.revenue.toFixed(2)
        }));
        exportToCSV(exportData, 'plan_report');
    }, [planDistribution, exportToCSV]);

    const isLoading = !rawData.length && loading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#14181B] pb-20 font-sans flex flex-col md:flex-row">
                <Sidebar fileName={fileName} setShowRateModal={() => {}} setRawData={setRawData} isLoading={loading} />
                <div className="w-full flex-1 transition-all duration-300 md:ml-64">
                    <main className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <Card key={i} className="animate-pulse">
                                    <div className="h-4 bg-slate-700/50 rounded w-24 mb-3"></div>
                                    <div className="h-8 bg-slate-700/50 rounded w-32 mb-2"></div>
                                    <div className="h-3 bg-slate-700/50 rounded w-20"></div>
                                </Card>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ShimmerChart />
                            <ShimmerChart />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#14181B] pb-20 font-sans flex flex-col md:flex-row">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full"></div>
            </div>

            {/* Sidebar */}
            <Sidebar
                fileName={fileName}
                setShowRateModal={() => {}}
                setRawData={setRawData}
                isLoading={loading}
            />

            {/* Main Content */}
            <div className="w-full flex-1 transition-all duration-300 md:ml-64">
                <main className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                            <p className="text-slate-400 mt-1">Customer insights and business intelligence</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Date Range Button */}
                            <div className="relative">
                                <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
                                    <button
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                            showDatePicker
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <Calendar size={16} />
                                        <span>
                                            {timeRange === 'CUSTOM'
                                                ? `${customRange.start?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '...'} - ${customRange.end?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '...'}`
                                                : timeRange.replace('THIS_', '').replace('_', ' ')}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <ExportButton onClick={exportCustomerReport} label="Export Customers" />
                            <ExportButton onClick={exportPlanReport} label="Export Plans" />
                        </div>
                    </div>

                    {/* Customer Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Total Customers"
                            value={customerAnalytics?.totalCustomers || 0}
                            subtext="Unique paying customers"
                            trend={processedData?.customerGrowth}
                            icon={Users}
                            iconBgClass="bg-blue-500/20"
                        />
                        <MetricCard
                            title="New Customers"
                            value={customerAnalytics?.newCustomers || 0}
                            subtext="First-time buyers"
                            icon={UserPlus}
                            iconBgClass="bg-emerald-500/20"
                        />
                        <MetricCard
                            title="Returning Customers"
                            value={customerAnalytics?.returningCustomers || 0}
                            subtext="Multiple purchases"
                            icon={UserCheck}
                            iconBgClass="bg-violet-500/20"
                        />
                        <MetricCard
                            title="Avg Revenue/Customer"
                            value={formatCurrency(customerAnalytics?.avgRevenuePerCustomer || 0)}
                            subtext="Lifetime value"
                            icon={TrendingUp}
                            iconBgClass="bg-amber-500/20"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Plan Distribution Pie Chart */}
                        <ReportCard
                            title="Revenue by Plan"
                            subtitle="Subscription plan performance"
                            icon={PieChartIcon}
                            iconBgClass="bg-violet-500/10 text-violet-400"
                        >
                            {planDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={planDistribution}
                                            dataKey="revenue"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            labelLine={{ stroke: '#64748b' }}
                                        >
                                            {planDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    No plan data available
                                </div>
                            )}
                        </ReportCard>

                        {/* Currency Distribution Pie Chart */}
                        <ReportCard
                            title="Revenue by Currency"
                            subtitle="Payment currency breakdown"
                            icon={CreditCard}
                            iconBgClass="bg-emerald-500/10 text-emerald-400"
                        >
                            {currencyDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={currencyDistribution}
                                            dataKey="revenue"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            labelLine={{ stroke: '#64748b' }}
                                        >
                                            {currencyDistribution.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={getCurrencyColor(entry.name)} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    No currency data available
                                </div>
                            )}
                        </ReportCard>
                    </div>

                    {/* Revenue Trend Bar Chart */}
                    <div className="mb-8">
                        <ReportCard
                            title="Revenue Trend"
                            subtitle="Daily revenue performance"
                            icon={BarChart3}
                            iconBgClass="bg-blue-500/10 text-blue-400"
                        >
                            {dailyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => formatCurrency(value, true)}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="total" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    No revenue data available
                                </div>
                            )}
                        </ReportCard>
                    </div>

                    {/* Country Distribution (if data available) */}
                    {countryDistribution.length > 0 && (
                        <div className="mb-8">
                            <ReportCard
                                title="Revenue by Country"
                                subtitle="Geographic distribution of revenue"
                                icon={Globe}
                                iconBgClass="bg-cyan-500/10 text-cyan-400"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={countryDistribution.slice(0, 10)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => formatCurrency(value, true)}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={80}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="revenue" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ReportCard>
                        </div>
                    )}

                    {/* Top Customers Table */}
                    <TopCustomersTable customers={customerAnalytics?.customers || []} />
                </main>
            </div>

            {/* Date Range Picker Dropdown - rendered outside main content to avoid backdrop-blur stacking issues */}
            {showDatePicker && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowDatePicker(false)}
                    />
                    <div className="fixed top-[180px] right-[calc(50%-700px+24px)] z-[101] 2xl:right-[calc(50%-800px+24px)]">
                        <DateRangePicker
                            onRangeChange={handleTimeRangeChange}
                            availableDates={processedData?.availableDates}
                            currentRange={timeRange}
                            onClose={() => setShowDatePicker(false)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
