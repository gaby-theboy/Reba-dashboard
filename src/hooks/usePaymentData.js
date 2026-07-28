import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPaymentData } from '../backend/api/api';

/**
 * Transform API response items into usable format
 */
const transformApiResponse = (itemsObject) => {
    const transformedData = [];
    const currenciesSet = new Set();

    for (const dateStr in itemsObject) {
        if (Object.prototype.hasOwnProperty.call(itemsObject, dateStr)) {
            const transactionsForDate = itemsObject[dateStr];
            if (Array.isArray(transactionsForDate)) {
                transactionsForDate.forEach(item => {
                    let timestamp = item._createdDate || item.createdAt || item.timestamp || dateStr;

                    // Backend returns UTC+2 times but with incorrect 'Z' suffix
                    // Remove 'Z' so JavaScript parses it as local time (as-is)
                    if (typeof timestamp === 'string' && timestamp.endsWith('Z')) {
                        timestamp = timestamp.slice(0, -1);
                    }

                    const parsedDate = new Date(timestamp);

                    const transformedItem = {
                        ...item,
                        date: parsedDate,
                        amount: parseFloat(item.amount) || 0,
                        currency: item.currency || 'Unknown',
                        plan: item.planName || 'Unknown',
                        status: item.status?.toLowerCase() || 'unknown',
                        hour: parsedDate.getHours(),
                        email: item.email
                    };

                    if (!isNaN(transformedItem.date.getTime())) {
                        transformedData.push(transformedItem);
                        currenciesSet.add(transformedItem.currency);
                    }
                });
            }
        }
    }

    return {
        data: transformedData,
        currencies: Array.from(currenciesSet).sort()
    };
};

/**
 * Get month key from date (YYYY-MM format)
 */
const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get all months between two dates (inclusive)
 */
const getMonthsBetween = (startDate, endDate) => {
    const months = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
        months.push(getMonthKey(current));
        current.setMonth(current.getMonth() + 1);
    }

    return months;
};

/**
 * Get date range for server-side filtering based on timeRange
 * Backend will automatically expand to full months + previous month for comparison
 */
const getServerDateRange = (timeRange, customRange) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const formatDate = (d) => d.toISOString().split('T')[0];

    switch (timeRange) {
        case 'TODAY': {
            return { startDate: formatDate(now), endDate: formatDate(now) };
        }
        case 'YESTERDAY': {
            const yesterday = new Date(year, month, now.getDate() - 1);
            return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
        }
        case 'THIS_WEEK': {
            // Week starts on Monday (1), not Sunday (0)
            const weekStart = new Date(now);
            const dayOfWeek = now.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days back, else day - 1
            weekStart.setDate(now.getDate() - daysFromMonday);

            // Include last week for comparison data
            const lastWeekStart = new Date(weekStart);
            lastWeekStart.setDate(weekStart.getDate() - 7);

            return { startDate: formatDate(lastWeekStart), endDate: formatDate(now) };
        }
        case 'LAST_WEEK': {
            // Week starts on Monday
            const dayOfWeek = now.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - daysFromMonday - 7); // Go back to last Monday
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Sunday
            return { startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd) };
        }
        case 'TWO_WEEKS': {
            // Last 2 weeks from today
            const twoWeeksAgo = new Date(now);
            twoWeeksAgo.setDate(now.getDate() - 14);
            return { startDate: formatDate(twoWeeksAgo), endDate: formatDate(now) };
        }
        case 'THIS_MONTH': {
            const monthStart = new Date(year, month, 1);

            // Include last month for comparison data
            const lastMonthStart = new Date(year, month - 1, 1);

            return { startDate: formatDate(lastMonthStart), endDate: formatDate(now) };
        }
        case 'LAST_MONTH': {
            const lastMonthStart = new Date(year, month - 1, 1);
            const lastMonthEnd = new Date(year, month, 0);
            return { startDate: formatDate(lastMonthStart), endDate: formatDate(lastMonthEnd) };
        }
        case 'THIS_YEAR': {
            const yearStart = new Date(year, 0, 1);

            // Include last year for comparison data
            const lastYearStart = new Date(year - 1, 0, 1);

            return { startDate: formatDate(lastYearStart), endDate: formatDate(now) };
        }
        case 'LAST_YEAR': {
            const lastYearStart = new Date(year - 1, 0, 1);
            const lastYearEnd = new Date(year - 1, 11, 31);
            return { startDate: formatDate(lastYearStart), endDate: formatDate(lastYearEnd) };
        }
        case 'CUSTOM': {
            if (customRange?.start && customRange?.end) {
                return {
                    startDate: formatDate(new Date(customRange.start)),
                    endDate: formatDate(new Date(customRange.end))
                };
            }
            // Fall through to default
        }
        case 'ALL':
        default: {
            // Fetch current year
            return { startDate: `${year}-01-01`, endDate: formatDate(now) };
        }
    }
};

/**
 * Custom hook for fetching and managing payment data
 * Uses hybrid approach: server-side date filtering, client-side granularity/visibility filtering
 * Caches fetched months to avoid re-fetching
 */
