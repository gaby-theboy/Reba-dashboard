import { useMemo } from 'react';

/**
 * Calculate date range boundaries based on time range selection
 */
const getDateBoundaries = (timeRange, customRange) => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    let startDate = null;
    let endDate = null;

    switch (timeRange) {
        case 'TODAY':
            startDate = todayStart;
            endDate = todayEnd;
            break;
        case 'YESTERDAY': {
            const yesterdayStart = new Date(now);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            startDate = yesterdayStart;
            endDate = yesterdayEnd;
            break;
        }
        case 'THIS_WEEK': {
            // Week starts on Monday (1), not Sunday (0)
            const thisWeekStart = new Date(todayStart);
            const dayOfWeek = todayStart.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days back
            thisWeekStart.setDate(todayStart.getDate() - daysFromMonday);
            startDate = thisWeekStart;
            endDate = todayEnd;
            break;
        }
        case 'LAST_WEEK': {
            // Week starts on Monday
            const dayOfWeek = todayStart.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const lastWeekStart = new Date(todayStart);
            lastWeekStart.setDate(todayStart.getDate() - daysFromMonday - 7); // Go back to last Monday
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Sunday
            lastWeekEnd.setHours(23, 59, 59, 999);
            startDate = lastWeekStart;
            endDate = lastWeekEnd;
            break;
        }
        case 'TWO_WEEKS': {
            // Last 2 weeks from today
            const twoWeeksAgo = new Date(todayStart);
            twoWeeksAgo.setDate(todayStart.getDate() - 14);
            startDate = twoWeeksAgo;
            endDate = todayEnd;
            break;
        }
        case 'THIS_MONTH':
            startDate = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
            endDate = todayEnd;
            break;
        case 'LAST_MONTH': {
            const lastMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth() - 1, 1);
            const lastMonthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth(), 0);
            lastMonthEnd.setHours(23, 59, 59, 999);
            startDate = lastMonthStart;
            endDate = lastMonthEnd;
            break;
        }
        case 'THIS_YEAR':
            startDate = new Date(todayStart.getFullYear(), 0, 1);
            endDate = todayEnd;
            break;
        case 'LAST_YEAR': {
            const lastYearStart = new Date(todayStart.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(todayStart.getFullYear() - 1, 11, 31);
            lastYearEnd.setHours(23, 59, 59, 999);
            startDate = lastYearStart;
            endDate = lastYearEnd;
            break;
        }
        case 'CUSTOM':
            if (customRange.start && customRange.end) {
                startDate = new Date(customRange.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(customRange.end);
                endDate.setHours(23, 59, 59, 999);
            }
            break;
        case 'ALL':
        default:
            break;
    }

    return { startDate, endDate };
};

/**
 * Determine chart granularity based on date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} timeRange
 * @param {string|null} manualGranularity - User override for granularity
 */
const getEffectiveGranularity = (startDate, endDate, timeRange, manualGranularity = null) => {
    // If user manually selected a granularity, use it
    if (manualGranularity) {
        return manualGranularity;
    }

    // Auto-detect based on date range
    if (!startDate || !endDate) {
        return timeRange === 'ALL' ? 'month' : 'day';
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff <= 1) return 'hour';
    if (daysDiff <= 7) return 'day';
    if (daysDiff <= 31) return 'day';
    if (daysDiff <= 90) return 'week';
    return 'month';
};

/**
 * Get comparison period boundaries for growth calculation
 */
