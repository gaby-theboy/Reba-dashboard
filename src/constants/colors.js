// Distinct colors for different currencies - Dark theme optimized
export const CURRENCY_COLORS = {
    RWF: '#60a5faff', // Blue-400
    USD: '#34d399', // Emerald-400
    EUR: '#a78bfa', // Violet-400
    UGX: '#fbbf24', // Amber-400
    KES: '#f87171', // Red-400
    TZS: '#f472b6', // Pink-400
    BIF: '#22d3ee', // Cyan-400
    CDF: '#818cf8', // Indigo-400
    ZMW: '#a3e635', // Lime-400
    KSH: '#fb923c', // Orange-400
    DEFAULT: '#94a3b8' // Slate-400
};

export const getCurrencyColor = (curr) => CURRENCY_COLORS[curr] || CURRENCY_COLORS.DEFAULT;

// Distinct colors for different plans - Dark theme optimized
export const PLAN_COLORS = [
    '#60a5faff', // Blue-400
    '#34d399', // Emerald-400
    '#fbbf24', // Amber-400
    '#f87171', // Red-400
    '#a78bfa', // Violet-400
    '#f472b6', // Pink-400
    '#22d3ee', // Cyan-400
    '#818cf8', // Indigo-400
    '#a3e635', // Lime-400
    '#fb923c', // Orange-400
    '#c084fc', // Fuchsia-400
    '#67e8f9', // Sky-400
    '#a3bffa', // Cornflower-400
    '#fde68a', // Yellow-200
    '#fecaca', // Red-200
    '#d1d5db', // Gray-300
];

export const getPlanColor = (index) => PLAN_COLORS[index % PLAN_COLORS.length];
