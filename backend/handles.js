import wixData from 'wix-data';
import { badRequest, serverError, ok, notFound } from 'wix-http-functions';

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Converts a date to GMT+2 timezone (Africa/Cairo, Africa/Johannesburg, etc.)
 *
 * @param {Date|string} date - The date to convert
 * @returns {string} ISO string representation of the date in GMT+2
 *
 * @example
 * const gmtDate = toGMTPlus2(new Date('2024-01-15T10:00:00Z'));
 * // Returns: "2024-01-15T12:00:00.000Z" (2 hours ahead)
 */
function toGMTPlus2(date) {
    const utcDate = new Date(date);
    const gmtPlus2Offset = 2 * 60; // 2 hours in minutes
    const localOffset = utcDate.getTimezoneOffset(); // Local offset in minutes
    const totalOffset = gmtPlus2Offset + localOffset;
    const gmtPlus2Date = new Date(utcDate.getTime() + totalOffset * 60000);
    return gmtPlus2Date.toISOString();
}

/**
 * ============================================================================
 * HANDLER: GET EXPENSES
 * ============================================================================
 *
 * Fetches expenses from the database with optional filters.
 * Supports pagination with parallel queries for optimal performance.
 *
 * @param {Object} filters - Filter criteria for querying expenses
 * @param {string} [filters.startDate] - Start date in "YYYY-MM-DD" format
 * @param {string} [filters.endDate] - End date in "YYYY-MM-DD" format
 * @param {string} [filters.category] - Category name to filter by
 * @param {string} [filters.currency] - Currency code to filter by (e.g., "RWF", "USD")
 * @param {string} [filters.searchQuery] - Search term to match against description, vendor, or category
 * @param {Object} options - Wix Data query options
 *
 * @returns {Promise<Object>} HTTP response with expenses data
 *
 * @example
 * // Sample Request Body (operation: "get")
 * {
 *   "operation": "get",
 *   "filters": {
 *     "startDate": "2024-01-01",
 *     "endDate": "2024-01-31",
 *     "category": "Office Supplies",
 *     "currency": "RWF",
 *     "searchQuery": "printer"
 *   }
 * }
 *
 * @example
 * // Sample Response
 * {
 *   "success": true,
 *   "results": {
 *     "expenses": [
 *       {
 *         "_id": "abc123",
 *         "amount": 50000,
 *         "currency": "RWF",
 *         "category": "Office Supplies",
 *         "description": "HP Printer Ink Cartridges",
 *         "date": "2024-01-15T10:30:00.000Z",
 *         "vendor": "Office Depot",
 *         "paymentMethod": "Credit Card",
 *         "_createdDate": "2024-01-15T10:30:00.000Z",
 *         "_updatedDate": "2024-01-15T10:30:00.000Z"
 *       }
 *     ],
 *     "totalCount": 1,
 *     "dateRange": {
 *       "start": "2024-01-01",
 *       "end": "2024-01-31"
 *     }
 *   }
 * }
 */