const getComparisonPeriod = (timeRange, startDate) => {
    if (!startDate) return { compareStart: null, compareEnd: null };

    let compareStart = null;
    let compareEnd = null;

    switch (timeRange) {
        case 'TODAY':
        case 'YESTERDAY': {
            compareStart = new Date(startDate);
            compareStart.setDate(compareStart.getDate() - 1);
            compareStart.setHours(0, 0, 0, 0);
            compareEnd = new Date(compareStart);
            compareEnd.setHours(23, 59, 59, 999);
            break;
        }
        case 'THIS_WEEK': {
            compareStart = new Date(startDate);
            compareStart.setDate(compareStart.getDate() - 7);
            compareStart.setHours(0, 0, 0, 0);
            compareEnd = new Date(compareStart);
            compareEnd.setDate(compareEnd.getDate() + 6);
            compareEnd.setHours(23, 59, 59, 999);
            break;
        }
        case 'THIS_MONTH': {
            compareStart = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
            compareStart.setHours(0, 0, 0, 0);
            compareEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
            compareEnd.setHours(23, 59, 59, 999);
            break;
        }
        case 'THIS_YEAR': {
            compareStart = new Date(startDate.getFullYear() - 1, 0, 1);
            compareStart.setHours(0, 0, 0, 0);
            compareEnd = new Date(startDate.getFullYear() - 1, 11, 31);
            compareEnd.setHours(23, 59, 59, 999);
            break;
        }
        default:
            break;
    }

    return { compareStart, compareEnd };
};

/**
 * Custom hook for processing dashboard data
 * @param {Array} rawData - Raw transaction data
 * @param {string} timeRange - Selected time range
 * @param {Object} customRange - Custom date range {start, end}
 * @param {Object} exchangeRates - Currency exchange rates
 * @param {string|null} granularity - Manual granularity override (hour, day, week, month)
 */
