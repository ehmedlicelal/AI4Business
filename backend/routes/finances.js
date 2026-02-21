const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createUserClient } = require('../lib/supabase');

// GET /api/finances — list finances (scoped)
router.get('/', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { startup_id, business_id } = req.query;

        let query = supabase
            .from('finances')
            .select('*')
            .order('created_at', { ascending: false });

        if (startup_id) {
            query = query.eq('startup_id', startup_id);
        } else if (business_id) {
            query = query.eq('business_id', business_id);
        }
        // If neither, returns all rows visible to user via RLS (usually own rows)

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Get finances error:', err.message);
        res.status(500).json({ error: 'Failed to fetch finances' });
    }
});

// POST /api/finances — create a finance record
router.post('/', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { amount, type, category, status, startup_id, business_id } = req.body;

        if (!amount || !type) {
            return res.status(400).json({ error: 'amount and type are required' });
        }

        if (!['Revenue', 'Expense', 'Profit'].includes(type)) {
            return res.status(400).json({ error: 'type must be Revenue, Expense, or Profit' });
        }

        const { data, error } = await supabase
            .from('finances')
            .insert({
                user_id: req.user.id,
                amount: parseFloat(amount),
                type,
                category: category || null,
                status: status || 'Success',
                startup_id: startup_id || null,
                business_id: business_id || null
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (err) {
        console.error('Create finance error:', err.message);
        res.status(500).json({ error: 'Failed to create finance record' });
    }
});

module.exports = router;
