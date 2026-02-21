const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');

// Helper to extract token
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};

// POST /api/startups/:id/swipe - Record a swipe on a startup
router.post('/:id/swipe', async (req, res) => {
    try {
        const { id } = req.params;
        const { direction } = req.body; // 'left' or 'right'

        if (!['left', 'right'].includes(direction)) {
            return res.status(400).json({ error: 'Direction must be "left" or "right"' });
        }

        const token = extractToken(req);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        // Upsert the swipe (update direction if already swiped)
        const { data, error } = await supabaseAdmin
            .from('startup_swipes')
            .upsert({
                startup_id: id,
                investor_id: user.id,
                direction
            }, { onConflict: 'startup_id,investor_id' })
            .select();

        if (error) {
            console.error('Swipe error:', error);
            return res.status(500).json({ error: error.message });
        }

        // If swiped right, also save to saved_startups
        if (direction === 'right') {
            await supabaseAdmin
                .from('saved_startups')
                .upsert({
                    investor_id: user.id,
                    startup_id: id
                }, { onConflict: 'investor_id,startup_id' });
        }

        res.json({ message: `Swiped ${direction}`, data: data?.[0] });
    } catch (err) {
        console.error('Swipe error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/startups/swipe-stats/:id - Get swipe statistics for a startup
router.get('/swipe-stats/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('startup_swipes')
            .select('direction')
            .eq('startup_id', id);

        if (error) return res.status(500).json({ error: error.message });

        const totalSwipes = data?.length || 0;
        const favorites = data?.filter(s => s.direction === 'right').length || 0;

        res.json({ totalSwipes, favorites });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/startups/swipe-stats-bulk - Get swipe stats for multiple startups
router.post('/swipe-stats-bulk', async (req, res) => {
    try {
        const { startupIds } = req.body;
        if (!startupIds || !Array.isArray(startupIds)) {
            return res.status(400).json({ error: 'startupIds array required' });
        }

        const { data, error } = await supabaseAdmin
            .from('startup_swipes')
            .select('startup_id, direction')
            .in('startup_id', startupIds);

        if (error) return res.status(500).json({ error: error.message });

        // Aggregate stats
        const stats = {};
        startupIds.forEach(id => {
            stats[id] = { totalSwipes: 0, favorites: 0 };
        });

        (data || []).forEach(swipe => {
            if (stats[swipe.startup_id]) {
                stats[swipe.startup_id].totalSwipes++;
                if (swipe.direction === 'right') {
                    stats[swipe.startup_id].favorites++;
                }
            }
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/startups/binder-deck - Get a randomized deck of startups for the Binder
router.get('/binder-deck', async (req, res) => {
    try {
        const token = extractToken(req);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        const { category } = req.query;

        // Get IDs this user already swiped on
        const { data: swipedData } = await supabaseAdmin
            .from('startup_swipes')
            .select('startup_id')
            .eq('investor_id', user.id);

        const swipedIds = (swipedData || []).map(s => s.startup_id);

        // Build query
        let query = supabaseAdmin
            .from('startups')
            .select('id, name, image_url, description, stage, size, industry, created_at, ace_score')
            .order('created_at', { ascending: false })
            .limit(30);

        if (category && category !== 'All') {
            query = query.contains('industry', [category]);
        }

        // Exclude already-swiped startups
        if (swipedIds.length > 0) {
            console.log('Excluding swiped IDs:', swipedIds);
            query = query.filter('id', 'not.in', `(${swipedIds.join(',')})`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Binder deck query error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`Fetched ${data?.length || 0} startups for deck`);
        res.json({ data: data || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/startups/check-membership/:id - Check if user is a member of a startup
router.get('/check-membership/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = extractToken(req);

        if (!token) return res.json({ isMember: false });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.json({ isMember: false });

        const { data, error } = await supabaseAdmin
            .from('startup_members')
            .select('role')
            .eq('startup_id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !data) return res.json({ isMember: false });

        res.json({ isMember: true, role: data.role });
    } catch (err) {
        res.json({ isMember: false });
    }
});

module.exports = router;
