import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';

// Move constant outside component to prevent recreation
const DATE_RANGES = [
    { key: 'ALL', label: 'All Time' },
    { key: 'TODAY', label: 'Today' },
    { key: 'YESTERDAY', label: 'Yesterday' },
    { key: 'THIS_WEEK', label: 'This Week' },
    { key: 'LAST_WEEK', label: 'Last Week' },
    { key: 'THIS_MONTH', label: 'This Month' },
    { key: 'LAST_MONTH', label: 'Last Month' },
    { key: 'THIS_YEAR', label: 'This Year' },
    { key: 'LAST_YEAR', label: 'Last Year' },
    { key: 'CUSTOM', label: 'Custom Range' },
];

const DateRangeModal = React.memo(({ isOpen, onClose, onRangeChange, availableDates, currentRange }) => {
    const [selectedRange, setSelectedRange] = useState(currentRange);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const handleSelect = useCallback((rangeKey) => {
        if (rangeKey === 'CUSTOM') {
            setSelectedRange(rangeKey);
            return;
        }
        setSelectedRange(rangeKey);
        onRangeChange(rangeKey);
        onClose();
    }, [onRangeChange, onClose]);

    const handleApplyCustom = useCallback(() => {
        if (customStart && customEnd) {
            onRangeChange('CUSTOM', customStart, customEnd);
            onClose();
        }
    }, [customStart, customEnd, onRangeChange, onClose]);

    const handleCancel = useCallback(() => {
        setSelectedRange(currentRange);
        onClose();
    }, [currentRange, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 animate-slideUp">
                <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg">Select Date Range</h3>
                    <button
                        onClick={handleCancel}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <ul className="space-y-2">
                        {DATE_RANGES.map((range) => (
                            <li key={range.key}>
                                <button
                                    onClick={() => handleSelect(range.key)}
                                    className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all ${selectedRange === range.key
                                        ? 'text-white bg-slate-700/50 font-medium border border-slate-600'
                                        : 'text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {selectedRange === 'CUSTOM' && (
                        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                            <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Custom Range</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 text-sm mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        max={customEnd || (availableDates?.end ? availableDates.end.toISOString().split('T')[0] : undefined)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                        min={customStart || (availableDates?.start ? availableDates.start.toISOString().split('T')[0] : undefined)}
                                        max={availableDates?.end ? availableDates.end.toISOString().split('T')[0] : undefined}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-5 py-2.5 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    {selectedRange === 'CUSTOM' && (
                        <button
                            onClick={handleApplyCustom}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

DateRangeModal.displayName = 'DateRangeModal';

export default DateRangeModal;
