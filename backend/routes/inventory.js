const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { createUserClient } = require('../lib/supabase');

// GET /api/inventory — list (scoped)
router.get('/', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { startup_id, business_id } = req.query;

        let query = supabase
            .from('inventory')
            .select('*')
            .order('created_at', { ascending: false });

        if (startup_id) {
            query = query.eq('startup_id', startup_id);
        } else if (business_id) {
            query = query.eq('business_id', business_id);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Get inventory error:', err.message);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// POST /api/inventory — create (Admin only for now, but really should be Owner)
// Temporarily keeping Admin check but generally inventory should be creatable by business owners
router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { sku, name, quantity, low_stock_threshold, startup_id, business_id } = req.body;

        if (!sku || !name) {
            return res.status(400).json({ error: 'sku and name are required' });
        }

        const { data, error } = await supabase
            .from('inventory')
            .insert({
                sku,
                name,
                quantity: parseInt(quantity) || 0,
                low_stock_threshold: parseInt(low_stock_threshold) || 10,
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
        console.error('Create inventory error:', err.message);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
});

// PATCH /api/inventory/:id — update inventory item (Admin only)
router.patch('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { sku, name, quantity, low_stock_threshold } = req.body;

        const updates = {};
        if (sku !== undefined) updates.sku = sku;
        if (name !== undefined) updates.name = name;
        if (quantity !== undefined) updates.quantity = parseInt(quantity);
        if (low_stock_threshold !== undefined) updates.low_stock_threshold = parseInt(low_stock_threshold);

        const { data, error } = await supabase
            .from('inventory')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Update inventory error:', err.message);
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});

// DELETE /api/inventory/:id — delete inventory item (Admin only)
router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);

        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Inventory item deleted' });
    } catch (err) {
        console.error('Delete inventory error:', err.message);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

module.exports = router;
