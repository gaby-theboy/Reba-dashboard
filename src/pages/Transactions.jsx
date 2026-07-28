import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Search, Filter as FilterIcon, Download, X, Calendar,
    CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';

// Components
import { Card, Sidebar } from '../components';
import DateRangePicker from '../components/modals/DateRangePicker';

// Hooks
import { usePaymentData, useExchangeRates, useProcessedData } from '../hooks';

// Utils
import { formatCurrency } from '../utils/formatters';

// Transaction Details Side Panel
const TransactionDetailsPanel = ({ transaction, onClose, exchangeRate }) => {
    if (!transaction) return null;

    const netAmount = (transaction.amount * 0.96) * (exchangeRate || 1);

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-slate-800/98 to-slate-900/98 border-l border-slate-700/50 shadow-2xl z-[150] overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-slate-800/95 border-b border-slate-700/50 p-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Transaction Details</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                        transaction.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                        {transaction.status === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {transaction.status === 'success' ? 'Successful' : 'Failed'}
                    </div>
                </div>

                {/* Transaction Info */}
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Transaction ID</p>
                        <p className="text-white font-mono text-sm break-all">{transaction._id}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Reference</p>
                        <p className="text-white font-mono text-sm break-all">{transaction.transaction_ref || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Date & Time</p>
                        <p className="text-white">{new Date(transaction.date).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Plan</p>
                        <p className="text-white font-semibold">{transaction.plan}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="border-t border-slate-700/50 pt-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer Information</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Email</p>
                            <p className="text-white break-all">{transaction.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Phone</p>
                            <p className="text-white">{transaction.telefone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Country</p>
                            <p className="text-white">{transaction.country || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Payment Method</p>
                            <p className="text-white">{transaction.payment_method || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="border-t border-slate-700/50 pt-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment Information</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Original Amount</p>
                            <p className="text-white text-lg font-bold">
                                {transaction.amount.toLocaleString()} <span className="text-slate-400 text-sm">{transaction.currency}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Net Amount (RWF)</p>
                            <p className="text-emerald-400 text-lg font-bold">{formatCurrency(netAmount)}</p>
                            <p className="text-xs text-slate-500 mt-1">After 4% fee</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Exchange Rate</p>
                            <p className="text-white">1 {transaction.currency} = {exchangeRate} RWF</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Period</p>
                            <p className="text-white">{transaction.period || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Transactions Component
export default function Transactions() {
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

    // State
    const [timeRange, setTimeRange] = useState('TWO_WEEKS');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('email'); // 'email', 'telefone', 'transaction_ref'
    const [showSearchFieldDropdown, setShowSearchFieldDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currencyFilter, setCurrencyFilter] = useState('ALL');
    const [planFilter, setPlanFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);

    const itemsPerPage = 50;
    const searchFieldDropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Check if we have active filters/search - if yes, don't apply time range filtering
    // because the backend already searched across all data
    const hasActiveFiltersOrSearch = searchQuery || statusFilter !== 'ALL' || currencyFilter !== 'ALL' || planFilter !== 'ALL';

    // When filters/search are active, use 'ALL' time range to avoid re-filtering the API results
    const processedData = useProcessedData(
        rawData,
        hasActiveFiltersOrSearch ? 'ALL' : timeRange,
        hasActiveFiltersOrSearch ? { start: null, end: null } : customRange,
        exchangeRates,
        null
    );


    // Initialize currencies
    useEffect(() => {
        if (detectedCurrencies.length > 0) {
            initializeCurrencies(detectedCurrencies);
        }
    }, [detectedCurrencies, initializeCurrencies]);

    // Close search field dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchFieldDropdownRef.current && !searchFieldDropdownRef.current.contains(event.target)) {
                setShowSearchFieldDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search
    const handleSearch = useCallback(() => {
        const query = searchInputRef.current?.value || '';
        if (!query.trim()) return;

        setSearchQuery(query.trim());
        setIsFiltering(true);
        setCurrentPage(1);

        const filterParams = {
            searchQuery: query.trim(),
            searchField: searchField, // Specify which field to search
            statusFilter: statusFilter !== 'ALL' ? statusFilter : undefined,
            currencyFilter: currencyFilter !== 'ALL' ? currencyFilter : undefined,
            planFilter: planFilter !== 'ALL' ? planFilter : undefined
        };

        fetchForTimeRange(timeRange, customRange, filterParams).finally(() => {
            setIsFiltering(false);
        });
    }, [searchField, statusFilter, currencyFilter, planFilter, timeRange, customRange, fetchForTimeRange]);

    // Fetch data with filters when filters change (but not search)
    useEffect(() => {
        const hasFilters = statusFilter !== 'ALL' || currencyFilter !== 'ALL' || planFilter !== 'ALL';

        if (hasFilters) {
            setIsFiltering(true);
            setCurrentPage(1);

            const filterParams = {
                statusFilter: statusFilter !== 'ALL' ? statusFilter : undefined,
                currencyFilter: currencyFilter !== 'ALL' ? currencyFilter : undefined,
                planFilter: planFilter !== 'ALL' ? planFilter : undefined
            };

            fetchForTimeRange(timeRange, customRange, filterParams).finally(() => {
                setIsFiltering(false);
            });
        } else if (!searchQuery) {
            // No filters and no search - fetch without filter params to use cache
            fetchForTimeRange(timeRange, customRange);
        }
    }, [statusFilter, currencyFilter, planFilter, timeRange, customRange, fetchForTimeRange]);

    const handleTimeRangeChange = useCallback((newRange, customStart = null, customEnd = null) => {
        setTimeRange(newRange);
        setCurrentPage(1);

        const newCustomRange = newRange === 'CUSTOM' && customStart && customEnd
            ? { start: new Date(customStart), end: new Date(customEnd) }
            : { start: null, end: null };

        if (newRange === 'CUSTOM' && customStart && customEnd) {
            setCustomRange(newCustomRange);
        } else if (newRange !== 'CUSTOM') {
            setCustomRange({ start: null, end: null });
        }
    }, []);

    // Get unique values for filters
    const { currencies, plans } = useMemo(() => {
        const currenciesSet = new Set();
        const plansSet = new Set();

        processedData?.filtered?.forEach(tx => {
            if (tx.currency) currenciesSet.add(tx.currency);
            if (tx.plan) plansSet.add(tx.plan);
        });

        return {
            currencies: Array.from(currenciesSet).sort(),
            plans: Array.from(plansSet).sort()
        };
    }, [processedData?.filtered]);

    // All filtering now happens on the server, so we just use the processed data
    // Sort by date descending (newest first)
    const filteredTransactions = useMemo(() => {
        const transactions = processedData?.filtered || [];
        return [...transactions].sort((a, b) => b.date - a.date);
    }, [processedData?.filtered]);

    // Pagination
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Export to CSV
    const handleExport = useCallback(() => {
        if (!filteredTransactions.length) return;

        const headers = [
            'Date',
            'Transaction ID',
            'Reference',
            'Email',
            'Phone',
            'Plan',
            'Status',
            'Amount',
            'Currency',
            'Net RWF',
            'Country',
            'Payment Method'
        ];

        const rows = filteredTransactions.map(tx => {
            const netRWF = (tx.amount * 0.96) * (exchangeRates[tx.currency] || 1);
            return [
                new Date(tx.date).toLocaleString(),
                tx._id,
                tx.transaction_ref || '',
                tx.email,
                tx.telefone || '',
                tx.plan,
                tx.status,
                tx.amount,
                tx.currency,
                netRWF.toFixed(2),
                tx.country || '',
                tx.payment_method || ''
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }, [filteredTransactions, exchangeRates]);

    // Reset filters
    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
        setStatusFilter('ALL');
        setCurrencyFilter('ALL');
        setPlanFilter('ALL');
        setCurrentPage(1);
    }, []);

    const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || currencyFilter !== 'ALL' || planFilter !== 'ALL';

    const searchFieldLabels = {
        email: 'Email',
        telefone: 'Phone',
        transaction_ref: 'Transaction Ref'
    };

    return (
        <div className="min-h-screen bg-[#14181B] pb-20 font-sans flex flex-row">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full"></div>
            </div>

            <Sidebar
                fileName={fileName}
                setShowRateModal={() => {}}
                setRawData={setRawData}
                isLoading={loading}
            />

            <div className={`flex-1 ml-64 transition-all duration-300 ${selectedTransaction ? 'mr-96' : ''} flex flex-col h-screen overflow-hidden`}>
                {/* Fixed Header */}
                <div className="flex-shrink-0 bg-[#14181B] border-b border-slate-700/50">
                    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Transactions</h1>
                                <p className="text-slate-400 mt-1">Complete transaction history and details</p>
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
                                <button
                                    onClick={handleExport}
                                    disabled={!filteredTransactions.length}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={16} />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="pb-4">
                            <Card>
                        <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-center gap-2">
                                    {/* Search Field Dropdown */}
                                    <div className="relative" ref={searchFieldDropdownRef}>
                                        <button
                                            onClick={() => setShowSearchFieldDropdown(!showSearchFieldDropdown)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-all min-w-[140px]"
                                        >
                                            <span className="text-sm">{searchFieldLabels[searchField]}</span>
                                            <ChevronDown size={16} className="text-slate-400" />
                                        </button>
                                        {showSearchFieldDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                                {Object.entries(searchFieldLabels).map(([key, label]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => {
                                                            setSearchField(key);
                                                            setShowSearchFieldDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                                            searchField === key
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-slate-300 hover:bg-slate-700/50'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Input */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={`Search by ${searchFieldLabels[searchField].toLowerCase()}...`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                }
                                            }}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                        />
                                        {isFiltering && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Button */}
                                    <button
                                        onClick={handleSearch}
                                        disabled={isFiltering}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Search
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                        showFilters || hasActiveFilters
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-900/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                                    }`}
                                >
                                    <FilterIcon size={18} />
                                    Filters
                                    {hasActiveFilters && !showFilters && (
                                        <span className="bg-white text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-bold">•</span>
                                    )}
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="text-sm text-slate-400 hover:text-white transition-colors"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Filter Options */}
                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="ALL">All Status</option>
                                            <option value="success">Success</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Currency</label>
                                        <select
                                            value={currencyFilter}
                                            onChange={(e) => setCurrencyFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="ALL">All Currencies</option>
                                            {currencies.map(currency => (
                                                <option key={currency} value={currency}>{currency}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2 block">Plan</label>
                                        <select
                                            value={planFilter}
                                            onChange={(e) => setPlanFilter(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="ALL">All Plans</option>
                                            {plans.map(plan => (
                                                <option key={plan} value={plan}>{plan}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Results Count */}
                            <div className="flex items-center justify-between text-sm">
                                <p className="text-slate-400">
                                    Showing <span className="text-white font-semibold">{paginatedTransactions.length}</span> of{' '}
                                    <span className="text-white font-semibold">{filteredTransactions.length}</span> transactions
                                </p>
                            </div>
                        </div>
                    </Card>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Transactions Table */}
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-800/40 z-10">
                                        <tr className="text-xs text-slate-400 border-b border-slate-700">
                                            <th className="py-3 font-medium uppercase tracking-wider">Date</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Customer</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Reference</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Plan</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Amount</th>
                                            <th className="py-3 font-medium uppercase tracking-wider text-right">Net RWF</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {loading || isFiltering ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12">
                                                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-slate-400 mt-3">Loading transactions...</p>
                                            </td>
                                        </tr>
                                    ) : paginatedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12">
                                                <p className="text-slate-400 text-lg">No transactions found</p>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={handleResetFilters}
                                                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTransactions.map((tx, i) => {
                                            const netRWF = (tx.amount * 0.96) * (exchangeRates[tx.currency] || 1);
                                            const isSelected = selectedTransaction?._id === tx._id;
                                            return (
                                                <tr
                                                    key={i}
                                                    onClick={() => setSelectedTransaction(tx)}
                                                    className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                                                        isSelected ? 'bg-blue-500/10' : ''
                                                    }`}
                                                >
                                                    <td className="py-4 text-slate-300 text-sm">
                                                        {new Date(tx.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                        <br />
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(tx.date).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-white text-sm">
                                                        <div>{tx.email}</div>
                                                        {tx.telefone && (
                                                            <div className="text-xs text-slate-500 mt-0.5">{tx.telefone}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-slate-300 text-sm font-mono">
                                                        {tx.transaction_ref || '-'}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="font-medium text-white bg-slate-700/50 px-2 py-1 rounded-lg text-sm">
                                                            {tx.plan}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-white text-sm">
                                                        <span className="font-semibold">{tx.amount.toLocaleString()}</span>
                                                        <span className="text-slate-500 ml-1">{tx.currency}</span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className="font-bold text-emerald-400">
                                                            {formatCurrency(netRWF)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            tx.status === 'success'
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : 'bg-rose-500/20 text-rose-400'
                                                        }`}>
                                                            {tx.status === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700/50">
                                <p className="text-sm text-slate-400">
                                    Page <span className="text-white font-semibold">{currentPage}</span> of{' '}
                                    <span className="text-white font-semibold">{totalPages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>
                    </div>
                </div>
            </div>

            {/* Date Range Picker */}
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

            {/* Transaction Details Side Panel */}
            {selectedTransaction && (
                <TransactionDetailsPanel
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    exchangeRate={exchangeRates[selectedTransaction.currency] || 1}
                />
            )}
        </div>
    );
}
