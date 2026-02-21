const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createUserClient } = require('../lib/supabase');

// GET /api/tasks — list tasks (scoped to optional startup/business)
router.get('/', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { startup_id, business_id } = req.query;

        let query = supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (startup_id) {
            query = query.eq('startup_id', startup_id);
        } else if (business_id) {
            query = query.eq('business_id', business_id);
        } else {
            // Default: fetch tasks where current user is manager (personal/global tasks)
            // Or maybe we should only return tasks if a scope is provided?
            // For now, keep existing behavior: manager_id = user.id (personal tasks)
            query = query.eq('manager_id', req.user.id);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Get tasks error:', err.message);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks — create a task
router.post('/', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { title, status, priority, startup_id, business_id } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'title is required' });
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title,
                status: status || 'Todo',
                priority: priority || 'Medium',
                manager_id: req.user.id,
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
        console.error('Create task error:', err.message);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PATCH /api/tasks/:id — update a task
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);
        const { title, status, priority } = req.body;

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;

        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Update task error:', err.message);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error('Delete task error:', err.message);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
