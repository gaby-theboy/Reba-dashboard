import React, { useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    TrendingUp, Settings, RefreshCcw,
    Home, BarChart3, Activity, CreditCard, FileText, Users, Receipt
} from 'lucide-react';

const NAV_ITEMS = [
    { icon: Home, label: 'Dashboard', to: '/' },
    { icon: BarChart3, label: 'Reports', to: '/reports' },
    { icon: Activity, label: 'Transactions', to: '/transactions' },
    { icon: Receipt, label: 'Expenses', to: '/expenses' },
    { icon: CreditCard, label: 'Plans', to: '/plans', disabled: true },
    { icon: FileText, label: 'Logs', to: '/logs', disabled: true },
    { type: 'divider' },
    { icon: Users, label: 'Contacts', to: '/contacts' },
];

const NavItem = React.memo(({ icon: Icon, label, to, disabled }) => {
    if (disabled) {
        return (
            <li>
                <span className="flex items-center gap-3 px-4 py-3 text-slate-500 cursor-not-allowed rounded-xl">
                    <Icon size={18} />
                    <span>{label}</span>
                    <span className="ml-auto text-xs bg-slate-700/50 px-2 py-0.5 rounded">Soon</span>
                </span>
            </li>
        );
    }

    return (
        <li>
            <NavLink
                to={to}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                        isActive
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                            : 'text-slate-300 hover:bg-slate-700/50 border-transparent hover:border-slate-600'
                    }`
                }
            >
                <Icon size={18} />
                <span>{label}</span>
            </NavLink>
        </li>
    );
});

NavItem.displayName = 'NavItem';

const Sidebar = React.memo(({ fileName, setShowRateModal, setRawData, isLoading }) => {
    const handleOpenRateModal = useCallback(() => {
        setShowRateModal(true);
    }, [setShowRateModal]);

    const handleReloadData = useCallback(() => {
        setRawData([]);
    }, [setRawData]);

    return (
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-800/95 border-r border-slate-700/50 shadow-xl flex flex-col">
            {/* Logo & Title */}
            <div className="p-5 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                        <TrendingUp className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Revenue Analytics</h1>
                        <p className="text-xs text-slate-400">Real-time insights</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item, index) => {
                        if (item.type === 'divider') {
                            return (
                                <li key={`divider-${index}`} className="my-3">
                                    <div className="border-t border-slate-700/50"></div>
                                </li>
                            );
                        }
                        return <NavItem key={item.label} {...item} />;
                    })}
                </ul>
            </nav>

            {/* File Info and Actions */}
            <div className="p-4 border-t border-slate-700/50">
                {isLoading ? (
                    <div className="text-sm text-slate-400 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 mb-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="font-medium text-slate-300">Loading data...</span>
                    </div>
                ) : fileName && (
                    <div className="text-sm text-slate-400 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 mb-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="font-medium text-slate-300 truncate">{fileName}</span>
                    </div>
                )}
                <button
                    onClick={handleOpenRateModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600/50 hover:border-slate-500 mb-2"
                >
                    <Settings size={16} /> Rates
                </button>
                <button
                    onClick={handleReloadData}
                    className="w-full text-sm text-rose-300 hover:text-rose-200 font-medium flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 rounded-xl transition-all border border-rose-500/20"
                >
                    <RefreshCcw size={16} /> Reload Data
                </button>
            </div>
        </div>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
