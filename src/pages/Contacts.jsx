import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { fetchContacts, fetchContactDetails } from '../backend/api/api';

// Copy button with temporary "copied" state
const CopyButton = ({ value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="ml-1 p-1 rounded hover:bg-slate-700/70 transition-colors flex-shrink-0"
            title="Copy"
        >
            {copied
                ? <Check size={13} className="text-emerald-400" />
                : <Copy size={13} className="text-slate-500 hover:text-slate-300" />
            }
        </button>
    );
};

// Contact Details Side Panel — fetches /moreDetailsContacts on open
const ContactDetailsPanel = ({ contact, onClose }) => {
    const [details, setDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [txExpanded, setTxExpanded] = useState(true);
    const [subExpanded, setSubExpanded] = useState(true);
    const [acctExpanded, setAcctExpanded] = useState(true);

    const loadDetails = useCallback(() => {
        if (!contact) return;
        setDetailsError(null);
        setIsLoadingDetails(true);

        fetchContactDetails(contact._id, contact.loginEmail)
            .then(data => setDetails(data))
            .catch(err => setDetailsError(err.message))
            .finally(() => setIsLoadingDetails(false));
    }, [contact]);

    useEffect(() => {
        if (!contact) return;
        setDetails(null);
        setDetailsError(null);
        setActiveTab('info');
        setTxExpanded(true);
        setSubExpanded(true);
        setAcctExpanded(true);
        loadDetails();
    }, [contact]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!contact) return null;

    const statusColor = contact.status === 'ACTIVE'
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30';

    const subStatusColor = (status) => {
        if (status === 'ACTIVE') return 'bg-emerald-500/20 text-emerald-400';
        if (status === 'CANCELED') return 'bg-rose-500/20 text-rose-400';
        return 'bg-slate-500/20 text-slate-400';
    };

    const txStatusColor = (status) => {
        if (status === 'success') return 'bg-emerald-500/20 text-emerald-400';
        if (status === 'failed') return 'bg-rose-500/20 text-rose-400';
        return 'bg-slate-500/20 text-slate-400';
    };

    const transactions = details?.transactions || [];
    const subscriptions = details?.contactSubscriptions || [];
    const more = details?.moreContactDetails;

    const PREVIEW_LIMIT = 5;
    const txPreview = transactions.slice(0, PREVIEW_LIMIT);
    const subPreview = subscriptions.slice(0, PREVIEW_LIMIT);

    const tabs = [
        { key: 'info', label: 'Info' },
        { key: 'transactions', label: `Transactions${transactions.length ? ` (${transactions.length})` : ''}` },
        { key: 'subscriptions', label: `Subscriptions${subscriptions.length ? ` (${subscriptions.length})` : ''}` },
    ];

    // Divider-list item for transactions (used in both preview and full-list tab)
    const TxItem = ({ tx, showDivider }) => (
        <div className={`py-3 ${showDivider ? 'border-b border-slate-700/40' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{tx.planName || '—'}</p>
                    {tx.period && <p className="text-slate-500 text-xs mt-0.5">{tx.period}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                        {Number(tx.amount).toLocaleString()}
                        <span className="text-slate-500 font-normal text-xs ml-1">{tx.currency}</span>
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${txStatusColor(tx.status)}`}>{tx.status}</span>
                </div>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                {tx.payment_method && (
                    <span className="text-xs text-slate-400">
                        <span className="text-slate-500">Via </span>{tx.payment_method}
                    </span>
                )}
                {tx.transaction_ref && (
                    <span className="text-xs text-slate-500 font-mono truncate max-w-[140px]" title={tx.transaction_ref}>
                        #{tx.transaction_ref}
                    </span>
                )}
                <span className="text-xs text-slate-500">
                    {new Date(tx._createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>
        </div>
    );

    // Divider-list item for subscriptions (used in both preview and full-list tab)
    const SubItem = ({ sub, showDivider }) => (
        <div className={`py-3 ${showDivider ? 'border-b border-slate-700/40' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-white text-sm font-medium truncate flex-1">{sub.planName || '—'}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${subStatusColor(sub.status)}`}>{sub.status}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                {sub.startDate && (
                    <span className="text-xs text-slate-400">
                        <span className="text-slate-500">From </span>
                        {new Date(sub.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                )}
                {sub.endDate && (
                    <span className="text-xs text-slate-400">
                        <span className="text-slate-500">Until </span>
                        {new Date(sub.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-gradient-to-br from-slate-800/98 to-slate-900/98 border-l border-slate-700/50 shadow-2xl z-[150] flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800/95 border-b border-slate-700/50 p-6 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-bold text-white">Contact Details</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Avatar & Name */}
            <div className="px-6 pt-5 pb-4 flex items-center gap-4 flex-shrink-0">
                {contact.picture ? (
                    <img src={contact.picture} alt={contact.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-600" />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center border-2 border-slate-600 flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                            {(contact.firstName?.[0] || contact.name?.[0] || '?').toUpperCase()}
                        </span>
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-white font-bold text-base truncate">
                        {contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown'}
                    </p>
                    {contact.nickname && <p className="text-slate-400 text-sm">@{contact.nickname}</p>}
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded mt-1 ${statusColor}`}>
                        {contact.status || 'UNKNOWN'}
                    </span>
                </div>
            </div>

            {/* Tabs — only visible when not on info tab (full list views) */}
            <div className="flex border-b border-slate-700/50 px-6 flex-shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 pt-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoadingDetails && (
                    <div className="p-6 space-y-5 animate-pulse">
                        {/* Contact info shimmer */}
                        <div className="space-y-3">
                            <div className="h-3 w-32 bg-slate-700/70 rounded"></div>
                            <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-3/4 bg-slate-700/50 rounded"></div>
                        </div>
                        {/* Account info shimmer */}
                        <div className="border-t border-slate-700/50 pt-5 space-y-3">
                            <div className="h-3 w-36 bg-slate-700/70 rounded"></div>
                            <div className="h-4 w-full bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-2/3 bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-1/2 bg-slate-700/50 rounded"></div>
                        </div>
                        {/* Transactions shimmer */}
                        <div className="border-t border-slate-700/50 pt-5 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-3 w-28 bg-slate-700/70 rounded"></div>
                                <div className="h-3 w-14 bg-slate-700/50 rounded"></div>
                            </div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="py-3 border-b border-slate-700/40 flex items-center justify-between">
                                    <div className="space-y-1.5">
                                        <div className="h-3.5 w-36 bg-slate-700/50 rounded"></div>
                                        <div className="h-3 w-24 bg-slate-700/40 rounded"></div>
                                    </div>
                                    <div className="h-5 w-16 bg-slate-700/50 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                        {/* Subscriptions shimmer */}
                        <div className="border-t border-slate-700/50 pt-5 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-3 w-32 bg-slate-700/70 rounded"></div>
                                <div className="h-3 w-14 bg-slate-700/50 rounded"></div>
                            </div>
                            {[1, 2].map(i => (
                                <div key={i} className="py-3 border-b border-slate-700/40 flex items-center justify-between">
                                    <div className="space-y-1.5">
                                        <div className="h-3.5 w-40 bg-slate-700/50 rounded"></div>
                                        <div className="h-3 w-28 bg-slate-700/40 rounded"></div>
                                    </div>
                                    <div className="h-5 w-16 bg-slate-700/50 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {detailsError && !isLoadingDetails && (
                    <div className="m-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
                        <p className="font-medium mb-3">Failed to load details: {detailsError}</p>
                        <button
                            onClick={loadDetails}
                            className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 rounded-lg text-xs font-medium transition-colors border border-rose-500/30"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* INFO TAB — all sections in one scroll */}
                {activeTab === 'info' && !isLoadingDetails && (
                    <div className="p-6 space-y-0">
                        {/* Contact Info */}
                        <div className="space-y-4 pb-5">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Information</h3>
                            {(contact.loginEmail || more?.loginEmail) && (
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Email</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-white break-all text-sm">{contact.loginEmail || more?.loginEmail}</p>
                                        <CopyButton value={contact.loginEmail || more?.loginEmail} />
                                    </div>
                                </div>
                            )}
                            {(contact.mainPhone || more?.phoneNumber) && (
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Phone</p>
                                    <p className="text-white text-sm">{contact.mainPhone || more?.phoneNumber}</p>
                                </div>
                            )}
                            {contact.language && (
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Language</p>
                                    <p className="text-white uppercase text-sm">{contact.language}</p>
                                </div>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="border-t border-slate-700/50 py-5">
                            <button
                                onClick={() => setAcctExpanded(v => !v)}
                                className="flex items-center justify-between w-full mb-1 group"
                            >
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Information</h3>
                                {acctExpanded
                                    ? <ChevronUp size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                                    : <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                                }
                            </button>
                            {acctExpanded && (
                                <div className="space-y-4 pt-3">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Member ID</p>
                                        <div className="flex items-start gap-1">
                                            <p className="text-white font-mono text-xs break-all">{contact._id}</p>
                                            <CopyButton value={contact._id} />
                                        </div>
                                    </div>
                                    {more?.username && (
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Username</p>
                                            <p className="text-white text-sm">{more.username}</p>
                                        </div>
                                    )}
                                    {contact.slug && (
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Slug</p>
                                            <p className="text-white font-mono text-sm">{contact.slug}</p>
                                        </div>
                                    )}
                                    {contact.lastLogin && (
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Last Login</p>
                                            <p className="text-white text-sm">{new Date(contact.lastLogin).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Member Since</p>
                                        <p className="text-white text-sm">{new Date(contact._createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transactions preview */}
                        <div className="border-t border-slate-700/50 py-5">
                            <button
                                onClick={() => setTxExpanded(v => !v)}
                                className="flex items-center justify-between w-full mb-1 group"
                            >
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Transactions {transactions.length > 0 && <span className="text-slate-500">({transactions.length})</span>}
                                </h3>
                                {txExpanded
                                    ? <ChevronUp size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                                    : <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                                }
                            </button>
                            {txExpanded && (
                                transactions.length === 0 ? (
                                    <p className="text-slate-500 text-xs pt-2">No transactions</p>
                                ) : (
                                    <>
                                        {txPreview.map((tx, i) => (
                                            <TxItem key={tx._id} tx={tx} showDivider={i < txPreview.length - 1 || transactions.length > PREVIEW_LIMIT} />
                                        ))}
                                        {transactions.length > PREVIEW_LIMIT && (
                                            <button
                                                onClick={() => setActiveTab('transactions')}
                                                className="w-full pt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors text-center"
                                            >
                                                See All Transactions ({transactions.length})
                                            </button>
                                        )}
                                    </>
                                )
                            )}
                        </div>

                        {/* Subscriptions preview */}
                        <div className="border-t border-slate-700/50 py-5">
                            <button
                                onClick={() => setSubExpanded(v => !v)}
                                className="flex items-center justify-between w-full mb-1 group"
                            >
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Subscriptions {subscriptions.length > 0 && <span className="text-slate-500">({subscriptions.length})</span>}
                                </h3>
                                {subExpanded
                                    ? <ChevronUp size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                                    : <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                                }
                            </button>
                            {subExpanded && (
                                subscriptions.length === 0 ? (
                                    <p className="text-slate-500 text-xs pt-2">No subscriptions</p>
                                ) : (
                                    <>
                                        {subPreview.map((sub, i) => (
                                            <SubItem key={sub._id} sub={sub} showDivider={i < subPreview.length - 1 || subscriptions.length > PREVIEW_LIMIT} />
                                        ))}
                                        {subscriptions.length > PREVIEW_LIMIT && (
                                            <button
                                                onClick={() => setActiveTab('subscriptions')}
                                                className="w-full pt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors text-center"
                                            >
                                                See All Subscriptions ({subscriptions.length})
                                            </button>
                                        )}
                                    </>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* TRANSACTIONS full list tab */}
                {activeTab === 'transactions' && !isLoadingDetails && (
                    <div className="px-6 py-4">
                        <button onClick={() => setActiveTab('info')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4 transition-colors">
                            <ChevronLeft size={14} /> Back to Info
                        </button>
                        {transactions.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">No transactions found</div>
                        ) : transactions.map((tx, i) => (
                            <TxItem key={tx._id} tx={tx} showDivider={i < transactions.length - 1} />
                        ))}
                    </div>
                )}

                {/* SUBSCRIPTIONS full list tab */}
                {activeTab === 'subscriptions' && !isLoadingDetails && (
                    <div className="px-6 py-4">
                        <button onClick={() => setActiveTab('info')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4 transition-colors">
                            <ChevronLeft size={14} /> Back to Info
                        </button>
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">No subscriptions found</div>
                        ) : subscriptions.map((sub, i) => (
                            <SubItem key={sub._id} sub={sub} showDivider={i < subscriptions.length - 1} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedContact, setSelectedContact] = useState(null);

    const loadContacts = useCallback(async (search, page) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchContacts({ search, page });
            setContacts(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
            setCurrentPage(data.currentPage || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadContacts('', 0);
    }, [loadContacts]);

    const handleSearchChange = (value) => {
        setSearchInput(value);
    };

    const handleSearch = () => {
        setActiveSearch(searchInput);
        loadContacts(searchInput, 0);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setActiveSearch('');
        loadContacts('', 0);
    };

    const handlePageChange = (newPage) => {
        loadContacts(activeSearch, newPage);
        setSelectedContact(null);
    };

    const handleRowClick = (contact) => {
        setSelectedContact(prev => prev?._id === contact._id ? null : contact);
    };

    const getInitials = (contact) => {
        const first = contact.firstName?.[0] || contact.name?.[0] || '?';
        const last = contact.lastName?.[0] || '';
        return (first + last).toUpperCase();
    };

    const getDisplayName = (contact) => {
        if (contact.name) return contact.name;
        const full = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        return full || contact.nickname || contact.loginEmail || 'Unknown';
    };

    const statusBadge = (status) => {
        if (status === 'ACTIVE') return 'bg-emerald-500/20 text-emerald-400';
        if (status === 'INACTIVE') return 'bg-slate-500/20 text-slate-400';
        return 'bg-slate-700/50 text-slate-400';
    };

    const panelOpen = !!selectedContact;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex">
            <Sidebar />

            <div className={`flex-1 ml-64 transition-all duration-300 ${panelOpen ? 'mr-[420px]' : ''}`}>
                <div className="p-6 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Contacts</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                {totalCount > 0 ? `${totalCount.toLocaleString()} members total` : 'Manage your members'}
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4">
                        <div className="flex items-center gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search by name, email, or phone..."
                                    className="w-full pl-9 pr-8 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-700"
                                />
                                {searchInput && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-600 rounded-full transition-colors"
                                    >
                                        <X size={14} className="text-slate-400" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
                            >
                                <Search size={14} />
                                Search
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
                            Failed to load contacts: {error}
                        </div>
                    )}

                    {/* Table Card */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-800/40 border-b border-slate-700/50">
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                                        <th className="text-left py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-slate-400 text-sm">Loading contacts...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : contacts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-16 text-center text-slate-500">
                                                {activeSearch ? `No contacts found for "${activeSearch}"` : 'No contacts found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        contacts.map((contact) => (
                                            <tr
                                                key={contact._id}
                                                onClick={() => handleRowClick(contact)}
                                                className={`cursor-pointer transition-colors ${
                                                    selectedContact?._id === contact._id
                                                        ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                                                        : 'hover:bg-slate-700/30'
                                                }`}
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {contact.picture ? (
                                                            <img
                                                                src={contact.picture}
                                                                alt={getDisplayName(contact)}
                                                                className="w-9 h-9 rounded-full object-cover border border-slate-600 flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0 border border-slate-600">
                                                                <span className="text-white font-semibold text-xs">{getInitials(contact)}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{getDisplayName(contact)}</p>
                                                            {contact.nickname && (
                                                                <p className="text-slate-500 text-xs">@{contact.nickname}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <span className="text-slate-300 text-sm">{contact.loginEmail || '—'}</span>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <span className="text-slate-300 text-sm">{contact.mainPhone || '—'}</span>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg ${statusBadge(contact.status)}`}>
                                                        {contact.status || 'UNKNOWN'}
                                                    </span>
                                                </td>

                                                <td className="py-4 px-4 text-slate-300 text-sm">
                                                    {contact.lastLogin ? (
                                                        <>
                                                            {new Date(contact.lastLogin).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                            <br />
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(contact.lastLogin).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </>
                                                    ) : '—'}
                                                </td>

                                                <td className="py-4 px-4 text-slate-300 text-sm">
                                                    {contact._createdDate ? (
                                                        <>
                                                            {new Date(contact._createdDate).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                            <br />
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(contact._createdDate).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
                                <p className="text-sm text-slate-400">
                                    Page <span className="text-white font-semibold">{currentPage + 1}</span> of{' '}
                                    <span className="text-white font-semibold">{totalPages}</span>
                                    {' '}·{' '}
                                    <span className="text-white font-semibold">{totalCount.toLocaleString()}</span> total
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i;
                                        } else if (currentPage <= 2) {
                                            pageNum = i;
                                        } else if (currentPage >= totalPages - 3) {
                                            pageNum = totalPages - 5 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                    pageNum === currentPage
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedContact && (
                <ContactDetailsPanel
                    contact={selectedContact}
                    onClose={() => setSelectedContact(null)}
                />
            )}
        </div>
    );
};

export default Contacts;
