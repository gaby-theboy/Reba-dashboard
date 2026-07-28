import React, { useState, useEffect, useCallback } from 'react';
import { X, Save } from 'lucide-react';

const RateModal = React.memo(({ isOpen, currencies, rates, onSave, onClose }) => {
    const [localRates, setLocalRates] = useState(rates);

    useEffect(() => {
        if (isOpen) setLocalRates(rates);
    }, [isOpen, rates]);

    const handleChange = useCallback((currency, value) => {
        setLocalRates(prev => ({ ...prev, [currency]: parseFloat(value) || 0 }));
    }, []);

    const handleSave = useCallback(() => {
        onSave(localRates);
    }, [localRates, onSave]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700 animate-slideUp">
                <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white text-lg">Exchange Rates</h3>
                        <p className="text-blue-100 text-xs mt-1">Convert to RWF</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-slate-400 mb-4">
                        Enter the exchange rate to convert 1 unit of each currency into RWF.
                    </p>
                    <div className="space-y-3">
                        {currencies.map(curr => (
                            <div key={curr} className="flex items-center justify-between gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all">
                                <span className="font-bold text-white w-16 text-lg">{curr}</span>
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-slate-500 text-sm">=</span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={localRates[curr] || ''}
                                        onChange={(e) => handleChange(curr, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-right text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Rate"
                                    />
                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">RWF</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Save size={16} /> Save & Apply
                    </button>
                </div>
            </div>
        </div>
    );
});

RateModal.displayName = 'RateModal';

export default RateModal;
