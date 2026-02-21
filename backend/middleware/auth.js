const { supabaseAdmin } = require('../lib/supabase');

/**
 * Authentication Middleware
 * Validates Supabase-issued JWT from the Authorization header.
 * Attaches user object and access token to req.
 */
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        const token = authHeader.split(' ')[1];

        // Validate the token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error) {
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({ error: 'Unauthorized: ' + error.message });
        }

        if (!user) {
            console.error('Auth middleware: No user found for token');
            return res.status(401).json({ error: 'Unauthorized: No user found' });
        }

        // Attach user and token to request
        req.user = user;
        req.accessToken = token;

        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        return res.status(500).json({ error: 'Authentication service error' });
    }
}

/**
 * Role-based access middleware.
 * Must be used AFTER requireAuth.
 */
function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const { data: profile, error } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', req.user.id)
                .single();

            if (error || !profile) {
                return res.status(403).json({ error: 'Profile not found' });
            }

            if (!allowedRoles.includes(profile.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            req.userRole = profile.role;
            next();
        } catch (err) {
            console.error('Role check error:', err.message);
            return res.status(500).json({ error: 'Authorization service error' });
        }
    };
}

module.exports = { requireAuth, requireRole };
