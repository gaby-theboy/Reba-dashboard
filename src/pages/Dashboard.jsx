import { useState, useEffect, useCallback } from 'react';
import {
    Filter, Clock, RefreshCcw, X,
    ArrowUpRight, ArrowDownRight, BarChart2, AreaChart as AreaChartIcon, Calendar,
    AlertCircle, Wallet
} from 'lucide-react';

// Components
import {
    Card, ShimmerStatItem, ShimmerChart, ShimmerTransactions, Sidebar,
    RateModal,
    RevenueChart, TransactionChart, PlanChart
} from '../components';
import DateRangePicker from '../components/modals/DateRangePicker';

// Hooks
import { usePaymentData, useExchangeRates, useProcessedData } from '../hooks';

// API
import { fetchWalletBalances, fetchExchangeRates } from '../backend/api/api';

// Utils
import { formatCurrency } from '../utils/formatters';

// --- Stats Display Component ---
const StatsGroup = ({ children }) => (
    <Card className="p-0">
        <div className="flex flex-col md:flex-row">
            {children}
        </div>
    </Card>
);

const StatItem = ({ title, value, subtext, trend, showTrend, isLast = false, todayValue, yesterdayValue, showAlways = false, comparisonDates }) => {
    // Format comparison date range
    const formatComparisonRange = () => {
        if (!comparisonDates || !comparisonDates.currentStart || !comparisonDates.compareStart) return null;

        const options = { month: 'short', day: 'numeric' };
        const currentRange = `${comparisonDates.currentStart.toLocaleDateString('en-US', options)} - ${comparisonDates.currentEnd.toLocaleDateString('en-US', options)}`;
        const compareRange = `${comparisonDates.compareStart.toLocaleDateString('en-US', options)} - ${comparisonDates.compareEnd.toLocaleDateString('en-US', options)}`;

        return { currentRange, compareRange };
    };

    const ranges = formatComparisonRange();

    return (
        <div className={`flex-1 p-6 ${!isLast ? 'border-r border-slate-700/50' : ''}`}>
            <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>

            {/* Regular layout with trend on the right */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                    {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}

                    {/* TODAY/YESTERDAY comparison below subtext */}
                    {todayValue !== undefined && yesterdayValue !== undefined && (
                        <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5">
                                <h3 className={`font-bold ${showAlways ? 'text-sm text-slate-300' : 'text-lg text-white'}`}>{todayValue}</h3>
                                <span className="text-xs text-slate-500 font-medium">Today</span>
                            </div>
                            <div className={`rounded-full bg-slate-600 ${showAlways ? 'w-1 h-1' : 'w-1.5 h-1.5'}`}></div>
                            <div className="flex items-center gap-1.5">
                                <h3 className={`font-bold ${showAlways ? 'text-sm text-slate-400' : 'text-lg text-slate-400'}`}>{yesterdayValue}</h3>
                                <span className="text-xs text-slate-500 font-medium">Yesterday</span>
                            </div>
                        </div>
                    )}
                </div>
                {showTrend && trend !== null && trend !== undefined && (
                    <div className="flex flex-col items-end gap-1">
                        <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg ${trend > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(trend).toFixed(1)}%
                        </div>
                        {ranges && (
                            <div className="text-[10px] text-slate-500 text-right">
                                <div>{ranges.currentRange}</div>
                                <div className="text-slate-600">vs {ranges.compareRange}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Recent Transactions Table ---
const RecentTransactions = ({ transactions }) => (
    <Card>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Clock className="text-slate-400" size={20} />
                <h3 className="font-bold text-white text-lg">Recent Transactions</h3>
            </div>
            <span className="text-sm text-slate-400">Top 10</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-base text-slate-400 border-b border-slate-700">
                        <th className="py-3 font-medium uppercase tracking-wider">Date</th>
                        <th className="py-3 font-medium uppercase tracking-wider">Plan</th>
                        <th className="py-3 font-medium uppercase tracking-wider">Original</th>
                        <th className="py-3 font-medium text-right uppercase tracking-wider">Net RWF</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions?.slice().reverse().slice(0, 10).map((tx, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors text-sm">
                            <td className="py-4 text-slate-400">{tx.date.toLocaleDateString()}</td>
                            <td className="py-4">
                                <span className="font-medium text-white bg-slate-700/50 px-2 py-1 rounded-lg text-base">
                                    {tx.plan}
                                </span>
                            </td>
                            <td className="py-4 text-slate-300">
                                <span className="font-semibold">{tx.amount.toLocaleString()}</span>
                                <span className="text-base text-slate-500 ml-1">{tx.currency}</span>
                            </td>
                            <td className="py-4 text-right">
                                <span className="font-bold text-emerald-400 text-base">
                                    {formatCurrency(tx.netRWF)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {(!transactions || transactions.length === 0) && (
                    <tbody>
                        <tr>
                            <td colSpan="4" className="text-center text-slate-500 py-12">
                                <p className="text-lg">No transactions found</p>
                            </td>
                        </tr>
                    </tbody>
                )}
            </table>
        </div>
    </Card>
);

// --- Wallet Balances Card ---
const WalletBalances = ({ balances, usdRates, isLoading }) => {
    const convertToUSD = (balance, currency) => {
        if (!usdRates || !usdRates.rates) return 0;
        const rate = usdRates.rates[currency];
        if (!rate) return 0;
        // Convert from local currency to USD
        return parseFloat(balance) / rate;
    };

    const getTotalInUSD = () => {
        if (!balances || balances.length === 0) return 0;
        return balances.reduce((total, wallet) => {
            const usdAmount = convertToUSD(wallet.balance, wallet.currency);
            return total + usdAmount;
        }, 0);
    };

    const formatUSD = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <Card>
            <div className="flex items-center gap-2 mb-4">
                <Wallet className="text-slate-400" size={20} />
                <h3 className="font-bold text-white text-lg">Wallet Balances</h3>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {balances && balances.length > 0 ? (
                        <div className="flex items-center border border-slate-700/30 rounded-lg overflow-hidden">
                            {/* Individual Wallets */}
                            {balances.map((wallet, index) => {
                                const usdAmount = convertToUSD(wallet.balance, wallet.currency);
                                return (
                                    <div
                                        key={`${wallet.country}-${wallet.currency}-${index}`}
                                        className="flex-1 px-4 py-3 border-r border-slate-700/50 last:border-r-0"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-slate-400">{wallet.currency}</span>
                                        </div>
                                        <p className="text-white font-bold text-lg whitespace-nowrap">
                                            {formatUSD(usdAmount)}
                                        </p>
                                        <p className="text-slate-500 text-xs">
                                            {parseFloat(wallet.balance).toLocaleString()} {wallet.currency}
                                        </p>
                                    </div>
                                );
                            })}

                            {/* Total */}
                            <div className="flex-1 bg-gradient-to-br from-blue-600/20 to-violet-600/20 px-4 py-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-blue-400">TOTAL</span>
                                </div>
                                <p className="text-white font-bold text-xl whitespace-nowrap">
                                    {formatUSD(getTotalInUSD())}
                                </p>
                                <p className="text-slate-400 text-xs">
                                    All wallets combined
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-8">
                            <Wallet className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No wallet balances available</p>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};

// --- Error Notification ---
const ErrorNotification = ({ error, onRetry, onDismiss }) => (
    <div className="fixed top-4 right-4 z-[200] max-w-md animate-slide-in">
        <div className="bg-gradient-to-br from-rose-900/95 to-red-900/95 rounded-xl shadow-2xl border border-rose-500/50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="text-rose-400" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold mb-1">Error Loading Data</h3>
                    <p className="text-rose-200 text-sm mb-3">{error || 'Failed to fetch payment data'}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRetry}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <RefreshCcw size={14} />
                            Retry
                        </button>
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1.5 text-rose-200 hover:text-white text-sm font-medium transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 text-rose-300 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    </div>
);

// --- Shimmer Loading State ---
const ShimmerStats = () => (
    <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="p-0">
            <div className="flex flex-col md:flex-row">
                <ShimmerStatItem />
                <ShimmerStatItem />
                <ShimmerStatItem isLast />
            </div>
        </Card>
        <Card className="p-0">
            <div className="flex flex-col md:flex-row">
                <ShimmerStatItem />
                <ShimmerStatItem />
                <ShimmerStatItem isLast />
            </div>
        </Card>
    </div>
);

const ShimmerCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
            <ShimmerChart title="Net Revenue Trends" subtitle="Revenue in RWF by currency source" />
            <ShimmerChart title="Transaction Volume" subtitle="Number of transactions by currency" />
            <ShimmerChart title="Subscriptions by Plan" subtitle="Plan distribution over time" />
        </div>
    </div>
);

// --- Main Dashboard Component ---
export default function Dashboard() {
    // Data fetching hook with smart date range fetching
    const {
        rawData,
        setRawData,
        loading,
        fileName,
        error,
        detectedCurrencies,
        fetchForTimeRange
    } = usePaymentData();

    // Exchange rates hook
    const {
        exchangeRates,
        showRateModal,
        saveRates,
        initializeCurrencies,
        openModal: openRateModal,
        closeModal: closeRateModal
    } = useExchangeRates();

    // Date range state - Default to THIS_WEEK
    const [timeRange, setTimeRange] = useState('THIS_WEEK');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Error notification state
    const [showErrorNotification, setShowErrorNotification] = useState(false);

    // Chart settings
    const [chartType, setChartType] = useState('bar');
    const [granularity, setGranularity] = useState(null); // null = auto, or 'hour', 'day', 'week', 'month'
    const [visibleCurrencies, setVisibleCurrencies] = useState({});
    const [visiblePlans, setVisiblePlans] = useState({});

    // Wallet balances state
    const [walletBalances, setWalletBalances] = useState([]);
    const [walletLoading, setWalletLoading] = useState(true);
    const [usdRates, setUsdRates] = useState(null);

    // Timestamp of last data load
    const [lastUpdated, setLastUpdated] = useState(null);

    // Process data with granularity (client-side filtering - instant)
    const processedData = useProcessedData(rawData, timeRange, customRange, exchangeRates, granularity);

    // Initialize currencies when detected (modal is opened automatically if needed)
    useEffect(() => {
        if (detectedCurrencies.length > 0) {
            initializeCurrencies(detectedCurrencies);
        }
    }, [detectedCurrencies, initializeCurrencies]);

    // Initialize visibility states when processedData changes
    useEffect(() => {
        if (processedData?.activeCurrencies) {
            const initialVisibility = {};
            processedData.activeCurrencies.forEach(currency => {
                initialVisibility[currency] = true;
            });
            setVisibleCurrencies(initialVisibility);
        }
        if (processedData?.activePlans) {
            const initialVisibility = {};
            processedData.activePlans.forEach(plan => {
                initialVisibility[plan] = true;
            });
            setVisiblePlans(initialVisibility);
        }
    }, [processedData?.activeCurrencies, processedData?.activePlans]);

    // Show error notification when error occurs
    useEffect(() => {
        if (error) {
            setShowErrorNotification(true);
        }
    }, [error]);

    // Capture timestamp when data finishes loading
    useEffect(() => {
        if (!loading) {
            setLastUpdated(new Date());
        }
    }, [loading]);

    // Fetch wallet balances and USD exchange rates on mount
    useEffect(() => {
        const loadWalletData = async () => {
            try {
                setWalletLoading(true);
                // Fetch both wallet balances and USD exchange rates in parallel
                const [balancesResponse, ratesResponse] = await Promise.all([
                    fetchWalletBalances(),
                    fetchExchangeRates()
                ]);

                if (balancesResponse.success && balancesResponse.data) {
                    setWalletBalances(balancesResponse.data);
                }

                if (ratesResponse && ratesResponse.rates) {
                    setUsdRates(ratesResponse);
                }
            } catch (err) {
                console.error('Error fetching wallet data:', err);
            } finally {
                setWalletLoading(false);
            }
        };

        loadWalletData();
    }, []);

    // Fetch initial data on mount
    useEffect(() => {
        fetchForTimeRange(timeRange, customRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch once on mount

    // Handlers - with smart server-side fetching when needed
    const handleRangeChange = useCallback((rangeKey, customStart = null, customEnd = null) => {
        setTimeRange(rangeKey);
        setGranularity(null); // Reset to auto when changing time range

        const newCustomRange = rangeKey === 'CUSTOM' && customStart && customEnd
            ? { start: new Date(customStart), end: new Date(customEnd) }
            : { start: null, end: null };

        if (rangeKey === 'CUSTOM' && customStart && customEnd) {
            setCustomRange(newCustomRange);
        } else if (rangeKey !== 'CUSTOM') {
            setCustomRange({ start: null, end: null });
        }

        // Smart fetch: only fetch from server if needed data isn't already loaded
        fetchForTimeRange(rangeKey, newCustomRange);
    }, [fetchForTimeRange]);

    const toggleCurrencyVisibility = useCallback((currency) => {
        setVisibleCurrencies(prev => ({ ...prev, [currency]: !prev[currency] }));
    }, []);

    const togglePlanVisibility = useCallback((plan) => {
        setVisiblePlans(prev => ({ ...prev, [plan]: !prev[plan] }));
    }, []);

    const handleRetry = useCallback(() => {
        setShowErrorNotification(false);
        setRawData([]);
    }, [setRawData]);

    const handleDismissError = useCallback(() => {
        setShowErrorNotification(false);
    }, []);

    // Determine if we're loading (use shimmer states instead of full screen)
    const isLoadingMore = loading;

    return (
        <div className="min-h-screen bg-[#14181B] pb-20 font-sans flex flex-row">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
            </div>

            {/* Sidebar */}
            <Sidebar
                fileName={fileName}
                setShowRateModal={openRateModal}
                setRawData={setRawData}
                isLoading={loading}
            />

            {/* Main Content */}
            <div className="w-full flex-1 transition-all duration-300 ml-64">
                {/* Modals */}
                <RateModal
                    isOpen={showRateModal}
                    currencies={detectedCurrencies}
                    rates={exchangeRates}
                    onSave={saveRates}
                    onClose={closeRateModal}
                />

                <main className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Controls Bar */}
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-800/20 p-6 rounded-2xl border border-slate-700/50 mb-8 shadow-lg relative">
                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                            {/* Granularity Toggle */}
                            <div className="flex flex-col gap-2 w-full lg:w-auto">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                        <Filter size={16} className="text-blue-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-300">Group by</span>
                                    {granularity && (
                                        <button
                                            onClick={() => setGranularity(null)}
                                            className="ml-auto text-base text-blue-400 hover:text-blue-300 font-medium px-2 py-1 bg-blue-500/10 rounded-md hover:bg-blue-500/20 transition-all"
                                        >
                                            Reset to Auto
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
                                    {['hour', 'day', 'week', 'month'].map((g) => {
                                        const isActive = (granularity === g) || (!granularity && processedData?.effectiveGranularity === g);
                                        const isManual = granularity === g;
                                        return (
                                            <button
                                                key={g}
                                                onClick={() => setGranularity(granularity === g ? null : g)}
                                                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                                    isActive
                                                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                            >
                                                {g.charAt(0).toUpperCase() + g.slice(1)}
                                                {isActive && !isManual && (
                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Side Controls */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                {/* Chart Type Toggle */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-semibold text-slate-300">Chart Style</span>
                                    <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
                                        <button
                                            onClick={() => setChartType('area')}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                                chartType === 'area'
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <AreaChartIcon size={16} />
                                            <span>Area</span>
                                        </button>
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                                chartType === 'bar'
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <BarChart2 size={16} />
                                            <span>Bar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Date Range Button */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-semibold text-slate-300">Time Period</span>
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
                            </div>
                        </div>

                        {/* Last Updated Timestamp */}
                        {lastUpdated && !loading && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                                <Clock size={12} />
                                <span>Updated at {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                        )}
                    </div>

                    {/* Summary Stats */}
                    {loading ? (
                        <ShimmerStats />
                    ) : (
                        <div className="grid grid-cols-1 gap-6 mb-8">
                            {/* Wallet Balances */}
                            <WalletBalances
                                balances={walletBalances}
                                usdRates={usdRates}
                                isLoading={walletLoading}
                            />

                            <StatsGroup>
                                <StatItem
                                    title="Net Revenue (RWF)"
                                    value={formatCurrency(processedData?.totalNetRWF)}
                                    subtext="After 4% fee subtraction"
                                    trend={processedData?.growthPercent}
                                    showTrend={timeRange !== 'ALL' && timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    todayValue={formatCurrency(processedData?.todayRevenue)}
                                    yesterdayValue={formatCurrency(processedData?.yesterdayRevenue)}
                                    showAlways={timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    comparisonDates={processedData?.comparisonDates}
                                />
                                <StatItem
                                    title="Total Transactions"
                                    value={processedData?.successCount + processedData?.failCount}
                                    subtext={`${((processedData?.successCount / (processedData?.successCount + processedData?.failCount || 1)) * 100).toFixed(1)}% Success Rate`}
                                    trend={processedData?.transactionGrowth}
                                    showTrend={timeRange !== 'ALL' && timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    todayValue={processedData?.todayTransactions}
                                    yesterdayValue={processedData?.yesterdayTransactions}
                                    showAlways={timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    comparisonDates={processedData?.comparisonDates}
                                />
                                <StatItem
                                    title="Avg Transaction"
                                    value={formatCurrency(processedData?.averageTransactionValue)}
                                    subtext="Per successful transaction"
                                    todayValue={formatCurrency(processedData?.todayAvgTransaction)}
                                    yesterdayValue={formatCurrency(processedData?.yesterdayAvgTransaction)}
                                    showAlways={timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    isLast
                                />
                            </StatsGroup>

                            <StatsGroup>
                                <StatItem
                                    title="Failed Transactions"
                                    value={processedData?.failCount}
                                    subtext="Requires attention"
                                />
                                <StatItem
                                    title="Unique Customers"
                                    value={processedData?.uniqueCustomerCount}
                                    subtext="In selected period"
                                    trend={processedData?.customerGrowth}
                                    showTrend={timeRange !== 'ALL' && timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    todayValue={processedData?.todayCustomers}
                                    yesterdayValue={processedData?.yesterdayCustomers}
                                    showAlways={timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    comparisonDates={processedData?.comparisonDates}
                                />
                                <StatItem
                                    title="Returning Customers"
                                    value={processedData?.returningCustomerCount}
                                    subtext="Made more than one purchase"
                                    todayValue={processedData?.todayReturningCustomers}
                                    yesterdayValue={processedData?.yesterdayReturningCustomers}
                                    showAlways={timeRange !== 'TODAY' && timeRange !== 'YESTERDAY'}
                                    isLast
                                />
                            </StatsGroup>

                        </div>
                    )}

                    {/* Charts */}
                    {isLoadingMore ? (
                        <ShimmerCharts />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
                            <div className="lg:col-span-2 space-y-6">
                                <RevenueChart
                                    data={processedData?.revenueChartData}
                                    activeCurrencies={processedData?.activeCurrencies}
                                    visibleCurrencies={visibleCurrencies}
                                    onToggleVisibility={toggleCurrencyVisibility}
                                    chartType={chartType}
                                />

                                <TransactionChart
                                    data={processedData?.transactionChartData}
                                    activeCurrencies={processedData?.activeCurrencies}
                                    visibleCurrencies={visibleCurrencies}
                                    onToggleVisibility={toggleCurrencyVisibility}
                                    chartType={chartType}
                                />

                                <PlanChart
                                    data={processedData?.planChartData}
                                    activePlans={processedData?.activePlans}
                                    visiblePlans={visiblePlans}
                                    onToggleVisibility={togglePlanVisibility}
                                    chartType={chartType}
                                />
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    {isLoadingMore ? (
                        <ShimmerTransactions />
                    ) : (
                        <RecentTransactions transactions={processedData?.filtered} />
                    )}
                </main>
            </div>

            {/* Date Range Picker Dropdown - rendered outside main content to avoid backdrop-blur stacking issues */}
            {showDatePicker && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowDatePicker(false)}
                    />
                    <div className="fixed top-[180px] right-[calc(50%-700px+24px)] z-[101] 2xl:right-[calc(45%-800px+24px)]">
                        <DateRangePicker
                            onRangeChange={handleRangeChange}
                            availableDates={processedData?.availableDates}
                            currentRange={timeRange}
                            onClose={() => setShowDatePicker(false)}
                        />
                    </div>
                </>
            )}

            {/* Error Notification */}
            {showErrorNotification && error && (
                <ErrorNotification
                    error={error}
                    onRetry={handleRetry}
                    onDismiss={handleDismissError}
                />
            )}
        </div>
    );
}