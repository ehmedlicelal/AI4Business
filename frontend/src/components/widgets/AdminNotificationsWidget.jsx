import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminNotificationsWidget() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        setLoading(true);
        // Fetch all unread business creation requests
        const { data, error } = await supabase
            .from('admin_notifications')
            .select('*, profiles(full_name)')
            .eq('type', 'Business Creation')
            .eq('status', 'Unread')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    }

    async function handleAction(notificationId, isApprove) {
        try {
            // First mark notification as Read
            const { data: notif, error: err1 } = await supabase
                .from('admin_notifications')
                .update({ status: 'Read' })
                .eq('id', notificationId)
                .select()
                .single();

            if (err1) throw err1;

            // Extract business name from message (Assumes message format "User X requested to create a business: Y")
            const msgParts = notif.message.split('business: ');
            const businessName = msgParts.length > 1 ? msgParts[1] : null;

            if (businessName) {
                // Find pending business with this name and user 
                const { data: bus, error: err2 } = await supabase
                    .from('businesses')
                    .select('id')
                    .eq('name', businessName)
                    .eq('created_by', notif.user_id)
                    .eq('status', 'Pending')
                    .single();

                if (bus && !err2) {
                    const newStatus = isApprove ? 'Approved' : 'Rejected';
                    await supabase.from('businesses').update({ status: newStatus }).eq('id', bus.id);
                }
            }

            fetchNotifications();
            alert(`Business request ${isApprove ? 'approved' : 'rejected'}!`);
        } catch (error) {
            alert('Error updating business: ' + error.message);
        }
    }

    return (
        <div className="bg-[#1A2238] rounded-2xl border border-orange-500/30 p-6 shadow-xl h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>🔔</span> Action Items
                    </h3>
                    <p className="text-sm text-gray-400">Business creation requests</p>
                </div>
                {notifications.length > 0 && (
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">
                        {notifications.length}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 relative z-10">
                {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700/50 rounded-xl">
                        No pending business requests.
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className="p-4 bg-white/5 rounded-xl border border-orange-500/30 hover:bg-white/10 transition-colors">
                            <p className="text-sm text-white mb-3">
                                <strong className="text-orange-400">{notif.profiles?.full_name || 'User'}</strong> wants to create a new business.
                                <br />
                                <span className="text-gray-400 text-xs mt-1 block tracking-wide">{notif.message}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(notif.id, true)}
                                    className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold rounded-lg text-sm transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction(notif.id, false)}
                                    className="flex-1 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 font-bold rounded-lg text-sm transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
