import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

const SITE_PASSWORD = '07911';

export default function PasswordGate({ children }) {
    const [authed, setAuthed] = useState(false);
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    // Restore auth state from sessionStorage so a page reload doesn't
    // force the user to re-enter the password.
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('reba_authed');
            if (saved === 'true') setAuthed(true);
        } catch (err) {
            // ignore sessionStorage errors (e.g., privacy mode)
        }
    }, []);

    // Persist auth state to sessionStorage whenever it changes.
    useEffect(() => {
        try {
            if (authed) sessionStorage.setItem('reba_authed', 'true');
            else sessionStorage.removeItem('reba_authed');
        } catch (err) {
            // ignore sessionStorage errors
        }
    }, [authed]);

    // Re-lock instantly whenever the screen turns off, the tab is
    // hidden/backgrounded, or the window loses focus — not just on reload.
    useEffect(() => {
        const lock = () => {
            setAuthed(false);
            try {
                sessionStorage.removeItem('reba_authed');
            } catch (err) {
                // ignore
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) lock();
        };

        // Device screen turning off / OS lock screen engaging / tab switch.
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Belt-and-suspenders for browsers/devices that don't fire visibilitychange reliably.
        window.addEventListener('pagehide', lock);
        window.addEventListener('blur', lock);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', lock);
            window.removeEventListener('blur', lock);
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input === SITE_PASSWORD) {
            setAuthed(true);
            setError(false);
            setInput('');
        } else {
            setError(true);
            setInput('');
        }
    };

    if (!authed) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-black px-4">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-sm bg-slate-800/40 rounded-2xl border border-slate-700/50 p-8"
                >
                    <div className="flex flex-col items-center mb-6">
                        <div className="p-3 rounded-xl bg-emerald-500/20 mb-4">
                            <Lock size={22} className="text-emerald-400" />
                        </div>
                        <h1 className="text-white text-lg font-bold">Protected Dashboard</h1>
                        <p className="text-slate-400 text-sm mt-1">Enter the password to continue</p>
                    </div>
                    <input
                        type="password"
                        autoFocus
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setError(false);
                        }}
                        placeholder="Password"
                        className={`w-full rounded-xl bg-slate-900/60 border px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors ${error ? 'border-rose-500' : 'border-slate-700/50 focus:border-emerald-400/50'
                            }`}
                    />
                    {error && (
                        <p className="text-rose-400 text-xs mt-2">Incorrect password. Try again.</p>
                    )}
                    <button
                        type="submit"
                        className="w-full mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 transition-colors border-none"
                    >
                        Unlock
                    </button>
                </form>
            </div>
        );
    }

    return children;
}