export const usePaymentData = () => {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState("API Data");
    const [error, setError] = useState(null);
    const [detectedCurrencies, setDetectedCurrencies] = useState([]);

    // Cache: stores data by month key (YYYY-MM)
    const monthCache = useRef(new Map());
    // Track which months have been fetched
    const fetchedMonths = useRef(new Set());

    // Track fetch state
    const hasFetched = useRef(false);
    const isReloading = useRef(false);
    const abortController = useRef(null);

    /**
     * Update rawData from cache based on all cached months
     * Note: No dependencies needed as it only reads from refs and updates state
     */
    const updateRawDataFromCache = useCallback(() => {
        const allData = [];
        const currenciesSet = new Set();

        monthCache.current.forEach((monthData) => {
            monthData.forEach(item => {
                allData.push(item);
                currenciesSet.add(item.currency);
            });
        });

        // Sort by date
        allData.sort((a, b) => a.date - b.date);

        setRawData(allData);
        setFileName(`API Data (${allData.length} records)`);

        const currencies = Array.from(currenciesSet).sort();
        // Only update currencies if they've changed (prevent infinite loops)
        setDetectedCurrencies(prev => {
            const prevSorted = [...prev].sort().join(',');
            const newSorted = [...currencies].sort().join(',');
            return prevSorted === newSorted ? prev : currencies;
        });

        return { data: allData, currencies };
    }, []); // Empty deps: only reads refs, updates state

    /**
     * Add data to cache organized by month
     */
    const addToCache = useCallback((data, fetchedRange) => {
        // Get months covered by this fetch
        if (fetchedRange?.start && fetchedRange?.end) {
            const months = getMonthsBetween(fetchedRange.start, fetchedRange.end);
            months.forEach(month => fetchedMonths.current.add(month));
        }

        // Organize data by month
        data.forEach(item => {
            const monthKey = getMonthKey(item.date);
            if (!monthCache.current.has(monthKey)) {
                monthCache.current.set(monthKey, []);
            }

            // Check if item already exists (by _id)
            const monthData = monthCache.current.get(monthKey);
            const exists = monthData.some(existing => existing._id === item._id);
            if (!exists) {
                monthData.push(item);
            }
        });
    }, []);

    /**
     * Check which months are missing from cache
     */
    const getMissingMonths = useCallback((startDate, endDate) => {
        const neededMonths = getMonthsBetween(startDate, endDate);
        return neededMonths.filter(month => !fetchedMonths.current.has(month));
    }, []);

    /**
     * Fetch data from API
     */
    const fetchData = useCallback(async (dateRange = null, filterParams = null) => {
        // Cancel any pending request
        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const params = { ...(dateRange || {}), ...(filterParams || {}) };
            const apiResponse = await fetchPaymentData(params);

            if (!apiResponse || !apiResponse.results || typeof apiResponse.results.items !== 'object') {
                throw new Error("API response format is incorrect.");
            }

            const { data, currencies } = transformApiResponse(apiResponse.results.items);

            // If this is a filtered query, don't cache - just return the filtered results directly
            if (filterParams && Object.keys(filterParams).some(key => filterParams[key] !== undefined)) {
                setRawData(data);
                setFileName(`API Data (${data.length} records)`);

                // Only update currencies if they've changed (prevent infinite loops)
                setDetectedCurrencies(prev => {
                    const prevSorted = [...prev].sort().join(',');
                    const newSorted = [...currencies].sort().join(',');
                    return prevSorted === newSorted ? prev : currencies;
                });

                return { data, currencies };
            }

            // Add to cache with the actual fetched range from server
            const fetchedRange = apiResponse.results.dateRange;
            addToCache(data, fetchedRange);

            // Update rawData from cache
            return updateRawDataFromCache();
        } catch (err) {
            if (err.name === 'AbortError') return { data: [], currencies: [] };
            setError(err.message || "An error occurred while fetching data.");
            return { data: [], currencies: [] };
        } finally {
            setLoading(false);
            isReloading.current = false;
        }
    }, [addToCache, updateRawDataFromCache]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    // Reload - clears cache and re-fetches
    const reload = useCallback(() => {
        isReloading.current = true;
        monthCache.current.clear();
        fetchedMonths.current.clear();
        setRawData([]);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        fetchData({
            startDate: `${year}-${month}-01`,
            endDate: `${year}-${month}-${lastDay}`
        });
    }, [fetchData]);

    /**
     * Smart fetch for a specific time range
     * Only fetches missing months from server
     * Supports filter parameters for search and filters
     */
    const fetchForTimeRange = useCallback((timeRange, customRange = null, filterParams = null) => {
        const dateRange = getServerDateRange(timeRange, customRange);

        // If filters are provided, skip cache and always fetch from server
        // This ensures search/filter queries hit the database
        if (filterParams && Object.keys(filterParams).some(key => filterParams[key] !== undefined)) {
            return fetchData(dateRange, filterParams);
        }

        // Check which months we need
        const missingMonths = getMissingMonths(dateRange.startDate, dateRange.endDate);

        // If all months are cached, just update from cache
        if (missingMonths.length === 0) {
            return Promise.resolve(updateRawDataFromCache());
        }

        // Fetch missing months - the backend will expand to full months anyway
        // So we just need to request the range that covers missing months
        const sortedMissing = missingMonths.sort();
        const firstMissing = sortedMissing[0];
        const lastMissing = sortedMissing[sortedMissing.length - 1];

        // Parse month keys to dates
        const [firstYear, firstMonth] = firstMissing.split('-').map(Number);
        const [lastYear, lastMonth] = lastMissing.split('-').map(Number);

        const fetchStartDate = `${firstYear}-${String(firstMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(lastYear, lastMonth, 0).getDate();
        const fetchEndDate = `${lastYear}-${String(lastMonth).padStart(2, '0')}-${lastDay}`;

        return fetchData({ startDate: fetchStartDate, endDate: fetchEndDate }, filterParams);
    }, [getMissingMonths, fetchData, updateRawDataFromCache]);

    /**
     * Get cache info for debugging
     */
    const getCacheInfo = useCallback(() => ({
        cachedMonths: Array.from(fetchedMonths.current).sort(),
        totalCachedRecords: rawData.length
    }), [rawData.length]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    return {
        rawData,
        setRawData,
        loading,
        fileName,
        error,
        detectedCurrencies,
        reload,
        fetchForTimeRange,
        getCacheInfo
    };
};

export default usePaymentData;
