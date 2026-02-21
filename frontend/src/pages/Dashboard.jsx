import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FinanceWidget from '../components/widgets/FinanceWidget';
import InventoryWidget from '../components/widgets/InventoryWidget';
import TasksWidget from '../components/widgets/TasksWidget';
import BusinessWidget from '../components/widgets/BusinessWidget';
import AdminNotificationsWidget from '../components/widgets/AdminNotificationsWidget';
import TechParkRequestsWidget from '../components/widgets/TechParkRequestsWidget';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
    const { profile } = useAuth();
    const location = useLocation();
    const stateWorkspaceId = location.state?.workspaceId || null;
    const stateWorkspaceType = location.state?.workspaceType || null;

    const [workspaceId, setWorkspaceId] = useState(stateWorkspaceId || localStorage.getItem('ai4b_workspace_id') || null);
    const [workspaceType, setWorkspaceType] = useState(stateWorkspaceType || localStorage.getItem('ai4b_workspace_type') || null);

    const [workspaceName, setWorkspaceName] = useState('');

    // State for dashboard data
    // ...

    useEffect(() => {
        if (stateWorkspaceId && stateWorkspaceType) {
            setWorkspaceId(stateWorkspaceId);
            setWorkspaceType(stateWorkspaceType);
            localStorage.setItem('ai4b_workspace_id', stateWorkspaceId);
            localStorage.setItem('ai4b_workspace_type', stateWorkspaceType);
        }
    }, [stateWorkspaceId, stateWorkspaceType]);

    useEffect(() => {
        async function fetchWorkspaceDetails() {
            if (workspaceId && workspaceType) {
                const table = workspaceType === 'startup' ? 'startups' : 'businesses';
                const { data } = await supabase
                    .from(table)
                    .select('name')
                    .eq('id', workspaceId)
                    .single();
                if (data) setWorkspaceName(data.name);
            } else {
                setWorkspaceName('');
            }
        }
        fetchWorkspaceDetails();
    }, [workspaceId, workspaceType]);

    // Props to pass to widgets
    const widgetProps = {
        workspaceId,
        workspaceType
    };

    return (
        <div className="flex min-h-screen bg-[#0f1729]">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <BackButton />
                    </div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {workspaceName ? workspaceName : (profile?.role === 'Admin' ? 'Admin' : 'Manager') + ' Dashboard'}
                        {workspaceType && workspaceId && (
                            <span className={`text-sm font-normal px-3 py-1 rounded-full border ${workspaceType === 'startup' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                {workspaceType === 'startup' ? 'Startup Workspace' : 'Business Workspace'}
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Welcome back! Here's your {workspaceType ? 'workspace' : 'business'} overview.
                    </p>
                </div>

                {/* Content based on Route */}
                {/* Overview - Show All */}
                {(location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/dashboard/admin' || location.pathname === '/dashboard/manager' || location.pathname === '/dashboard/business') && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {profile?.role === 'Admin' && (
                            <>
                                <div className="xl:col-span-1">
                                    <AdminNotificationsWidget />
                                </div>
                                <div className="xl:col-span-1">
                                    <TechParkRequestsWidget />
                                </div>
                            </>
                        )}
                        <div className="xl:col-span-2">
                            <FinanceWidget {...widgetProps} />
                        </div>
                        <div className="xl:col-span-2">
                            <BusinessWidget {...widgetProps} />
                        </div>
                        <InventoryWidget {...widgetProps} />
                        <TasksWidget {...widgetProps} />
                    </div>
                )}

                {/* Individual Pages */}
                {location.pathname.includes('/finances') && (
                    <div className="max-w-5xl mx-auto">
                        <FinanceWidget {...widgetProps} />
                    </div>
                )}

                {location.pathname.includes('/inventory') && (
                    <div className="max-w-4xl mx-auto">
                        <InventoryWidget {...widgetProps} />
                    </div>
                )}

                {location.pathname.includes('/tasks') && (
                    <div className="max-w-3xl mx-auto">
                        <TasksWidget {...widgetProps} />
                    </div>
                )}

                {profile?.role === 'Admin' && location.pathname.includes('/tech-park') && (
                    <div className="max-w-5xl mx-auto h-[600px]">
                        <TechParkRequestsWidget />
                    </div>
                )}
            </main>
        </div>
    );
}
