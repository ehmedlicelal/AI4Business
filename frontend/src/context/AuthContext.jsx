import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authStore } from '../lib/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile directly from Supabase (uses RLS — auth.uid() = id)
    async function fetchProfile(userId) {
        if (!userId) {
            setProfile(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
                console.log('Profile not found, attempting to create default profile...');
                // Attempt to create a default profile
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([
                        { id: userId, role: 'Manager' } // Default role
                    ])
                    .select()
                    .single();

                if (createError) {
                    console.error('Failed to create default profile:', createError.message);
                    setProfile(null);
                } else {
                    console.log('Created default profile:', newProfile);
                    setProfile(newProfile);
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Profile fetch failed:', err.message);
            setProfile(null);
        }
    }

    const clearSession = () => {
        // Force clear all auth state
        authStore.setToken(null);

        // Clear Supabase tokens from localStorage & sessionStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('ai4b-auth-v')) {
                localStorage.removeItem(key);
            }
        });
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('ai4b-auth-v')) {
                sessionStorage.removeItem(key);
            }
        });

        // Always clear state
        setUser(null);
        setProfile(null);
    };

    useEffect(() => {
        let mounted = true;
        const channel = new BroadcastChannel('auth_channel');

        channel.onmessage = (event) => {
            if (event.data.type === 'LOGOUT') {
                console.log('Received logout signal from another tab');
                if (mounted) {
                    clearSession();
                }
            }
        };

        console.log('Starting auth check...');

        // Safety timeout to ensure we don't hang indefinitely
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth check timed out, forcing load...');
                setLoading(false);
            }
        }, 2000);

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return;
            console.log('Session retrieved:', session ? 'User found' : 'No session');

            if (session?.access_token) {
                authStore.setToken(session.access_token);
            }

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                console.log('Fetching profile for:', currentUser.id);
                // Don't await - let it load in background for instant UI
                fetchProfile(currentUser.id).catch(err => console.error('bg fetch failed', err));
            }

            if (mounted) setLoading(false);
        }).catch((err) => {
            console.error('Get session failed:', err);
            if (mounted) setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;
                console.log('Auth state changed:', _event);

                if (session?.access_token) {
                    authStore.setToken(session.access_token);
                } else if (_event === 'SIGNED_OUT') {
                    // We handle cleanup in signOut manually now, but this is a fallback
                    // clearSession(); 
                    // Don't call clearSession here to avoid race conditions with optimistic signOut
                    authStore.setToken(null);
                }

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                // Ensure we stop loading if auth state changes (fallback for getSession hang)
                setLoading(false);

                if (currentUser) {
                    try {
                        await fetchProfile(currentUser.id);
                    } catch (err) {
                        console.error('Profile fetch failed in listener:', err);
                    }
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timer);
            channel.close();
            subscription.unsubscribe();
        };
    }, []);

    async function signUp(email, password, options = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options
        });
        if (error) throw error;
        return data;
    }

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        // 1. Optimistic UI update: Clear local state immediately
        clearSession();

        // 2. Notify other tabs immediately
        const channel = new BroadcastChannel('auth_channel');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();

        // 3. Perform server-side sign out (fire and forget/log error)
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Sign out error:', err.message);
        }
    }

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile: () => fetchProfile(user?.id),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
