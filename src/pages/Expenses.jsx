import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Download, Search, ChevronDown, X, ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import DateRangePicker from '../components/modals/DateRangePicker';
import { usePaymentData } from '../hooks/usePaymentData';
import { fetchExpenses, createExpense, updateExpense, deleteExpense, fetchExpenseCategories } from '../backend/api/api';

// Expense Details Side Panel
const ExpenseDetailsPanel = ({ expense, onClose, onEdit, onDelete }) => {
    if (!expense) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-slate-800/98 to-slate-900/98 border-l border-slate-700/50 shadow-2xl z-[150] overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-slate-800/95 border-b border-slate-700/50 p-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Expense Details</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Amount */}
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Amount</label>
                    <p className="text-2xl font-bold text-white mt-1">
                        {expense.amount.toLocaleString()} {expense.currency}
                    </p>
                </div>

                {/* Category */}
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Category</label>
                    <p className="text-white mt-1">{expense.category}</p>
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Description</label>
                    <p className="text-white mt-1">{expense.description || 'No description'}</p>
                </div>

                {/* Date */}
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Date</label>
                    <p className="text-white mt-1">
                        {new Date(expense.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Vendor */}
                {expense.vendor && (
                    <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider">Vendor</label>
                        <p className="text-white mt-1">{expense.vendor}</p>
                    </div>
                )}

                {/* Payment Method */}
                {expense.paymentMethod && (
                    <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider">Payment Method</label>
                        <p className="text-white mt-1">{expense.paymentMethod}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <button
                        onClick={() => onEdit(expense)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50 hover:border-slate-500"
                    >
                        <Edit2 size={16} />
                        Edit Expense
                    </button>
                    <button
                        onClick={() => onDelete(expense)}
                        className="w-full text-sm text-rose-300 hover:text-rose-200 font-medium flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 rounded-xl transition-all border border-rose-500/20"
                    >
                        <Trash2 size={16} />
                        Delete Expense
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add/Edit Expense Modal
const ExpenseModal = ({ expense, onClose, onSave }) => {
    const [formData, setFormData] = useState(
        expense ? {
            ...expense,
            // Convert Date object to YYYY-MM-DD string for date input
            date: expense.date instanceof Date
                ? expense.date.toISOString().split('T')[0]
                : (typeof expense.date === 'string' && expense.date.includes('T'))
                    ? expense.date.split('T')[0]
                    : expense.date
        } : {
            amount: '',
            currency: 'RWF',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            vendor: '',
            paymentMethod: ''
        }
    );

    const categories = [
        'Marketing',
        'Software & Tools',
        'Office Supplies',
        'Hosting & Infrastructure',
        'Salaries',
        'Utilities',
        'Professional Services',
        'Travel',
        'Other'
    ];

    const paymentMethods = ['Cash', 'Bank Transfer', 'Mobile Money', 'Credit Card', 'Debit Card'];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: parseFloat(formData.amount),
            // Keep date as string (YYYY-MM-DD) - handleSaveExpense will convert to UTC
            date: formData.date,
            _id: expense?._id, // Use _id for existing expenses
            id: expense?.id || Date.now().toString()
        });
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 z-[100]" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <Card className="m-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {expense ? 'Edit Expense' : 'Add New Expense'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                    Currency *
                                </label>
                                <select
                                    required
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="RWF">RWF</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                Category *
                            </label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="">Select category...</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                    Vendor
                                </label>
                                <input
                                    type="text"
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                    Payment Method
                                </label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="">Select...</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all border border-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
                            >
                                {expense ? 'Update' : 'Add'} Expense
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
};

export default function Expenses() {
    const { setRawData, loading } = usePaymentData();

    // State
    const [timeRange, setTimeRange] = useState('THIS_MONTH');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

    const searchInputRef = useRef(null);
    const itemsPerPage = 50;

    // Load expenses from API
    const loadExpenses = useCallback(async () => {
        setIsLoadingExpenses(true);
        try {
            // Calculate date range based on timeRange
            let filters = {};

            if (timeRange === 'CUSTOM' && customRange.start && customRange.end) {
                filters.startDate = customRange.start.toISOString().split('T')[0];
                filters.endDate = customRange.end.toISOString().split('T')[0];
            } else if (timeRange !== 'ALL') {
                // Calculate date range for quick ranges
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let startDate;
                let endDate;

                switch (timeRange) {
                    case 'TODAY':
                        startDate = today;
                        endDate = today;
                        break;
                    case 'YESTERDAY': {
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        startDate = yesterday;
                        endDate = yesterday;
                        break;
                    }
                    case 'THIS_WEEK': {
                        const dayOfWeek = today.getDay();
                        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        const monday = new Date(today);
                        monday.setDate(monday.getDate() - diff);
                        startDate = monday;
                        endDate = today;
                        break;
                    }
                    case 'THIS_MONTH': {
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        endDate = today;
                        break;
                    }
                    case 'THIS_YEAR': {
                        startDate = new Date(today.getFullYear(), 0, 1);
                        endDate = today;
                        break;
                    }
                    default:
                        startDate = null;
                        endDate = null;
                }

                if (startDate) {
                    filters.startDate = startDate.toISOString().split('T')[0];
                    filters.endDate = endDate.toISOString().split('T')[0];
                }
            }

            // Add category filter if selected
            if (categoryFilter !== 'ALL') {
                filters.category = categoryFilter;
            }

            // Add search query if present
            if (searchQuery) {
                filters.searchQuery = searchQuery;
            }

            const response = await fetchExpenses(filters);

            if (response.success && response.results) {
                const expensesData = response.results.expenses.map(exp => ({
                    ...exp,
                    date: new Date(exp.date)
                }));
                setExpenses(expensesData);
            }
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setIsLoadingExpenses(false);
        }
    }, [timeRange, customRange, categoryFilter, searchQuery]);

    // Load expenses on mount and when filters change
    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    // Handle time range change
    const handleTimeRangeChange = useCallback((range, startDate = null, endDate = null) => {
        if (range === 'CUSTOM' && startDate && endDate) {
            setCustomRange({ start: startDate, end: endDate });
            setTimeRange('CUSTOM');
        } else {
            setTimeRange(range);
            setCustomRange({ start: null, end: null });
        }
        setShowDatePicker(false);
    }, []);

    // Expenses are already filtered by API, just sort for display
    const filteredExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses]);

    // Pagination
    const paginatedExpenses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredExpenses, currentPage]);

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(expenses.map(exp => exp.category));
        return Array.from(cats).sort();
    }, [expenses]);

    // Calculate total
    const totalExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [filteredExpenses]);

    // Handle save expense
    const handleSaveExpense = useCallback(async (expenseData) => {
        try {
            // Convert user's local date to UTC midnight
            let utcDate;
            if (expenseData.date instanceof Date) {
                // If it's already a Date object, use it
                utcDate = expenseData.date;
            } else if (typeof expenseData.date === 'string') {
                // If it's a string from date input (YYYY-MM-DD format)
                // Create date in user's local timezone at midnight
                const [year, month, day] = expenseData.date.split('-').map(Number);
                const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
                utcDate = localDate;
            } else {
                // Fallback to current date
                utcDate = new Date();
            }

            // Prepare data for API
            const apiData = {
                amount: parseFloat(expenseData.amount),
                currency: expenseData.currency,
                category: expenseData.category,
                description: expenseData.description || '',
                date: utcDate.toISOString(), // Send as UTC ISO string
                vendor: expenseData.vendor || '',
                paymentMethod: expenseData.paymentMethod || ''
            };

            if (editingExpense) {
                // Update existing expense
                apiData._id = expenseData._id;
                const response = await updateExpense(apiData);

                if (response.success) {
                    await loadExpenses(); // Reload to get updated data
                }
            } else {
                // Create new expense
                const response = await createExpense(apiData);

                if (response.success) {
                    await loadExpenses(); // Reload to get new expense
                }
            }

            setEditingExpense(null);
            setShowExpenseModal(false);
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Failed to save expense. Please try again.');
        }
    }, [editingExpense, loadExpenses]);

    // Handle delete expense
    const handleDeleteExpense = useCallback(async (expense) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                const response = await deleteExpense(expense._id);

                if (response.success) {
                    await loadExpenses(); // Reload to refresh list
                    setSelectedExpense(null);
                }
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense. Please try again.');
            }
        }
    }, [loadExpenses]);

    // Handle edit expense
    const handleEditExpense = useCallback((expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
        setSelectedExpense(null);
    }, []);

    // Handle search
    const handleSearch = useCallback(() => {
        const query = searchInputRef.current?.value || '';
        setSearchQuery(query.trim());
        setCurrentPage(1);
    }, []);

    return (
        <div className="min-h-screen bg-[#14181B] pb-20 font-sans flex flex-row">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full"></div>
            </div>

            <Sidebar
                fileName="Expenses"
                setShowRateModal={() => {}}
                setRawData={setRawData}
                isLoading={loading}
            />

            <div className={`flex-1 ml-64 transition-all duration-300 ${selectedExpense ? 'mr-96' : ''} flex flex-col h-screen overflow-hidden`}>
                {/* Fixed Header */}
                <div className="flex-shrink-0 bg-[#14181B] border-b border-slate-700/50">
                    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Expenses</h1>
                                <p className="text-slate-400 mt-1">Track and manage business expenses</p>
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
                                    onClick={() => {
                                        setEditingExpense(null);
                                        setShowExpenseModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
                                >
                                    <Plus size={16} />
                                    Add Expense
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="pb-4">
                            <Card>
                                <div className="space-y-4">
                                    {/* Search Bar */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="Search expenses..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSearch();
                                                    }
                                                }}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                            />
                                        </div>

                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="ALL">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={handleSearch}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                                        >
                                            Search
                                        </button>
                                    </div>

                                    {/* Summary */}
                                    <div className="flex items-center justify-between text-sm border-t border-slate-700/50 pt-4">
                                        <p className="text-slate-400">
                                            Showing <span className="text-white font-semibold">{paginatedExpenses.length}</span> of{' '}
                                            <span className="text-white font-semibold">{filteredExpenses.length}</span> expenses
                                        </p>
                                        <p className="text-white font-semibold">
                                            Total: <span className="text-rose-400">{totalExpenses.toLocaleString()} RWF</span>
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
                        {/* Expenses Table */}
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-800/40 z-10">
                                        <tr className="text-xs text-slate-400 border-b border-slate-700">
                                            <th className="py-3 font-medium uppercase tracking-wider">Date</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Category</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Description</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Vendor</th>
                                            <th className="py-3 font-medium uppercase tracking-wider">Payment Method</th>
                                            <th className="py-3 font-medium uppercase tracking-wider text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingExpenses ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-12">
                                                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-slate-400 mt-3">Loading expenses...</p>
                                                </td>
                                            </tr>
                                        ) : paginatedExpenses.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-12">
                                                    <p className="text-slate-400 text-lg">No expenses found</p>
                                                    <button
                                                        onClick={() => setShowExpenseModal(true)}
                                                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        Add your first expense
                                                    </button>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedExpenses.map((expense, i) => {
                                                const isSelected = selectedExpense?._id === expense._id;
                                                return (
                                                    <tr
                                                        key={i}
                                                        onClick={() => setSelectedExpense(expense)}
                                                        className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                                                            isSelected ? 'bg-blue-500/10' : ''
                                                        }`}
                                                    >
                                                        <td className="py-4 text-slate-300 text-sm">
                                                            {new Date(expense.date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                            <br />
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(expense.date).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="font-medium text-white bg-slate-700/50 px-2 py-1 rounded-lg text-sm">
                                                                {expense.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-white text-sm">
                                                            {expense.description || '-'}
                                                        </td>
                                                        <td className="py-4 text-slate-300 text-sm">
                                                            {expense.vendor || '-'}
                                                        </td>
                                                        <td className="py-4 text-slate-300 text-sm">
                                                            {expense.paymentMethod || '-'}
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <span className="font-bold text-rose-400">
                                                                {expense.amount.toLocaleString()} <span className="text-slate-500 text-sm">{expense.currency}</span>
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
                            currentRange={timeRange}
                            onClose={() => setShowDatePicker(false)}
                        />
                    </div>
                </>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <ExpenseModal
                    expense={editingExpense}
                    onClose={() => {
                        setShowExpenseModal(false);
                        setEditingExpense(null);
                    }}
                    onSave={handleSaveExpense}
                />
            )}

            {/* Expense Details Side Panel */}
            {selectedExpense && (
                <ExpenseDetailsPanel
                    expense={selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                />
            )}
        </div>
    );
}
