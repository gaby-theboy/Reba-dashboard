/**
 * Format currency values with optional compact notation
 * @param {number} value - The value to format
 * @param {boolean} compact - Whether to use compact notation (K, M)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, compact = false) => {
    if (value === null || value === undefined) return '0';

    if (compact) {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    }
    return Math.round(value).toLocaleString();
};

/**
 * Format revenue total for chart labels
 * @param {number} value - The value to format
 * @returns {string} Formatted string or empty if zero
 */
export const formatRevenueTotal = (value) => {
    if (value === 0) return '';
    return formatCurrency(value);
};

/**
 * Format count total for chart labels
 * @param {number} value - The value to format
 * @returns {string} Formatted string or empty if zero
 */
export const formatCountTotal = (value) => {
    if (value === 0) return '';
    return value.toLocaleString();
};
