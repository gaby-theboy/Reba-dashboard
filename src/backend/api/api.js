// src/backend/api/api.js

const BASE_API_URL = 'https://api.rebamovie.com';

/**
 * Fetches payment analytics data from the API.
 * @param {Object} params - Optional filter parameters
 * @param {string} params.startDate - Start date in YYYY-MM-DD format
 * @param {string} params.endDate - End date in YYYY-MM-DD format
 * @param {string} params.status - Filter by status (e.g., 'success', 'failed')
 * @param {string} params.currency - Filter by currency (e.g., 'RWF', 'USD')
 * @returns {Promise<Object>} A promise resolving to the parsed JSON response from the API.
 * @throws {Error} Throws an error if the API request fails.
 */
export const fetchPaymentData = async (params = {}) => {
  const url = `${BASE_API_URL}/paymentAnalytics`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorMessage = `API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching data from API:', error);
    throw error;
  }
};

/**
 * Fetches wallet balances from the API.
 * @returns {Promise<Object>} A promise resolving to the wallet balances response.
 * @throws {Error} Throws an error if the API request fails.
 */
export const fetchWalletBalances = async () => {
  const url = `${BASE_API_URL}/walletBalances`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorMessage = `API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching wallet balances from API:', error);
    throw error;
  }
};

/**
 * Fetches live exchange rates from exchangerate-api.com (free tier)
 * @returns {Promise<Object>} A promise resolving to exchange rates with USD as base
 * @throws {Error} Throws an error if the API request fails.
 */
export const fetchExchangeRates = async () => {
  const url = 'https://api.exchangerate-api.com/v4/latest/USD';

  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorMessage = `Exchange Rate API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching exchange rates from API:', error);
    throw error;
  }
};

/**
 * ============================================================================
 * EXPENSES API
 * ============================================================================
 */

/**
 * Fetches expenses from the API with optional filters.
 *
 * @param {Object} filters - Filter criteria for querying expenses
 * @param {string} [filters.startDate] - Start date in "YYYY-MM-DD" format
 * @param {string} [filters.endDate] - End date in "YYYY-MM-DD" format
 * @param {string} [filters.category] - Category name to filter by
 * @param {string} [filters.currency] - Currency code to filter by (e.g., "RWF", "USD")
 * @param {string} [filters.searchQuery] - Search term to match against description, vendor, or category
 * @returns {Promise<Object>} A promise resolving to the expenses response
 * @throws {Error} Throws an error if the API request fails
 *
 * @example
 * const expenses = await fetchExpenses({
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31",
 *   category: "Office Supplies",
 *   currency: "RWF"
 * });
 */
export const fetchExpenses = async (filters = {}) => {
  const url = `${BASE_API_URL}/expenses`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'get',
        filters: filters
      })
    });

    if (!response.ok) {
      const errorMessage = `Expenses API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching expenses from API:', error);
    throw error;
  }
};

/**
 * Creates a new expense record.
 *
 * @param {Object} expenseData - Expense data to create
 * @param {number} expenseData.amount - Expense amount (must be a valid number)
 * @param {string} expenseData.currency - Currency code (e.g., "RWF", "USD", "EUR")
 * @param {string} expenseData.category - Expense category
 * @param {string} expenseData.date - Date in ISO format
 * @param {string} [expenseData.description] - Optional description of the expense
 * @param {string} [expenseData.vendor] - Optional vendor/supplier name
 * @param {string} [expenseData.paymentMethod] - Optional payment method (e.g., "Cash", "Credit Card")
 * @returns {Promise<Object>} A promise resolving to the created expense response
 * @throws {Error} Throws an error if the API request fails
 *
 * @example
 * const newExpense = await createExpense({
 *   amount: 75000,
 *   currency: "RWF",
 *   category: "Transportation",
 *   description: "Monthly fuel expenses",
 *   date: new Date().toISOString(),
 *   vendor: "Shell Gas Station",
 *   paymentMethod: "Company Card"
 * });
 */
