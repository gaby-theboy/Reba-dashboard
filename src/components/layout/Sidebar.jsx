import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    TrendingUp, Settings, RefreshCcw, Menu, X,
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

const NavItem = React.memo(({ icon: Icon, label, to, disabled, onNavigate }) => {
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
                onClick={onNavigate}
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleOpenRateModal = useCallback(() => {
        setShowRateModal(true);
    }, [setShowRateModal]);

    const handleReloadData = useCallback(() => {
        setRawData([]);
    }, [setRawData]);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const renderNavContent = () => (
        <>
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

            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item, index) => {
                        if (item.type === 'divider') {
                            return (
                                <li key={`divider-${index}`} className="my-3">
                                    <div className="border-t border-slate-700/50"></div>
                                </li>
                            );
                        }
                        return <NavItem key={item.label} {...item} onNavigate={closeMobileMenu} />;
                    })}
                </ul>
            </nav>

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
        </>
    );

    return (
        <>
            <button
                type="button"
                aria-label="Toggle navigation menu"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                className="md:hidden fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/90 text-slate-200 shadow-lg backdrop-blur hover:bg-slate-700/90 transition-all"
            >
                <span className="flex flex-col items-center justify-center gap-[2px]">
                    <span className="block h-[2px] w-4 bg-current rounded-full" />
                    <span className="block h-[2px] w-4 bg-current rounded-full" />
                    <span className="block h-[2px] w-4 bg-current rounded-full" />
                </span>
            </button>

            <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div
                    className={`absolute inset-0 bg-slate-950/70 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeMobileMenu}
                />
                <div className={`absolute left-0 top-0 h-full w-72 bg-slate-800/95 border-r border-slate-700/50 shadow-xl flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {renderNavContent()}
                </div>
            </div>

            <div className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 bg-slate-800/95 border-r border-slate-700/50 shadow-xl flex-col">
                {renderNavContent()}
            </div>
        </>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
