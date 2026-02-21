import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export default function TechParkRequestsWidget() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await apiFetch('/api/tech-park/all');

            // Note: apiFetch already parses JSON and throws if response.ok is false
            setApplications(response.data || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleStatusChange = async (e, id) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        try {
            const response = await apiFetch(`/api/tech-park/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            // Note: apiFetch throws if !response.ok
            // Update local state to reflect change without refetching immediately
            setApplications(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex justify-center items-center backdrop-blur-sm shadow-xl min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#85BB65]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
                <p className="text-red-400">Error loading applications: {error}</p>
                <button onClick={fetchApplications} className="mt-4 text-sm text-[#85BB65] hover:underline">Try Again</button>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-xl backdrop-blur-sm flex flex-col h-full max-h-[600px]">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#85BB65]/10 rounded-lg">
                        <svg className="w-5 h-5 text-[#85BB65]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Tech Park Requests</h3>
                </div>
                <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">{applications.length} Total</span>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                {applications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p>No recent applications found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-slate-900/40 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors">
                                <div
                                    className="p-4 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                    onClick={() => toggleExpand(app.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-white truncate max-w-[200px]" title={app.project_name}>{app.project_name}</h4>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                                {app.applicant_type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 truncate max-w-[250px]" title={app.full_name}>{app.full_name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                        <select
                                            value={app.status}
                                            onChange={(e) => handleStatusChange(e, app.id)}
                                            className={`text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-800 border-none cursor-pointer
                                                ${app.status === 'Draft' ? 'text-yellow-400' :
                                                    app.status === 'Pending' ? 'text-blue-400 bg-blue-400/10' :
                                                        app.status === 'Under Review' ? 'text-purple-400 bg-purple-400/10' :
                                                            app.status === 'Approved' ? 'text-[#85BB65] bg-[#85BB65]/10' :
                                                                app.status === 'Requires Revision' ? 'text-orange-400 bg-orange-400/10' :
                                                                    'text-red-400 bg-red-400/10'}`}
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Under Review">Under Review</option>
                                            <option value="Requires Revision">Req. Revision</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>

                                        <div className="text-slate-400 p-1">
                                            <svg className={`w-4 h-4 transition-transform duration-200 ${expandedId === app.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {expandedId === app.id && (
                                    <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 text-sm space-y-6">

                                        {/* General Information */}
                                        <div>
                                            <h5 className="text-[#85BB65] font-semibold border-b border-[#85BB65]/30 pb-1 mb-3 uppercase tracking-wide text-xs">General Information</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Applicant Name</span><span className="text-white">{app.full_name || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Contact Phones</span><span className="text-white">{app.contact_phones || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Email</span><span className="text-white">{app.email || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Website</span><span className="text-white">{app.website || '-'}</span></div>

                                                {app.applicant_type === 'Individual' ? (
                                                    <>
                                                        <div><span className="text-slate-500 block text-[10px] uppercase">ID Series</span><span className="text-white">{app.id_series || '-'}</span></div>
                                                        <div><span className="text-slate-500 block text-[10px] uppercase">ID Number</span><span className="text-white">{app.id_number || '-'}</span></div>
                                                        <div><span className="text-slate-500 block text-[10px] uppercase">Issue Date</span><span className="text-white">{app.issue_date ? new Date(app.issue_date).toLocaleDateString() : '-'}</span></div>
                                                        <div><span className="text-slate-500 block text-[10px] uppercase">Issuing Auth.</span><span className="text-white">{app.issuing_authority || '-'}</span></div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div><span className="text-slate-500 block text-[10px] uppercase">Tax Details (VÖEN)</span><span className="text-white">{app.tax_details || '-'}</span></div>
                                                        <div className="sm:col-span-2"><span className="text-slate-500 block text-[10px] uppercase">Registration Number</span><span className="text-white">{app.registration_number || '-'}</span></div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Representative Details (Legal Entity Only) */}
                                        {app.applicant_type !== 'Individual' && (
                                            <div>
                                                <h5 className="text-[#85BB65] font-semibold border-b border-[#85BB65]/30 pb-1 mb-3 uppercase tracking-wide text-xs">Authorized Representative</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div><span className="text-slate-500 block text-[10px] uppercase">Full Name</span><span className="text-white">{app.rep_full_name || '-'}</span></div>
                                                    <div><span className="text-slate-500 block text-[10px] uppercase">Phone</span><span className="text-white">{app.rep_phone || '-'}</span></div>
                                                    <div><span className="text-slate-500 block text-[10px] uppercase">Email</span><span className="text-white">{app.rep_email || '-'}</span></div>
                                                    <div className="sm:col-span-2"><span className="text-slate-500 block text-[10px] uppercase">Address</span><span className="text-white">{app.rep_address || '-'}</span></div>
                                                    <div className="sm:col-span-1"><span className="text-slate-500 block text-[10px] uppercase">ID Details</span><span className="text-white">{app.rep_id_details || '-'}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity & Licensing */}
                                        <div>
                                            <h5 className="text-[#85BB65] font-semibold border-b border-[#85BB65]/30 pb-1 mb-3 uppercase tracking-wide text-xs">Activity & Licensing</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Current Activity</span><span className="text-white">{app.current_activity || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Special Licenses Required</span><span className="text-white">{app.special_licenses ? 'Yes' : 'No'}</span></div>
                                            </div>
                                        </div>

                                        {/* Infrastructure Requirements */}
                                        <div>
                                            <h5 className="text-[#85BB65] font-semibold border-b border-[#85BB65]/30 pb-1 mb-3 uppercase tracking-wide text-xs">Infrastructure Requirements (sqm)</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Total Area</span><span className="text-white font-medium">{app.total_area || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Building</span><span className="text-white font-medium">{app.building_area || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Office</span><span className="text-white font-medium">{app.office_area || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Warehouse</span><span className="text-white font-medium">{app.warehouse_area || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Warehouse Vol.</span><span className="text-white font-medium">{app.warehouse_volume || '-'} <span className="text-[10px] text-slate-500 normal-case">cu.m</span></span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Auxiliary</span><span className="text-white font-medium">{app.auxiliary_area || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Laboratory</span><span className="text-white font-medium">{app.laboratory_area || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Other</span><span className="text-white font-medium">{app.other_areas || '-'}</span></div>
                                            </div>
                                        </div>

                                        {/* Project Specifications */}
                                        <div>
                                            <h5 className="text-[#85BB65] font-semibold border-b border-[#85BB65]/30 pb-1 mb-3 uppercase tracking-wide text-xs">Project Specifications</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-500 block text-[10px] uppercase">Project Description</span><p className="text-white mt-1 text-sm bg-slate-900/30 p-2 rounded">{app.project_details || app.short_description || 'No description provided.'}</p></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Start Date</span><span className="text-white">{app.project_start_date ? new Date(app.project_start_date).toLocaleDateString() : '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Duration</span><span className="text-white">{app.project_duration || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">New Jobs</span><span className="text-white">{app.new_jobs_created || '-'}</span></div>
                                                <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-500 block text-[10px] uppercase">Patent Info</span><p className="text-white mt-1 text-sm">{app.patent_info || 'None'}</p></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Agreed Statement Name</span><span className="text-white">{app.applicant_statement_name || '-'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Digital Signature Info</span><span className="text-white">{app.digital_signature || 'Not provided'}</span></div>
                                                <div><span className="text-slate-500 block text-[10px] uppercase">Tech Park Name</span><span className="text-white">{app.tech_park_name || '-'}</span></div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <button className="text-xs text-[#85BB65] hover:text-[#6FA84E] underline flex items-center gap-1 font-semibold">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Download Submitted Documents
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(71, 85, 105, 0.8);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(100, 116, 139, 1);
                }
            `}</style>
        </div>
    );
}
