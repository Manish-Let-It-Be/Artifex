import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

interface AuthContextType {
    email: string | null;
    login: (email: string) => Promise<void>;
    logout: () => void;
    purchasedModels: string[];
    refreshAccess: () => Promise<void>;
    hasPaid: (modelId: string) => boolean;
    buyModel: (modelId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [email, setEmail] = useState<string | null>(() => localStorage.getItem('user_email'));
    const [purchasedModels, setPurchasedModels] = useState<string[]>([]);

    const refreshAccess = async () => {
        if (!email) return;
        try {
            const res = await axios.get(`${API}/payment/my-models/${encodeURIComponent(email)}`);
            setPurchasedModels(res.data.models || []);
        } catch { /* ignore */ }
    };

    useEffect(() => { refreshAccess(); }, [email]);

    // On return from Stripe, verify the session
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        const status = params.get('payment');
        if (status === 'success' && sessionId) {
            axios.get(`${API}/payment/verify-session/${sessionId}`)
                .then(() => refreshAccess())
                .catch(() => {});
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const login = async (userEmail: string) => {
        await axios.post(`${API}/payment/login`, { email: userEmail });
        localStorage.setItem('user_email', userEmail);
        setEmail(userEmail);
    };

    const logout = () => {
        localStorage.removeItem('user_email');
        setEmail(null);
        setPurchasedModels([]);
    };

    const hasPaid = (modelId: string) => purchasedModels.includes(modelId);

    const buyModel = async (modelId: string) => {
        if (!email) throw new Error('Login required');
        const res = await axios.post(`${API}/payment/create-checkout`, {
            email,
            model_id: modelId,
        });
        if (res.data.already_purchased) {
            await refreshAccess();
            return;
        }
        window.location.href = res.data.checkout_url;
    };

    return (
        <AuthContext.Provider value={{ email, login, logout, purchasedModels, refreshAccess, hasPaid, buyModel }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
