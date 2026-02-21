/**
 * Simple store to hold the access token in memory.
 * This avoids calling supabase.auth.getSession() repeatedly which can cause
 * Navigator LockManager timeouts in development due to lock contention.
 */
export const authStore = {
    token: null,
    setToken(t) {
        this.token = t;
    },
    getToken() {
        return this.token;
    }
};
