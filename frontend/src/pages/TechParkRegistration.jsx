import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import RegistrationChatbot from '../components/RegistrationChatbot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function TechParkRegistration() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0); // Starts at Step 0
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingApp, setLoadingApp] = useState(true);
    const [existingApp, setExistingApp] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        // Step 0: Applicant Type
        applicantType: '', // 'Individual' or 'Legal Entity'

        // Page 2: Applicant Information
        fullName: '',
        contactPhones: '',
        website: '',
        email: '',

        // Individual specifics
        idSeries: '',
        idNumber: '',
        issueDate: '',
        issuingAuthority: '',
        taxDetails: '',

        // Legal Entity specifics
        registrationNumber: '',
        repFullName: '',
        repAddress: '',
        repPhone: '',
        repEmail: '',
        repIdDetails: '',

        currentActivity: '',
        specialLicenses: [], // Array of objects

        // Page 3: Area & Project Details
        totalArea: '',
        buildingArea: '',
        officeArea: '',
        warehouseArea: '',
        warehouseVolume: '',
        auxiliaryArea: '',
        laboratoryArea: '',
        otherAreas: '',
        projectName: '',
        projectDetails: '',
        projectStartDate: '',
        projectDuration: '',
        newJobsCreated: '',
        patentInfo: '',
        shortDescription: '',

        // Page 4: Acceptance
        accepted: false,
        applicantStatementName: '',
        techParkName: '',
        submissionDate: new Date().toISOString().split('T')[0],
        digitalSignature: '',

        // Page 5: Documents (Files)
        files: {
            legalEntityExtract: null, // Legal Entity
            charterStatutes: null, // Legal Entity
            repIdDocument: null, // Legal Entity
            individualIdDocument: null, // Individual
            taxRegistrationCertificate: null, // Individual
            projectPlan: null, // Shared
            specialLicensesDoc: null, // Shared
        }
    });

    const [newLicense, setNewLicense] = useState({ name: '', issueDate: '', validity: '' });

    useEffect(() => {
        const fetchExistingApp = async () => {
            let token = null;
            try {
                const { data } = await supabase.auth.getSession();
                token = data?.session?.access_token;
            } catch (e) {
                console.warn("Failed to get session", e);
            }

            if (!token) {
                setLoadingApp(false);
                return; // Public user filling out form
            }

            try {
                const data = await apiFetch('/api/tech-park/my-application');
                if (data && data.data) {
                    setExistingApp(data.data);
                }
            } catch (err) {
                // Ignore 404s, it just means they haven't applied yet
                if (!err.message.includes('404')) {
                    console.error("Failed to fetch application:", err);
                }
            } finally {
                setLoadingApp(false);
            }
        };

        fetchExistingApp();
    }, []);

    const handleInput = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e, fieldName) => {
        setFormData(prev => ({
            ...prev,
            files: {
                ...prev.files,
                [fieldName]: e.target.files[0]
            }
        }));
    };

    const addLicense = () => {
        if (!newLicense.name) return;
        setFormData(prev => ({
            ...prev,
            specialLicenses: [...prev.specialLicenses, newLicense]
        }));
        setNewLicense({ name: '', issueDate: '', validity: '' });
    };

    const removeLicense = (index) => {
        setFormData(prev => ({
            ...prev,
            specialLicenses: prev.specialLicenses.filter((_, i) => i !== index)
        }));
    };

    const selectApplicantType = (type) => {
        setFormData(prev => ({ ...prev, applicantType: type }));
        setPage(1);
    };

    const nextPage = () => {
        setError('');
        // Basic dynamic validation
        if (page === 2) {
            if (!formData.fullName || !formData.contactPhones || !formData.email || !formData.currentActivity) {
                setError('Please fill out all required basic info fields requested.');
                return;
            }
            if (formData.applicantType === 'Legal Entity' && !formData.registrationNumber) {
                setError('Registration number is required for Legal Entities.');
                return;
            }
            if (formData.applicantType === 'Individual' && (!formData.idSeries || !formData.idNumber)) {
                setError('ID details are required for Individuals.');
                return;
            }
        }
        if (page === 3) {
            if (!formData.projectName || !formData.projectDetails) {
                setError('Project name and details are required.');
                return;
            }
        }
        if (page === 4) {
            if (!formData.accepted || !formData.applicantStatementName || !formData.techParkName || !formData.submissionDate) {
                setError('You must accept the terms and provide all required information.');
                return;
            }
        }
        setPage(prev => Math.min(5, prev + 1));
    };

    const prevPage = () => {
        setError('');
        if (page === 0) {
            navigate(-1);
        } else {
            setPage(prev => Math.max(0, prev - 1));
        }
    };

    const submitForm = async (e, isDraft = false) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Note: Sending as JSON. Real file uploads require FormData multipart/form-data.
            const payload = { ...formData, isDraft };
            delete payload.files;

            let token = null;
            try {
                const { data } = await supabase.auth.getSession();
                token = data?.session?.access_token;
            } catch (e) {
                console.warn("Session error", e);
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const url = existingApp ? `${API_URL}/api/tech-park/apply/${existingApp.id}` : `${API_URL}/api/tech-park/apply`;
            const method = existingApp ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to submit application.');
            }

            setSuccess(isDraft ? 'Draft saved successfully!' : 'Application submitted successfully!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to submit application.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = () => {
        if (!existingApp) return;

        // Map database snake_case back to frontend camelCase state
        setFormData(prev => ({
            ...prev,
            applicantType: existingApp.applicant_type || '',
            fullName: existingApp.full_name || '',
            contactPhones: existingApp.contact_phones || '',
            website: existingApp.website || '',
            email: existingApp.email || '',
            idSeries: existingApp.id_series || '',
            idNumber: existingApp.id_number || '',
            issueDate: existingApp.issue_date || '',
            issuingAuthority: existingApp.issuing_authority || '',
            taxDetails: existingApp.tax_details || '',
            registrationNumber: existingApp.registration_number || '',
            repFullName: existingApp.rep_full_name || '',
            repAddress: existingApp.rep_address || '',
            repPhone: existingApp.rep_phone || '',
            repEmail: existingApp.rep_email || '',
            repIdDetails: existingApp.rep_id_details || '',
            currentActivity: existingApp.current_activity || '',
            specialLicenses: existingApp.special_licenses || [],
            totalArea: existingApp.total_area || '',
            buildingArea: existingApp.building_area || '',
            officeArea: existingApp.office_area || '',
            warehouseArea: existingApp.warehouse_area || '',
            warehouseVolume: existingApp.warehouse_volume || '',
            auxiliaryArea: existingApp.auxiliary_area || '',
            laboratoryArea: existingApp.laboratory_area || '',
            otherAreas: existingApp.other_areas || '',
            projectName: existingApp.project_name || '',
            projectDetails: existingApp.project_details || '',
            projectStartDate: existingApp.project_start_date || '',
            projectDuration: existingApp.project_duration || '',
            newJobsCreated: existingApp.new_jobs_created || '',
            patentInfo: existingApp.patent_info || '',
            shortDescription: existingApp.short_description || '',
            applicantStatementName: existingApp.applicant_statement_name || '',
            techParkName: existingApp.tech_park_name || '',
            submissionDate: existingApp.submission_date || new Date().toISOString().split('T')[0],
            digitalSignature: existingApp.digital_signature || '',
            accepted: true // Assumed accepted if it was saved before
        }));

        setPage(0); // Start at step 0 so they can review everything
        setExistingApp(null); // Clear the dashboard view so the form renders
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;

        setError('');
        try {
            await apiFetch(`/api/tech-park/apply/${existingApp.id}`, {
                method: 'DELETE'
            });

            setExistingApp(null); // Clear app to return to blank form
            setPage(0);
        } catch (err) {
            setError(err.message || 'Error deleting application.');
        }
    };

    const isIndividual = formData.applicantType === 'Individual';
    const isLegalEntity = formData.applicantType === 'Legal Entity';

    if (loadingApp) {
        return (
            <div className="min-h-screen bg-[#0f1729] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85BB65]"></div>
            </div>
        );
    }

    // Status Dashboard View
    if (existingApp) {
        const canEditOrDelete = ['Draft', 'Pending', 'Requires Revision'].includes(existingApp.status);

        let statusColor = 'text-slate-400';
        let statusBg = 'bg-slate-800';

        switch (existingApp.status) {
            case 'Draft':
                statusColor = 'text-yellow-400';
                statusBg = 'bg-yellow-400/10 border-yellow-400/30';
                break;
            case 'Pending':
            case 'Under Review':
                statusColor = 'text-blue-400';
                statusBg = 'bg-blue-400/10 border-blue-400/30';
                break;
            case 'Approved':
                statusColor = 'text-[#85BB65]';
                statusBg = 'bg-[#85BB65]/10 border-[#85BB65]/30';
                break;
            case 'Rejected':
                statusColor = 'text-red-400';
                statusBg = 'bg-red-400/10 border-red-400/30';
                break;
            case 'Requires Revision':
                statusColor = 'text-orange-400';
                statusBg = 'bg-orange-400/10 border-orange-400/30';
                break;
        }

        return (
            <div className="min-h-screen bg-[#0f1729] py-12 px-4 sm:px-6 lg:px-8 text-white relative flex items-center justify-center">
                <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
                    <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#85BB65] to-[#1e293b] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"></div>
                </div>

                <div className="max-w-3xl w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">My Tech Park Application</h2>
                        <p className="text-slate-400">Track the status of your residency request.</p>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">{error}</div>}

                    <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 mb-8 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Project Name</p>
                                <p className="font-semibold text-lg">{existingApp.project_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Applicant Type</p>
                                <p className="font-semibold text-lg">{existingApp.applicant_type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Submitted On</p>
                                <p className="font-semibold text-lg">{new Date(existingApp.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Current Status</p>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full border ${statusBg}`}>
                                    <span className={`font-bold ${statusColor}`}>{existingApp.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {canEditOrDelete && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleEdit}
                                className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Edit Application
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Draft
                            </button>
                        </div>
                    )}

                    {!canEditOrDelete && existingApp.status === 'Rejected' && (
                        <div className="text-center p-6 bg-red-500/10 rounded-xl border border-red-500/30">
                            <h3 className="text-xl font-semibold text-red-400 mb-2">Application Rejected</h3>
                            <p className="text-slate-300 text-sm mb-6">
                                Unfortunately, your application did not meet the requirements for Tech Park residency at this time.
                                However, you are welcome to revise your business plan and reapply.
                            </p>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-[#85BB65] hover:bg-[#6FA84E] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#85BB65]/20 inline-flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Start New Application
                            </button>
                        </div>
                    )}

                    {!canEditOrDelete && existingApp.status !== 'Rejected' && (
                        <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <p className="text-slate-400 text-sm">Your application is currently being processed. Editing is disabled at this stage.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1729] py-12 px-4 sm:px-6 lg:px-8 text-white relative flex items-center justify-center">
            {/* Background elements */}
            <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
                <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#85BB65] to-[#1e293b] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"></div>
            </div>

            <div className="max-w-4xl w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative">

                {/* Progress Bar (Only show if past Step 0) */}
                {page > 0 && (
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-8 mt-2 overflow-hidden">
                        <div
                            className="bg-[#85BB65] h-2 transition-all duration-300 ease-in-out"
                            style={{ width: `${(page / 5) * 100}%` }}
                        ></div>
                    </div>
                )}

                <div className="mb-8">
                    {page > 0 && <p className="text-[#85BB65] font-semibold text-sm tracking-wider uppercase">Step {page} of 5</p>}
                    <h2 className="text-3xl font-bold mt-1 tracking-tight text-white">
                        {page === 0 && "Welcome to Tech Park Registration"}
                        {page === 1 && "1. Rules and Instructions"}
                        {page === 2 && (isIndividual ? "2. Applicant Information (Individual)" : "2. Applicant Information (Legal Entity)")}
                        {page === 3 && "3. Technology Park Area & Project Details"}
                        {page === 4 && "4. Acceptance and Application Statement"}
                        {page === 5 && "5. Additional Documents"}
                    </h2>
                    {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">{error}</div>}
                    {success && <div className="mt-4 p-3 bg-[#85BB65]/10 border border-[#85BB65]/50 text-[#85BB65] rounded-lg text-sm">{success}</div>}
                </div>

                <div className="space-y-6">
                    {/* PAGE 0: Applicant Type Selection */}
                    {page === 0 && (
                        <div className="space-y-8 animate-in fade-in duration-300 text-center py-8">
                            <h3 className="text-xl text-slate-300 mb-8">Are you applying as an Individual or a Legal Entity?</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                <button
                                    onClick={() => selectApplicantType('Individual')}
                                    className={`p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${formData.applicantType === 'Individual' ? 'border-[#85BB65] bg-[#85BB65]/10 shadow-lg shadow-[#85BB65]/20 scale-105' : 'border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'}`}
                                >
                                    <div className={`p-4 rounded-full ${formData.applicantType === 'Individual' ? 'bg-[#85BB65] text-[#0f1729]' : 'bg-slate-700 text-slate-300'}`}>
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <span className="text-xl font-bold">Individual</span>
                                    <span className="text-sm text-slate-400 font-medium">(Physical Person)</span>
                                </button>

                                <button
                                    onClick={() => selectApplicantType('Legal Entity')}
                                    className={`p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${formData.applicantType === 'Legal Entity' ? 'border-[#85BB65] bg-[#85BB65]/10 shadow-lg shadow-[#85BB65]/20 scale-105' : 'border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'}`}
                                >
                                    <div className={`p-4 rounded-full ${formData.applicantType === 'Legal Entity' ? 'bg-[#85BB65] text-[#0f1729]' : 'bg-slate-700 text-slate-300'}`}>
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    </div>
                                    <span className="text-xl font-bold">Legal Entity</span>
                                    <span className="text-sm text-slate-400 font-medium">(Company / Organization)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PAGE 1: Instructions */}
                    {page === 1 && (
                        <div className="prose prose-invert max-w-none leading-relaxed text-slate-300 animate-in fade-in duration-300">
                            <p>
                                Welcome to the Technology Park Resident Registration form. You are applying as:
                                <strong className="text-[#85BB65] ml-2 px-3 py-1 bg-[#85BB65]/10 rounded-full border border-[#85BB65]/30">{formData.applicantType}</strong>
                            </p>
                            <h3 className="text-white mt-6">Eligibility Criteria</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>The applicant must be engaged in innovation or high-tech projects.</li>
                                <li>The project must demonstrate potential for commercialization.</li>
                                <li>The applicant must comply with all national and local regulations regarding technology parks.</li>
                            </ul>
                            <h3 className="text-white mt-6">Submission Guidelines</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Ensure all provided information is accurate and verifiable.</li>
                                <li>Any false information will lead to immediate rejection of the application.</li>
                                <li>Required documents must be uploaded in valid formats (PDF, DOCX, JPG, PNG).</li>
                            </ul>
                            <p className="mt-6 text-sm text-slate-400 border-t border-slate-700/50 pt-4">
                                Please prepare all required information and press "Next Step" to continue. You can always hit "Save as Draft" at the bottom to return later.
                            </p>
                        </div>
                    )}

                    {/* PAGE 2: Applicant Info (DYNAMIC) */}
                    {page === 2 && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Shared Info */}
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-white">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {isIndividual ? "Full Name (First name, Last name, Patronymic) *" : "Full Legal Entity Name *"}
                                        </label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    </div>

                                    {isLegalEntity && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Registration Number *</label>
                                            <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Contact Phone *</label>
                                        <input type="text" name="contactPhones" value={formData.contactPhones} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    </div>
                                    <div className={isLegalEntity ? "" : "md:col-span-2"}>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Website (optional)</label>
                                        <input type="url" name="website" value={formData.website} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    </div>
                                </div>
                            </div>

                            {/* Individual Specifics */}
                            {isIndividual && (
                                <div className="pt-6 border-t border-slate-700/50">
                                    <h3 className="text-xl font-semibold mb-4 text-white">ID Document Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">ID Series *</label>
                                            <input type="text" name="idSeries" value={formData.idSeries} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">ID Number *</label>
                                            <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Issue Date</label>
                                            <input type="date" name="issueDate" value={formData.issueDate} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65] [color-scheme:dark]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Issuing Authority</label>
                                            <input type="text" name="issuingAuthority" value={formData.issuingAuthority} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Tax Registration Certificate Details</label>
                                            <textarea name="taxDetails" value={formData.taxDetails} onChange={handleInput} rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]"></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Legal Entity Specifics: Rep section */}
                            {isLegalEntity && (
                                <div className="pt-6 border-t border-slate-700/50">
                                    <h3 className="text-xl font-semibold mb-4 text-white">Authorized Representative Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                            <input type="text" name="repFullName" value={formData.repFullName} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                                            <input type="text" name="repPhone" value={formData.repPhone} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                                            <input type="text" name="repAddress" value={formData.repAddress} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                            <input type="email" name="repEmail" value={formData.repEmail} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">ID Document Details (Series, number, issue date, issuing authority)</label>
                                            <textarea name="repIdDetails" value={formData.repIdDetails} onChange={handleInput} rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]"></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Shared: Business Activity */}
                            <div className="pt-6 border-t border-slate-700/50">
                                <h3 className="text-xl font-semibold mb-4 text-white">Business Activity</h3>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Activity Type *</label>
                                    <textarea name="currentActivity" value={formData.currentActivity} onChange={handleInput} rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]"></textarea>
                                </div>

                                <label className="block text-sm font-medium text-slate-300 mb-2">Required Licenses (if any)</label>
                                <div className="space-y-3 mb-4">
                                    {formData.specialLicenses.map((lic, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-4 bg-slate-800 p-4 rounded-xl items-center relative border border-slate-700">
                                            <div className="flex-1 text-sm"><span className="text-slate-400">Name:</span> {lic.name}</div>
                                            <div className="flex-1 text-sm"><span className="text-slate-400">Issued:</span> {lic.issueDate}</div>
                                            <div className="flex-1 text-sm"><span className="text-slate-400">Validity:</span> {lic.validity}</div>
                                            <button type="button" onClick={() => removeLicense(idx)} className="text-red-400 hover:text-red-300 p-2">✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input type="text" placeholder="License Name" value={newLicense.name} onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    <input type="text" placeholder="Issue Date" value={newLicense.issueDate} onChange={(e) => setNewLicense({ ...newLicense, issueDate: e.target.value })} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    <input type="text" placeholder="Validity Period" value={newLicense.validity} onChange={(e) => setNewLicense({ ...newLicense, validity: e.target.value })} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                    <button type="button" onClick={addLicense} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-semibold transition-colors text-white whitespace-nowrap">Add</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 3 */}
                    {page === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-xl font-semibold text-white border-b border-slate-700/50 pb-4">Technology Park Area Needed</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Total Area (m²)</label>
                                    <input type="number" name="totalArea" value={formData.totalArea} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Building Area (m²)</label>
                                    <input type="number" name="buildingArea" value={formData.buildingArea} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Office Area (m²)</label>
                                    <input type="number" name="officeArea" value={formData.officeArea} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Laboratory Area (m²)</label>
                                    <input type="number" name="laboratoryArea" value={formData.laboratoryArea} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Warehouse Area (m²)</label>
                                    <input type="number" name="warehouseArea" value={formData.warehouseArea} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Warehouse Vol. (m³)</label>
                                    <input type="number" name="warehouseVolume" value={formData.warehouseVolume} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Auxiliary Area (m²)</label>
                                    <input type="number" name="auxiliaryArea" value={formData.auxiliaryArea} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Other Areas (m²)</label>
                                    <input type="number" name="otherAreas" value={formData.otherAreas} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-white border-b border-slate-700/50 pb-4 pt-6">Innovation / High-Tech Project Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                                    <input type="text" name="projectName" value={formData.projectName} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Project Start Date</label>
                                    <input type="date" name="projectStartDate" value={formData.projectStartDate} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65] [color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Project Duration</label>
                                    <input type="text" name="projectDuration" placeholder="e.g. 24 months" value={formData.projectDuration} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">R&D / Prototype / Innovation Details *</label>
                                    <textarea name="projectDetails" value={formData.projectDetails} onChange={handleInput} rows="3" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">New Jobs Created (Type and Number)</label>
                                    <input type="text" name="newJobsCreated" value={formData.newJobsCreated} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Patent / IP Information</label>
                                    <input type="text" name="patentInfo" value={formData.patentInfo} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Short Project Description</label>
                                    <textarea name="shortDescription" value={formData.shortDescription} onChange={handleInput} rows="3" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]"></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 4 */}
                    {page === 4 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-inner">
                                <label className="flex items-start gap-4 cursor-pointer">
                                    <div className="flex-shrink-0 mt-1">
                                        <input type="checkbox" name="accepted" checked={formData.accepted} onChange={handleInput} className="w-5 h-5 rounded border-slate-600 text-[#85BB65] focus:ring-[#85BB65] focus:ring-offset-slate-800" />
                                    </div>
                                    <span className="text-slate-200">
                                        I confirm that all information provided is correct and I allow the review committee to access the data for evaluation. *
                                    </span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Applicant Name (Legal Entity/Individual) *</label>
                                    <input type="text" name="applicantStatementName" value={formData.applicantStatementName} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Technology Park Name *</label>
                                    <input type="text" name="techParkName" value={formData.techParkName} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Submission Date *</label>
                                    <input type="date" name="submissionDate" value={formData.submissionDate} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#85BB65] [color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Digital Signature (Type Full Name)</label>
                                    <input type="text" name="digitalSignature" placeholder="John Doe" value={formData.digitalSignature} onChange={handleInput} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-[#85BB65] font-serif italic focus:outline-none focus:ring-2 focus:ring-[#85BB65]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 5: Documents (DYNAMIC) */}
                    {page === 5 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <p className="text-slate-400 text-sm mb-6">Please upload the required documentation. Supported formats: PDF, DOCX, JPG, PNG.</p>

                            <div className="space-y-4">

                                {isLegalEntity && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">State registry extract</label>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'legalEntityExtract')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Charter / statutes</label>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'charterStatutes')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Authorized representative ID copy</label>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'repIdDocument')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                        </div>
                                    </>
                                )}

                                {isIndividual && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">ID document copy</label>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'individualIdDocument')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Tax registration certificate</label>
                                            <input type="file" onChange={(e) => handleFileChange(e, 'taxRegistrationCertificate')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Business plan / Innovation project plan</label>
                                    <input type="file" onChange={(e) => handleFileChange(e, 'projectPlan')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">License documents (if applicable)</label>
                                    <input type="file" onChange={(e) => handleFileChange(e, 'specialLicensesDoc')} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-[#85BB65] hover:file:bg-slate-700 transition cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation and Draft Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-slate-700/50 pt-6 gap-4">
                    <button
                        type="button"
                        onClick={prevPage}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full sm:w-auto"
                    >
                        Back
                    </button>

                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={(e) => submitForm(e, true)}
                            disabled={submitting}
                            className="px-6 py-3 bg-transparent hover:bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-xl font-semibold transition-colors w-full sm:w-auto shadow-inner"
                        >
                            {existingApp ? 'Update Draft' : 'Save as Draft'}
                        </button>

                        {page < 5 ? (
                            <button
                                type="button"
                                onClick={nextPage}
                                className="bg-[#85BB65] hover:bg-[#6FA84E] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg w-full sm:w-auto shadow-[#85BB65]/20"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => submitForm(e, false)}
                                disabled={submitting}
                                className={`px-8 py-3 rounded-xl font-bold transition-colors shadow-lg w-full sm:w-auto ${submitting ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-[#85BB65] hover:bg-[#6FA84E] text-white shadow-[#85BB65]/20'}`}
                            >
                                {submitting ? 'Submitting...' : 'Submit Form'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <RegistrationChatbot />
        </div>
    );
}