export const useProcessedData = (rawData, timeRange, customRange, exchangeRates, granularity = null) => {
    // Memoize filtered data separately
    const filteredData = useMemo(() => {
        if (rawData.length === 0) return [];

        const { startDate, endDate } = getDateBoundaries(timeRange, customRange);

        let filtered = rawData;
        if (startDate && endDate) {
            filtered = rawData.filter(d => d.date >= startDate && d.date <= endDate);
        }

        return filtered.sort((a, b) => a.date - b.date);
    }, [rawData, timeRange, customRange]);

    // Memoize data with net calculations
    const dataWithNet = useMemo(() => {
        return filteredData.map(item => {
            const netOriginal = item.amount * 0.96;
            const rate = exchangeRates[item.currency] || 1;
            const netRWF = netOriginal * rate;
            return { ...item, netRWF, netOriginal };
        });
    }, [filteredData, exchangeRates]);

    // Memoize aggregated metrics
    const metrics = useMemo(() => {
        let totalNetRWF = 0;
        let successCount = 0;
        let failCount = 0;
        const emailCounts = {};

        dataWithNet.forEach(item => {
            if (item.status === 'success') {
                totalNetRWF += item.netRWF;
                successCount++;
                emailCounts[item.email] = (emailCounts[item.email] || 0) + 1;
            } else {
                failCount++;
            }
        });

        const uniqueEmails = new Set(dataWithNet.filter(d => d.status === 'success').map(d => d.email));
        const uniqueCustomerCount = uniqueEmails.size;
        let returningCustomerCount = 0;
        for (const count of Object.values(emailCounts)) {
            if (count > 1) returningCustomerCount++;
        }

        const averageTransactionValue = successCount > 0 ? totalNetRWF / successCount : 0;

        return {
            totalNetRWF,
            successCount,
            failCount,
            uniqueCustomerCount,
            returningCustomerCount,
            averageTransactionValue
        };
    }, [dataWithNet]);

    // Memoize TODAY/YESTERDAY comparison data
    const todayYesterdayData = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const yesterdayStart = new Date(now);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterdayStart);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const todayTransactions = rawData.filter(item =>
            item.date >= todayStart && item.date <= todayEnd && item.status === 'success'
        );
        const yesterdayTransactions = rawData.filter(item =>
            item.date >= yesterdayStart && item.date <= yesterdayEnd && item.status === 'success'
        );

        let todayRevenue = 0;
        todayTransactions.forEach(item => {
            const net = (item.amount * 0.96) * (exchangeRates[item.currency] || 1);
            todayRevenue += net;
        });

        let yesterdayRevenue = 0;
        yesterdayTransactions.forEach(item => {
            const net = (item.amount * 0.96) * (exchangeRates[item.currency] || 1);
            yesterdayRevenue += net;
        });

        const todayCustomers = new Set(todayTransactions.map(t => t.email)).size;
        const yesterdayCustomers = new Set(yesterdayTransactions.map(t => t.email)).size;

        // Calculate average transaction values
        const todayAvgTransaction = todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0;
        const yesterdayAvgTransaction = yesterdayTransactions.length > 0 ? yesterdayRevenue / yesterdayTransactions.length : 0;

        // Calculate returning customers (those who appear more than once in the dataset)
        const todayEmailCounts = {};
        todayTransactions.forEach(tx => {
            todayEmailCounts[tx.email] = (todayEmailCounts[tx.email] || 0) + 1;
        });
        const todayReturningCustomers = Object.values(todayEmailCounts).filter(count => count > 1).length;

        const yesterdayEmailCounts = {};
        yesterdayTransactions.forEach(tx => {
            yesterdayEmailCounts[tx.email] = (yesterdayEmailCounts[tx.email] || 0) + 1;
        });
        const yesterdayReturningCustomers = Object.values(yesterdayEmailCounts).filter(count => count > 1).length;

        return {
            todayRevenue,
            yesterdayRevenue,
            todayTransactions: todayTransactions.length,
            yesterdayTransactions: yesterdayTransactions.length,
            todayCustomers,
            yesterdayCustomers,
            todayAvgTransaction,
            yesterdayAvgTransaction,
            todayReturningCustomers,
            yesterdayReturningCustomers
        };
    }, [rawData, exchangeRates]);

    // Memoize growth calculations
    const growth = useMemo(() => {
        const { startDate, endDate } = getDateBoundaries(timeRange, customRange);
        const { compareStart, compareEnd } = getComparisonPeriod(timeRange, startDate);

        let previousPeriodRevenue = 0;
        let previousPeriodCount = 0;
        let previousPeriodUniqueCustomers = 0;

        if (timeRange !== 'ALL' && compareStart && compareEnd) {
            const previousPeriodData = rawData.filter(item =>
                item.date >= compareStart && item.date <= compareEnd && item.status === 'success'
            );

            previousPeriodData.forEach(item => {
                const net = (item.amount * 0.96) * (exchangeRates[item.currency] || 1);
                previousPeriodRevenue += net;
                previousPeriodCount++;
            });

            const previousUniqueEmails = new Set(previousPeriodData.map(d => d.email));
            previousPeriodUniqueCustomers = previousUniqueEmails.size;
        }

        const growthPercent = previousPeriodRevenue === 0
            ? (metrics.totalNetRWF > 0 ? 100 : 0)
            : ((metrics.totalNetRWF - previousPeriodRevenue) / previousPeriodRevenue) * 100;

        const transactionGrowth = previousPeriodCount === 0
            ? (metrics.successCount > 0 ? 100 : 0)
            : ((metrics.successCount - previousPeriodCount) / previousPeriodCount) * 100;

        const customerGrowth = previousPeriodUniqueCustomers === 0
            ? (metrics.uniqueCustomerCount > 0 ? 100 : 0)
            : ((metrics.uniqueCustomerCount - previousPeriodUniqueCustomers) / previousPeriodUniqueCustomers) * 100;

        return {
            growthPercent,
            transactionGrowth,
            customerGrowth,
            previousPeriodRevenue,
            comparisonDates: {
                currentStart: startDate,
                currentEnd: endDate,
                compareStart,
                compareEnd
            }
        };
    }, [rawData, timeRange, customRange, exchangeRates, metrics]);

    // Memoize chart data
    const chartData = useMemo(() => {
        const { startDate, endDate } = getDateBoundaries(timeRange, customRange);
        const effectiveGranularity = getEffectiveGranularity(startDate, endDate, timeRange, granularity);

        const revenueMap = new Map();
        const transactionMap = new Map();
        const planMap = new Map();
        const activeCurrenciesSet = new Set();
        const activePlansSet = new Set();

        // Pre-populate all hours (0-23) when using hourly granularity
        if (effectiveGranularity === 'hour') {
            for (let h = 0; h < 24; h++) {
                const key = `${h.toString().padStart(2, '0')}:00`;
                revenueMap.set(key, { name: key, _sortKey: h });
                transactionMap.set(key, { name: key, _sortKey: h });
                planMap.set(key, { name: key, _sortKey: h });
            }
        }

        dataWithNet.forEach(item => {
            if (item.status !== 'success') return;

            activeCurrenciesSet.add(item.currency);
            activePlansSet.add(item.plan);

            let key;
            let sortKey;
            const d = item.date;
            if (effectiveGranularity === 'hour') {
                // Format: "14:00" for hourly view - use local hours as backend returns UTC+2 times
                const hour = d.getHours();
                key = `${hour.toString().padStart(2, '0')}:00`;
                sortKey = hour; // Sort by hour number (0-23)
            } else if (effectiveGranularity === 'week') {
                // Get the week start date (Monday)
                const weekStart = new Date(d);
                const dayOfWeek = d.getDay();
                const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days back
                weekStart.setDate(d.getDate() - daysFromMonday);
                key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                sortKey = weekStart.getTime();
            } else if (effectiveGranularity === 'month') {
                key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                sortKey = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
            } else {
                // day - Format: "Jan 15"
                key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                sortKey = d.getTime();
            }

            // Revenue aggregation
            if (!revenueMap.has(key)) revenueMap.set(key, { name: key, _sortKey: sortKey });
            const revenueEntry = revenueMap.get(key);
            revenueEntry[item.currency] = (revenueEntry[item.currency] || 0) + item.netRWF;

            // Transaction aggregation
            if (!transactionMap.has(key)) transactionMap.set(key, { name: key, _sortKey: sortKey });
            const transactionEntry = transactionMap.get(key);
            transactionEntry[item.currency] = (transactionEntry[item.currency] || 0) + 1;

            // Plan aggregation
            if (!planMap.has(key)) planMap.set(key, { name: key, _sortKey: sortKey });
            const planEntry = planMap.get(key);
            planEntry[item.plan] = (planEntry[item.plan] || 0) + 1;
        });

        const addTotals = (map) => {
            const entries = Array.from(map.values());
            // Sort by the sort key, then remove it
            entries.sort((a, b) => (a._sortKey || 0) - (b._sortKey || 0));
            return entries.map(({ _sortKey, ...entry }) => {
                const total = Object.keys(entry)
                    .filter(key => key !== 'name')
                    .reduce((sum, curr) => sum + (entry[curr] || 0), 0);
                return { ...entry, total };
            });
        };

        return {
            revenueChartData: addTotals(revenueMap),
            transactionChartData: addTotals(transactionMap),
            planChartData: addTotals(planMap),
            activeCurrencies: Array.from(activeCurrenciesSet),
            activePlans: Array.from(activePlansSet),
            effectiveGranularity
        };
    }, [dataWithNet, timeRange, customRange, granularity]);

    // Memoize available dates
    const availableDates = useMemo(() => {
        if (rawData.length === 0) return { start: null, end: null };
        const sortedDates = rawData.map(d => d.date).sort((a, b) => a - b);
        return {
            start: sortedDates[0],
            end: sortedDates[sortedDates.length - 1]
        };
    }, [rawData]);

    // Return null if no data
    if (rawData.length === 0) return null;

    return {
        filtered: dataWithNet,
        ...metrics,
        ...growth,
        ...todayYesterdayData,
        ...chartData,
        availableDates
    };
};

export default useProcessedData;