export const createExpense = async (expenseData) => {
  const url = `${BASE_API_URL}/expenses`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'create',
        data: expenseData
      })
    });

    if (!response.ok) {
      const errorMessage = `Create Expense API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

/**
 * Updates an existing expense record.
 *
 * @param {Object} expenseData - Expense data to update (must include _id)
 * @param {string} expenseData._id - ID of the expense to update (required)
 * @param {number} [expenseData.amount] - Updated expense amount
 * @param {string} [expenseData.currency] - Updated currency code
 * @param {string} [expenseData.category] - Updated category
 * @param {string} [expenseData.date] - Updated date in ISO format
 * @param {string} [expenseData.description] - Updated description
 * @param {string} [expenseData.vendor] - Updated vendor name
 * @param {string} [expenseData.paymentMethod] - Updated payment method
 * @returns {Promise<Object>} A promise resolving to the updated expense response
 * @throws {Error} Throws an error if the API request fails
 *
 * @example
 * const updatedExpense = await updateExpense({
 *   _id: "xyz789",
 *   amount: 80000,
 *   description: "Monthly fuel expenses - Updated"
 * });
 */
export const updateExpense = async (expenseData) => {
  const url = `${BASE_API_URL}/expenses`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'update',
        data: expenseData
      })
    });

    if (!response.ok) {
      const errorMessage = `Update Expense API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

/**
 * Deletes an expense record.
 *
 * @param {string} expenseId - ID of the expense to delete
 * @returns {Promise<Object>} A promise resolving to the deletion confirmation response
 * @throws {Error} Throws an error if the API request fails
 *
 * @example
 * const result = await deleteExpense("xyz789");
 */
export const deleteExpense = async (expenseId) => {
  const url = `${BASE_API_URL}/expenses`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'delete',
        expenseId: expenseId
      })
    });

    if (!response.ok) {
      const errorMessage = `Delete Expense API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

/**
 * Fetches all unique expense categories.
 *
 * @returns {Promise<Object>} A promise resolving to the categories response
 * @throws {Error} Throws an error if the API request fails
 *
 * @example
 * const categoriesData = await fetchExpenseCategories();
 * // Returns: { success: true, categories: ["Food", "Transport", ...] }
 */
export const fetchExpenseCategories = async () => {
  const url = `${BASE_API_URL}/expenses`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'getCategories'
      })
    });

    if (!response.ok) {
      const errorMessage = `Expense Categories API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching expense categories:', error);
    throw error;
  }
};

/**
 * Fetches expense summary statistics.
 *
 * @param {Object} filters - Filter criteria for summary
 * @param {string} [filters.startDate] - Start date in "YYYY-MM-DD" format
 * @param {string} [filters.endDate] - End date in "YYYY-MM-DD" format
 * @returns {Promise<Object>} A promise resolving to the summary response
 * @throws {Error} Throws an error if the API request fails
 *
 * @example
 * const summary = await fetchExpenseSummary({
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31"
 * });
 */
/**
 * Fetches contacts from the API with optional search.
 *
 * @param {Object} params - Query parameters
 * @param {string} [params.search] - Search term to filter contacts
 * @param {number} [params.page] - Page number (0-based)
 * @returns {Promise<Object>} A promise resolving to the contacts response
 * @throws {Error} Throws an error if the API request fails
 */
export const fetchContactDetails = async (memberId, email) => {
  const url = `${BASE_API_URL}/moreDetailsContacts`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId, email })
    });

    if (!response.ok) {
      const errorMessage = `Contact Details API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching contact details from API:', error);
    throw error;
  }
};

export const fetchContacts = async (params = {}) => {
  const url = `${BASE_API_URL}/dashboardContacts`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search: params.search || '',
        ...(params.page !== undefined && { page: params.page }),
      })
    });

    if (!response.ok) {
      const errorMessage = `Contacts API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching contacts from API:', error);
    throw error;
  }
};

export const fetchExpenseSummary = async (filters = {}) => {
  const url = `${BASE_API_URL}/expenses`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'getSummary',
        filters: filters
      })
    });

    if (!response.ok) {
      const errorMessage = `Expense Summary API Request Failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching expense summary:', error);
    throw error;
  }
};