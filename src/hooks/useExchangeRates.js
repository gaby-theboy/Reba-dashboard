import { useState, useCallback, useRef } from 'react';

const STORAGE_KEY = 'exchangeRates';
const DEFAULT_RATES = {
    BIF: 0.25,
    CDF: 0.5,
    KES: 10,
    KSH: 10.001,
    RWF: 1.002,
    UGX: 0.34,
    USD: 1400,
    XAF: 2.59,
    ZMW: 45.46,
};

/**
 * Custom hook for managing exchange rates with localStorage persistence
 * @returns {Object} Exchange rates state and handlers
 */
export const useExchangeRates = () => {
    const [exchangeRates, setExchangeRates] = useState(() => {
        const storedRates = localStorage.getItem(STORAGE_KEY);
        if (storedRates) {
            try {
                return JSON.parse(storedRates);
            } catch (e) {
                console.error("Failed to parse exchange rates from localStorage:", e);
                return DEFAULT_RATES;
            }
        }
        return DEFAULT_RATES;
    });

    const [showRateModal, setShowRateModal] = useState(false);

    // Track if we've already shown the modal for missing rates
    const hasPromptedForRates = useRef(false);

    const saveRates = useCallback((newRates) => {
        setExchangeRates(newRates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
        setShowRateModal(false);
    }, []);

    // Initialize currencies and optionally open modal if rates are needed
    // Returns true if modal was opened
    const initializeCurrencies = useCallback((currencies) => {
        let needsRates = false;

        setExchangeRates(prev => {
            const next = { ...prev };
            currencies.forEach(c => {
                if (!next[c]) {
                    next[c] = DEFAULT_RATES[c] ?? (c === 'RWF' ? 1.002 : 0);
                }
                // Check if this currency needs a rate
                if (c !== 'RWF' && (!next[c] || next[c] === 0)) {
                    needsRates = true;
                }
            });
            return next;
        });

        // Only prompt once per session
        if (needsRates && !hasPromptedForRates.current) {
            hasPromptedForRates.current = true;
            setShowRateModal(true);
        }
    }, []);

    const openModal = useCallback(() => setShowRateModal(true), []);
    const closeModal = useCallback(() => setShowRateModal(false), []);

    return {
        exchangeRates,
        showRateModal,
        saveRates,
        initializeCurrencies,
        openModal,
        closeModal
    };
};

export default useExchangeRates;
