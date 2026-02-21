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

// GET /api/profiles/all — Admin only: list all profiles
router.get('/all', requireAuth, async (req, res) => {
    try {
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (!requesterProfile || requesterProfile.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can view all profiles' });
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, email, role, business_type, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data || []);
    } catch (err) {
        console.error('List profiles error:', err.message);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// DELETE /api/profiles/:id — Admin only: delete a user profile and auth account
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (!requesterProfile || requesterProfile.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can delete profiles' });
        }

        const targetId = req.params.id;

        // Prevent self-deletion
        if (targetId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Delete profile row (cascades or triggers will handle related data)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', targetId);

        if (profileError) {
            console.error('Delete profile error:', profileError);
            return res.status(500).json({ error: profileError.message });
        }

        // Delete auth user
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetId);
        if (authError) {
            console.error('Delete auth user error:', authError);
            // Profile already deleted, log but don't fail
        }

        res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
        console.error('Delete profile error:', err.message);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

module.exports = router;