export async function handleGetExpenses(filters, options) {
    try {
        let dbQuery = wixData.query("Expenses");

        // Date range filter
        if (filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);

            dbQuery = dbQuery
                .ge("date", startDate)
                .le("date", endDate);
        }

        // Category filter
        if (filters.category) {
            dbQuery = dbQuery.eq("category", filters.category);
        }

        // Currency filter
        if (filters.currency) {
            dbQuery = dbQuery.eq("currency", filters.currency);
        }

        // Search filter
        if (filters.searchQuery) {
            const searchTerm = filters.searchQuery.trim();
            // Search in description, vendor, or category
            dbQuery = dbQuery.or(wixData.query("Expenses").contains("description", searchTerm))
                .or(wixData.query("Expenses").contains("vendor", searchTerm))
                .or(wixData.query("Expenses").contains("category", searchTerm));
        }

        // Sort by date descending (newest first)
        dbQuery = dbQuery.descending("date");

        // First, get the total count
        const initialResults = await dbQuery.limit(1).find(options);
        const totalCount = initialResults.totalCount;

        // Fetch all pages in parallel using Promise.all
        const pageSize = 1000;
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
        let allExpenses = [];
        allResults.forEach(results => {
            results.items.forEach(item => {
                const convertedDate = toGMTPlus2(item.date);
                allExpenses.push({
                    _id: item._id,
                    amount: item.amount,
                    currency: item.currency,
                    category: item.category,
                    description: item.description || '',
                    date: convertedDate,
                    vendor: item.vendor || '',
                    paymentMethod: item.paymentMethod || '',
                    _createdDate: toGMTPlus2(item._createdDate),
                    _updatedDate: toGMTPlus2(item._updatedDate)
                });
            });
        });

        return ok({
            body: JSON.stringify({
                success: true,
                results: {
                    expenses: allExpenses,
                    totalCount: totalCount,
                    dateRange: {
                        start: filters.startDate || null,
                        end: filters.endDate || null
                    }
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
    }
}

/**
 * ============================================================================
 * HANDLER: CREATE EXPENSE
 * ============================================================================
 *
 * Creates a new expense record in the database.
 * Validates required fields and data types before insertion.
 *
 * @param {Object} data - Expense data to insert
 * @param {number} data.amount - Expense amount (must be a valid number)
 * @param {string} data.currency - Currency code (e.g., "RWF", "USD", "EUR")
 * @param {string} data.category - Expense category
 * @param {string} data.date - Date in ISO format
 * @param {string} [data.description] - Optional description of the expense
 * @param {string} [data.vendor] - Optional vendor/supplier name
 * @param {string} [data.paymentMethod] - Optional payment method (e.g., "Cash", "Credit Card")
 * @param {Object} options - Wix Data query options
 *
 * @returns {Promise<Object>} HTTP response with created expense data
 *
 * @example
 * // Sample Request Body (operation: "create")
 * {
 *   "operation": "create",
 *   "data": {
 *     "amount": 75000,
 *     "currency": "RWF",
 *     "category": "Transportation",
 *     "description": "Monthly fuel expenses",
 *     "date": "2024-01-20T08:00:00.000Z",
 *     "vendor": "Shell Gas Station",
 *     "paymentMethod": "Company Card"
 *   }
 * }
 *
 * @example
 * // Sample Response
 * {
 *   "success": true,
 *   "expense": {
 *     "_id": "xyz789",
 *     "amount": 75000,
 *     "currency": "RWF",
 *     "category": "Transportation",
 *     "description": "Monthly fuel expenses",
 *     "date": "2024-01-20T08:00:00.000Z",
 *     "vendor": "Shell Gas Station",
 *     "paymentMethod": "Company Card",
 *     "_createdDate": "2024-01-20T08:05:00.000Z",
 *     "_updatedDate": "2024-01-20T08:05:00.000Z"
 *   },
 *   "message": "Expense created successfully"
 * }
 *
 * @example
 * // Error Response (Missing Required Fields)
 * {
 *   "success": false,
 *   "error": "Missing required fields: amount, currency, category, and date are required"
 * }
 */
export async function handleCreateExpense(data, options) {
    try {
        // Validate required fields
        if (!data || !data.amount || !data.currency || !data.category || !data.date) {
            return badRequest({
                body: JSON.stringify({
                    success: false,
                    error: "Missing required fields: amount, currency, category, and date are required"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Validate amount is a number
        if (typeof data.amount !== 'number' || isNaN(data.amount)) {
            return badRequest({
                body: JSON.stringify({
                    success: false,
                    error: "Amount must be a valid number"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Prepare expense object
        const expenseToInsert = {
            amount: data.amount,
            currency: data.currency,
            category: data.category,
            description: data.description || '',
            date: new Date(data.date),
            vendor: data.vendor || '',
            paymentMethod: data.paymentMethod || ''
        };

        // Insert into database
        const result = await wixData.insert("Expenses", expenseToInsert, options);

        // Convert dates to GMT+2 for response
        const insertedExpense = {
            ...result,
            date: toGMTPlus2(result.date),
            _createdDate: toGMTPlus2(result._createdDate),
            _updatedDate: toGMTPlus2(result._updatedDate)
        };

        return ok({
            body: JSON.stringify({
                success: true,
                expense: insertedExpense,
                message: "Expense created successfully"
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error creating expense:", error);
        throw error;
    }
}

/**
 * ============================================================================
 * HANDLER: UPDATE EXPENSE
 * ============================================================================
 *
 * Updates an existing expense record in the database.
 * Only updates fields that are provided in the data object.
 *
 * @param {Object} data - Expense data to update
 * @param {string} data._id - ID of the expense to update (required)
 * @param {number} [data.amount] - Updated expense amount
 * @param {string} [data.currency] - Updated currency code
 * @param {string} [data.category] - Updated category
 * @param {string} [data.date] - Updated date in ISO format
 * @param {string} [data.description] - Updated description
 * @param {string} [data.vendor] - Updated vendor name
 * @param {string} [data.paymentMethod] - Updated payment method
 * @param {Object} options - Wix Data query options
 *
 * @returns {Promise<Object>} HTTP response with updated expense data
 *
 * @example
 * // Sample Request Body (operation: "update")
 * {
 *   "operation": "update",
 *   "data": {
 *     "_id": "xyz789",
 *     "amount": 80000,
 *     "description": "Monthly fuel expenses - Updated",
 *     "paymentMethod": "Cash"
 *   }
 * }
 *
 * @example
 * // Sample Response
 * {
 *   "success": true,
 *   "expense": {
 *     "_id": "xyz789",
 *     "amount": 80000,
 *     "currency": "RWF",
 *     "category": "Transportation",
 *     "description": "Monthly fuel expenses - Updated",
 *     "date": "2024-01-20T08:00:00.000Z",
 *     "vendor": "Shell Gas Station",
 *     "paymentMethod": "Cash",
 *     "_createdDate": "2024-01-20T08:05:00.000Z",
 *     "_updatedDate": "2024-01-20T09:15:00.000Z"
 *   },
 *   "message": "Expense updated successfully"
 * }
 *
 * @example
 * // Error Response (Expense Not Found)
 * {
 *   "success": false,
 *   "error": "Expense not found"
 * }
 */
export async function handleUpdateExpense(data, options) {
    try {
        // Validate _id is provided
        if (!data || !data._id) {
            return badRequest({
                body: JSON.stringify({
                    success: false,
                    error: "Expense _id is required for update"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Fetch existing expense
        const existingExpense = await wixData.get("Expenses", data._id, options);

        if (!existingExpense) {
            return notFound({
                body: JSON.stringify({
                    success: false,
                    error: "Expense not found"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Prepare update object (only update provided fields)
        const expenseToUpdate = {
            _id: data._id,
            amount: data.amount !== undefined ? data.amount : existingExpense.amount,
            currency: data.currency !== undefined ? data.currency : existingExpense.currency,
            category: data.category !== undefined ? data.category : existingExpense.category,
            description: data.description !== undefined ? data.description : existingExpense.description,
            date: data.date !== undefined ? new Date(data.date) : existingExpense.date,
            vendor: data.vendor !== undefined ? data.vendor : existingExpense.vendor,
            paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : existingExpense.paymentMethod
        };

        // Validate amount if provided
        if (typeof expenseToUpdate.amount !== 'number' || isNaN(expenseToUpdate.amount)) {
            return badRequest({
                body: JSON.stringify({
                    success: false,
                    error: "Amount must be a valid number"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Update in database
        const result = await wixData.update("Expenses", expenseToUpdate, options);

        // Convert dates to GMT+2 for response
        const updatedExpense = {
            ...result,
            date: toGMTPlus2(result.date),
            _createdDate: toGMTPlus2(result._createdDate),
            _updatedDate: toGMTPlus2(result._updatedDate)
        };

        return ok({
            body: JSON.stringify({
                success: true,
                expense: updatedExpense,
                message: "Expense updated successfully"
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error updating expense:", error);
        throw error;
    }
}

/**
 * ============================================================================
 * HANDLER: DELETE EXPENSE
 * ============================================================================
 *
 * Deletes an expense record from the database.
 * Validates that the expense exists before deletion.
 *
 * @param {string} expenseId - ID of the expense to delete
 * @param {Object} options - Wix Data query options
 *
 * @returns {Promise<Object>} HTTP response confirming deletion
 *
 * @example
 * // Sample Request Body (operation: "delete")
 * {
 *   "operation": "delete",
 *   "expenseId": "xyz789"
 * }
 *
 * @example
 * // Sample Response
 * {
 *   "success": true,
 *   "message": "Expense deleted successfully",
 *   "deletedId": "xyz789"
 * }
 *
 * @example
 * // Error Response (Expense Not Found)
 * {
 *   "success": false,
 *   "error": "Expense not found"
 * }
 */
export async function handleDeleteExpense(expenseId, options) {
    try {
        if (!expenseId) {
            return badRequest({
                body: JSON.stringify({
                    success: false,
                    error: "Expense id is required"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Check if expense exists
        const existingExpense = await wixData.get("Expenses", expenseId, options);

        if (!existingExpense) {
            return notFound({
                body: JSON.stringify({
                    success: false,
                    error: "Expense not found"
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // Delete the expense
        await wixData.remove("Expenses", expenseId, options);

        return ok({
            body: JSON.stringify({
                success: true,
                message: "Expense deleted successfully",
                deletedId: expenseId
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error deleting expense:", error);
        throw error;
    }
}

/**
 * ============================================================================
 * HANDLER: GET CATEGORIES
 * ============================================================================
 *
 * Retrieves a unique, sorted list of all expense categories in the database.
 * Useful for populating dropdown menus and filters.
 *
 * @param {Object} options - Wix Data query options
 *
 * @returns {Promise<Object>} HTTP response with array of unique categories
 *
 * @example
 * // Sample Request Body (operation: "getCategories")
 * {
 *   "operation": "getCategories"
 * }
 *
 * @example
 * // Sample Response
 * {
 *   "success": true,
 *   "categories": [
 *     "Food & Dining",
 *     "Office Supplies",
 *     "Software & Subscriptions",
 *     "Transportation",
 *     "Utilities"
 *   ]
 * }
 */
export async function handleGetCategories(options) {
    try {
        // Fetch all expenses to extract unique categories
        const results = await wixData.query("Expenses")
            .limit(1000)
            .find(options);

        const categoriesSet = new Set();
        results.items.forEach(item => {
            if (item.category) {
                categoriesSet.add(item.category);
            }
        });

        const categories = Array.from(categoriesSet).sort();

        return ok({
            body: JSON.stringify({
                success: true,
                categories: categories
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
}

/**
 * ============================================================================
 * HANDLER: GET SUMMARY
 * ============================================================================
 *
 * Generates summary statistics for expenses within a date range.
 * Calculates totals and breakdowns by category and currency.
 *
 * @param {Object} filters - Filter criteria for summary
 * @param {string} [filters.startDate] - Start date in "YYYY-MM-DD" format
 * @param {string} [filters.endDate] - End date in "YYYY-MM-DD" format
 * @param {Object} options - Wix Data query options
 *
 * @returns {Promise<Object>} HTTP response with summary statistics
 *
 * @example
 * // Sample Request Body (operation: "getSummary")
 * {
 *   "operation": "getSummary",
 *   "filters": {
 *     "startDate": "2024-01-01",
 *     "endDate": "2024-01-31"
 *   }
 * }
 *
 * @example
 * // Sample Response
 * {
 *   "success": true,
 *   "summary": {
 *     "totalExpenses": 450000,
 *     "totalCount": 15,
 *     "byCategory": {
 *       "Transportation": {
 *         "total": 150000,
 *         "count": 5
 *       },
 *       "Office Supplies": {
 *         "total": 200000,
 *         "count": 7
 *       },
 *       "Utilities": {
 *         "total": 100000,
 *         "count": 3
 *       }
 *     },
 *     "byCurrency": {
 *       "RWF": {
 *         "total": 400000,
 *         "count": 13
 *       },
 *       "USD": {
 *         "total": 50000,
 *         "count": 2
 *       }
 *     }
 *   }
 * }
 */
export async function handleGetSummary(filters, options) {
    try {
        let dbQuery = wixData.query("Expenses");

        // Date range filter
        if (filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);

            dbQuery = dbQuery
                .ge("date", startDate)
                .le("date", endDate);
        }

        // Fetch all expenses
        const results = await dbQuery.limit(1000).find(options);

        let summary = {
            totalExpenses: 0,
            totalCount: results.totalCount,
            byCategory: {},
            byCurrency: {}
        };

        // Calculate summaries
        results.items.forEach(item => {
            // Total
            summary.totalExpenses += item.amount;

            // By category
            if (!summary.byCategory[item.category]) {
                summary.byCategory[item.category] = {
                    total: 0,
                    count: 0
                };
            }
            summary.byCategory[item.category].total += item.amount;
            summary.byCategory[item.category].count += 1;

            // By currency
            if (!summary.byCurrency[item.currency]) {
                summary.byCurrency[item.currency] = {
                    total: 0,
                    count: 0
                };
            }
            summary.byCurrency[item.currency].total += item.amount;
            summary.byCurrency[item.currency].count += 1;
        });

        return ok({
            body: JSON.stringify({
                success: true,
                summary: summary
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

    } catch (error) {
        console.error("Error fetching expense summary:", error);
        throw error;
    }
}
