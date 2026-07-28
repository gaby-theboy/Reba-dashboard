import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const Card = React.memo(({ children, className = "" }) => (
    <div className={`bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 ${className}`}>
        {children}
    </div>
));

Card.displayName = 'Card';

export const StatCard = React.memo(({ title, value, subtext, icon: Icon, color, trend }) => (
    <Card>
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
                {trend !== null && trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold mt-3 px-2 py-1 rounded-md w-fit ${trend > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend).toFixed(1)}% vs prev period
                    </div>
                )}
            </div>
            {Icon && (
                <div className={`p-3 rounded-xl ${color} shadow-lg`}>
                    <Icon size={22} className="text-white" />
                </div>
            )}
        </div>
    </Card>
));

StatCard.displayName = 'StatCard';

export const ShimmerCard = React.memo(() => (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/4"></div>
            </div>
            <div className="p-3 rounded-xl bg-slate-700">
                <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
            </div>
        </div>
    </div>
));

ShimmerCard.displayName = 'ShimmerCard';

// Shimmer for stat items within StatsGroup
export const ShimmerStatItem = React.memo(({ isLast = false }) => (
    <div className={`flex-1 p-6 animate-pulse ${!isLast ? 'border-r border-slate-700/50' : ''}`}>
        <div className="h-4 bg-slate-700/50 rounded w-24 mb-3"></div>
        <div className="h-8 bg-slate-700/50 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-700/50 rounded w-20 mt-2"></div>
        <div className="h-5 bg-slate-700/50 rounded w-28 mt-3"></div>
    </div>
));

ShimmerStatItem.displayName = 'ShimmerStatItem';

// Shimmer for charts
export const ShimmerChart = React.memo(({ title = "Loading...", subtitle = "" }) => (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 min-h-[400px] animate-pulse">
        <div className="flex items-center justify-between mb-6">
            <div>
                <div className="h-5 bg-slate-700/50 rounded w-40 mb-2"></div>
                <div className="h-4 bg-slate-700/50 rounded w-56"></div>
            </div>
            <div className="p-2 bg-slate-700/30 rounded-lg">
                <div className="w-5 h-5 bg-slate-600/50 rounded"></div>
            </div>
        </div>
        <div className="h-[300px] w-full flex items-end justify-around gap-2 px-4">
            {/* Simulated bar chart shimmer */}
            {[65, 45, 80, 55, 90, 40, 70, 85, 50, 75, 60, 95].map((height, i) => (
                <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-slate-700/40 to-slate-700/10 rounded-t"
                    style={{ height: `${height}%` }}
                ></div>
            ))}
        </div>
    </div>
));

ShimmerChart.displayName = 'ShimmerChart';

// Shimmer for transactions table
export const ShimmerTransactions = React.memo(() => (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-700/50 rounded"></div>
                <div className="h-5 bg-slate-700/50 rounded w-40"></div>
            </div>
            <div className="h-4 bg-slate-700/50 rounded w-12"></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="py-3 text-left"><div className="h-3 bg-slate-700/50 rounded w-12"></div></th>
                        <th className="py-3 text-left"><div className="h-3 bg-slate-700/50 rounded w-10"></div></th>
                        <th className="py-3 text-left"><div className="h-3 bg-slate-700/50 rounded w-16"></div></th>
                        <th className="py-3 text-right"><div className="h-3 bg-slate-700/50 rounded w-16 ml-auto"></div></th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(10)].map((_, i) => (
                        <tr key={i} className="border-b border-slate-700/50">
                            <td className="py-4"><div className="h-4 bg-slate-700/50 rounded w-24"></div></td>
                            <td className="py-4"><div className="h-6 bg-slate-700/50 rounded w-20"></div></td>
                            <td className="py-4"><div className="h-4 bg-slate-700/50 rounded w-28"></div></td>
                            <td className="py-4 text-right"><div className="h-5 bg-slate-700/50 rounded w-24 ml-auto"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
));

ShimmerTransactions.displayName = 'ShimmerTransactions';
