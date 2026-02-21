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

// POST /api/tech-park/apply - Create new application
router.post('/apply', async (req, res) => {
    try {
        const token = extractToken(req);
        let userId = null;

        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) userId = user.id;
        }

        const {
            applicantType, isDraft, fullName, contactPhones, website, email,
            idSeries, idNumber, issueDate, issuingAuthority, taxDetails,
            registrationNumber, repFullName, repAddress, repPhone, repEmail, repIdDetails,
            currentActivity, specialLicenses, totalArea, buildingArea, officeArea,
            warehouseArea, warehouseVolume, auxiliaryArea, laboratoryArea, otherAreas,
            projectName, projectDetails, projectStartDate, projectDuration, newJobsCreated,
            patentInfo, shortDescription, applicantStatementName, techParkName,
            submissionDate, digitalSignature
        } = req.body;

        const { data, error } = await supabaseAdmin
            .from('tech_park_applications')
            .insert([{
                user_id: userId,
                applicant_type: applicantType,
                full_name: fullName,
                contact_phones: contactPhones,
                website,
                email,
                id_series: idSeries,
                id_number: idNumber,
                issue_date: issueDate || null,
                issuing_authority: issuingAuthority,
                tax_details: taxDetails,
                registration_number: registrationNumber,
                rep_full_name: repFullName,
                rep_address: repAddress,
                rep_phone: repPhone,
                rep_email: repEmail,
                rep_id_details: repIdDetails,
                current_activity: currentActivity,
                special_licenses: specialLicenses,
                total_area: totalArea,
                building_area: buildingArea,
                office_area: officeArea,
                warehouse_area: warehouseArea,
                warehouse_volume: warehouseVolume,
                auxiliary_area: auxiliaryArea,
                laboratory_area: laboratoryArea,
                other_areas: otherAreas,
                project_name: projectName,
                project_details: projectDetails,
                project_start_date: projectStartDate || null,
                project_duration: projectDuration,
                new_jobs_created: newJobsCreated,
                patent_info: patentInfo,
                short_description: shortDescription,
                applicant_statement_name: applicantStatementName,
                tech_park_name: techParkName,
                submission_date: submissionDate || null,
                digital_signature: digitalSignature,
                status: isDraft ? 'Draft' : 'Pending'
            }])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ message: isDraft ? 'Draft saved successfully' : 'Application submitted successfully', data: data[0] });
    } catch (err) {
        console.error('Application Submission Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tech-park/my-application - Get the logged in user's active application
router.get('/my-application', async (req, res) => {
    try {
        const token = extractToken(req);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        const { data, error } = await supabaseAdmin
            .from('tech_park_applications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) return res.status(500).json({ error: error.message });

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No application found', data: null });
        }

        res.json({ data: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/tech-park/apply/:id - Update an existing application (Draft/Pending only)
router.put('/apply/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = extractToken(req);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        // First check if application belongs to user and is in valid status
        const { data: existingApp } = await supabaseAdmin
            .from('tech_park_applications')
            .select('status, user_id')
            .eq('id', id)
            .single();

        if (!existingApp || existingApp.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden or Not Found' });
        }

        if (!['Draft', 'Pending', 'Requires Revision'].includes(existingApp.status)) {
            return res.status(400).json({ error: 'Cannot edit application in current status' });
        }

        const { isDraft, ...updateData } = req.body;

        // Map frontend camelCase to snake_case for DB
        const mappedData = {
            applicant_type: updateData.applicantType,
            full_name: updateData.fullName,
            contact_phones: updateData.contactPhones,
            website: updateData.website,
            email: updateData.email,
            id_series: updateData.idSeries,
            id_number: updateData.idNumber,
            issue_date: updateData.issueDate || null,
            issuing_authority: updateData.issuingAuthority,
            tax_details: updateData.taxDetails,
            registration_number: updateData.registrationNumber,
            rep_full_name: updateData.repFullName,
            rep_address: updateData.repAddress,
            rep_phone: updateData.repPhone,
            rep_email: updateData.repEmail,
            rep_id_details: updateData.repIdDetails,
            current_activity: updateData.currentActivity,
            special_licenses: updateData.specialLicenses,
            total_area: updateData.totalArea,
            building_area: updateData.buildingArea,
            office_area: updateData.officeArea,
            warehouse_area: updateData.warehouseArea,
            warehouse_volume: updateData.warehouseVolume,
            auxiliary_area: updateData.auxiliaryArea,
            laboratory_area: updateData.laboratoryArea,
            other_areas: updateData.otherAreas,
            project_name: updateData.projectName,
            project_details: updateData.projectDetails,
            project_start_date: updateData.projectStartDate || null,
            project_duration: updateData.projectDuration,
            new_jobs_created: updateData.newJobsCreated,
            patent_info: updateData.patentInfo,
            short_description: updateData.shortDescription,
            applicant_statement_name: updateData.applicantStatementName,
            tech_park_name: updateData.techParkName,
            submission_date: updateData.submissionDate || null,
            digital_signature: updateData.digitalSignature,
            status: isDraft ? 'Draft' : 'Pending'
        };

        // Remove undefined keys to not overwrite fields missing in partial updates
        Object.keys(mappedData).forEach(key => mappedData[key] === undefined && delete mappedData[key]);

        const { data, error } = await supabaseAdmin
            .from('tech_park_applications')
            .update(mappedData)
            .eq('id', id)
            .select();

        if (error) return res.status(500).json({ error: error.message });

        res.json({ message: 'Application updated successfully', data: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/tech-park/apply/:id - Delete an existing application (Draft/Pending only)
router.delete('/apply/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = extractToken(req);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        const { data: existingApp } = await supabaseAdmin
            .from('tech_park_applications')
            .select('status, user_id')
            .eq('id', id)
            .single();

        if (!existingApp || existingApp.user_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden or Not Found' });
        }

        if (!['Draft', 'Pending', 'Requires Revision', 'Rejected'].includes(existingApp.status)) {
            return res.status(400).json({ error: 'Cannot delete application in current status' });
        }

        const { error } = await supabaseAdmin
            .from('tech_park_applications')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });

        res.json({ message: 'Application deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ROUTES ---

// GET /api/tech-park/test-all - Public test to bypass Auth and see if query fails
router.get('/test-all', async (req, res) => {
    try {
        console.log('GET /api/tech-park/test-all hit');
        const { data, error } = await supabaseAdmin
            .from('tech_park_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Test Supabase query error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Test Successfully fetched', data.length, 'applications');
        res.json({ data });
    } catch (err) {
        console.error('Test Catch block error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tech-park/all - Admin only
router.get('/all', async (req, res) => {
    try {
        console.log('GET /api/tech-park/all hit');
        const token = extractToken(req);
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            console.log('Auth error:', authError);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify admin
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileErr) {
            console.error('Profile fetch error:', profileErr);
        }

        if (!profile || profile.role !== 'Admin') {
            console.log('User is not admin. Role:', profile?.role);
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        console.log('Admin verified. Fetching applications...');
        const { data, error } = await supabaseAdmin
            .from('tech_park_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Successfully fetched', data.length, 'applications');
        res.json({ data });
    } catch (err) {
        console.error('Catch block error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/tech-park/:id/status - Admin only
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) return res.status(400).json({ error: 'Status is required' });

        const token = extractToken(req);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        // Verify admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'Admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { data, error } = await supabaseAdmin
            .from('tech_park_applications')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) return res.status(500).json({ error: error.message });

        res.json({ message: 'Status updated successfully', data: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
