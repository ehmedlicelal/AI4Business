const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

// GET /api/profiles/me — get current user's profile
router.get('/me', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(data);
    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PATCH /api/profiles/me — update current user's profile
router.patch('/me', requireAuth, async (req, res) => {
    try {
        const { business_type } = req.body;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ business_type })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Update profile error:', err.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// PATCH /api/profiles/:id/role — Admin only: change user role
router.patch('/:id/role', requireAuth, async (req, res) => {
    try {
        // Check if requester is Admin
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (!requesterProfile || requesterProfile.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can change roles' });
        }

        const { role } = req.body;
        if (!['Admin', 'Manager'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Update role error:', err.message);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

module.exports = router;
