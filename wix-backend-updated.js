// OPTIMIZED WIX BACKEND CODE - PROPER WIX DATA QUERIES
// Server handles: date range filtering, pagination, search/filter queries using Wix Data API
// Client handles: granularity, currency visibility, plan visibility
//
// Copy this to your Wix backend to replace post_paymentAnalytics
// Using Wix Data Query API: https://dev.wix.com/docs/velo/api-reference/wix-data/query

import wixData from 'wix-data';
import { ok, serverError } from 'wix-http-functions';

export async function post_paymentAnalytics(request) {
    const OFFSET_HOURS = 2;
    const OFFSET_MS = OFFSET_HOURS * 60 * 60 * 1000;

    // Get first day of a month
    function getFirstDayOfMonth(year, month) {
        return `${year}-${String(month + 1).padStart(2, '0')}-01`;
    }

    // Get last day of a month
    function getLastDayOfMonth(year, month) {
        const lastDay = new Date(year, month + 1, 0).getDate();
        return `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
    }

    // Calculate full months range including previous month for comparison
    function getFullMonthsRange(startDateStr, endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Get the month boundaries
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();

        // Go back one month from the start for comparison data
        let prevMonth = startMonth - 1;
        let prevYear = startYear;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear = startYear - 1;
        }

        // Start from the 1st of the previous month
        const rangeStart = getFirstDayOfMonth(prevYear, prevMonth);
        // End at the last day of the end month
        const rangeEnd = getLastDayOfMonth(endYear, endMonth);

        return { rangeStart, rangeEnd };
    }

    // Convert date string to UTC range for GMT+2 day boundaries
    function getDayRangeAtGMTPlus2(dateString, endDateString) {
        const gmtPlus2Start = new Date(`${dateString}T00:00:00.000Z`);
        if (isNaN(gmtPlus2Start.getTime())) {
            throw new Error(`Invalid start date: ${dateString}`);
        }

        const startUTC = new Date(gmtPlus2Start.getTime() - OFFSET_MS);

        const gmtPlus2End = new Date(`${endDateString}T00:00:00.000Z`);
        if (isNaN(gmtPlus2End.getTime())) {
            throw new Error(`Invalid end date: ${endDateString}`);
        }
        const endUTC = new Date(gmtPlus2End.getTime() - OFFSET_MS + 86400000 - 1);

        return { startDate: startUTC.toISOString(), endDate: endUTC.toISOString() };
    }

    // Convert UTC to GMT+2
    function toGMTPlus2(utcDateString) {
        const utcDate = new Date(utcDateString);
        if (isNaN(utcDate.getTime())) return utcDateString;
        return new Date(utcDate.getTime() + OFFSET_MS).toISOString();
    }

    try {
        // Parse request body
        let query = {};
        try {
            query = await request.body.json();
        } catch {
            query = {};
        }

        const {
            startDate,
            endDate,
            searchQuery,      // Search term
            searchField,      // Which field to search: 'email', 'telefone', 'transaction_ref'
            statusFilter,     // 'success', 'failed', or null/undefined for all
            currencyFilter,   // e.g., 'USD', 'EUR', or null/undefined for all
            planFilter        // e.g., 'Premium', or null/undefined for all
        } = query;

        // Use the exact date range provided by the client
        // The client (frontend) is responsible for determining what comparison data it needs
        let actualStartDate, actualEndDate;

        if (startDate && endDate) {
            // Use the exact dates provided by the client
            actualStartDate = startDate;
            actualEndDate = endDate;
        } else {
            // Default: last 30 days if no dates provided
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);

            actualStartDate = thirtyDaysAgo.toISOString().split('T')[0];
            actualEndDate = now.toISOString().split('T')[0];
        }

        // Convert to UTC for database query
        const dateRange = getDayRangeAtGMTPlus2(actualStartDate, actualEndDate);

        const options = { suppressAuth: true, suppressHooks: true };

        // Check if any filters are applied
        const hasFilters = searchQuery || statusFilter || currencyFilter || planFilter;

        // Build optimized query using Wix Data Query API
        let dbQuery = wixData
            .query("paymentConfirmation")
            .ascending("_createdDate");

        // Only apply date range if NO filters are active
        // When filtering, search across all data without date restrictions
        if (!hasFilters) {
            dbQuery = dbQuery.between("_createdDate", new Date(dateRange.startDate), new Date(dateRange.endDate));
        }

        // Apply status filter if provided
        // Using .eq() for exact match
        if (statusFilter && (statusFilter === 'success' || statusFilter === 'failed')) {
            dbQuery = dbQuery.eq("status", statusFilter);
        }

        // Apply currency filter if provided
        // Using .eq() for exact match
        if (currencyFilter) {
            dbQuery = dbQuery.eq("currency", currencyFilter);
        }

        // Apply plan filter if provided
        // Using .eq() for exact match
        if (planFilter) {
            dbQuery = dbQuery.eq("planName", planFilter);
        }

        // Apply search query if provided
        // Using .contains() for partial string matching
        // Note: searchField specifies which field to search
        if (searchQuery && searchQuery.trim()) {
            const searchTerm = searchQuery.trim();

            // Use the specific field provided by searchField parameter
            if (searchField === 'email') {
                dbQuery = dbQuery.contains("email", searchTerm);
            } else if (searchField === 'telefone') {
                dbQuery = dbQuery.contains("telefone", searchTerm);
            } else if (searchField === 'transaction_ref') {
                dbQuery = dbQuery.contains("transaction_ref", searchTerm);
            } else {
                // Default to email if searchField is not specified
                dbQuery = dbQuery.contains("email", searchTerm);
            }
        }

        // First, get the total count to determine how many parallel queries we need
        const initialResults = await dbQuery.limit(1).find(options);
        const totalCount = initialResults.totalCount;

        // Fetch all pages in parallel using Promise.all
        const pageSize = 1000; // Wix Data max limit per query
        const maxRecords = 50000;
        const recordsToFetch = Math.min(totalCount, maxRecords);
        const numPages = Math.ceil(recordsToFetch / pageSize);

        // Create array of promises for all pages
        const pagePromises = [];
        for (let i = 0; i < numPages; i++) {
            const skip = i * pageSize;
            pagePromises.push(
                dbQuery.skip(skip).limit(pageSize).find(options)
            );
        }

        // Fetch all pages simultaneously
        const allResults = await Promise.all(pagePromises);

        // Transform and combine all items
        let allItems = [];
        allResults.forEach(results => {
            results.items.forEach(item => {
                const convertedDate = toGMTPlus2(item._createdDate);
                allItems.push({
                    _id: item._id,
                    _createdDate: convertedDate,
                    email: item.email,
                    planName: item.planName,
                    amount: item.amount,
                    status: item.status,
                    currency: item.currency,
                    country: item.country,
                    payment_method: item.payment_method,
                    period: item.period,
                    telefone: item.telefone,
                    transaction_ref: item.transaction_ref
                });
            });
        });

        // Group by date for efficient client-side processing
        const groupedItems = {};
        allItems.forEach(item => {
            const dateKey = item._createdDate.split('T')[0];
            if (!groupedItems[dateKey]) groupedItems[dateKey] = [];
            groupedItems[dateKey].push(item);
        });

        return ok({
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, wix-site-id",
                "Cache-Control": "private, max-age=60" // Cache for 1 minute
            },
            body: {
                results: {
                    items: groupedItems,
                    totalCount: allItems.length,
                    // Actual fetched range (full months + previous month for comparison)
                    dateRange: {
                        start: fullMonthsRange.rangeStart,
                        end: fullMonthsRange.rangeEnd
                    },
                    // Original requested range (for reference)
                    requestedRange: startDate && endDate ? { start: startDate, end: endDate } : null,
                    // Applied filters (for debugging/verification)
                    appliedFilters: {
                        searchQuery: searchQuery || null,
                        searchField: searchField || null,
                        statusFilter: statusFilter || null,
                        currencyFilter: currencyFilter || null,
                        planFilter: planFilter || null
                    }
                }
            }
        });

    } catch (error) {
        return serverError({
            body: { error: 'Internal server error', message: error.message }
        });
    }
}