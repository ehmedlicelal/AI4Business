import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function BusinessWidget() {
    const { user } = useAuth();
    const [myBusinesses, setMyBusinesses] = useState([]);
    const [businessName, setBusinessName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchBusinesses();
        }
    }, [user?.id]);

    async function fetchBusinesses() {
        setLoading(true);
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMyBusinesses(data);
        }
        setLoading(false);
    }

    async function handleRequestBusiness(e) {
        e.preventDefault();
        if (!businessName) {
            alert('Please enter a Business Name before requesting.');
            return;
        }

        try {
            // Create Business as Pending
            const { data: bData, error: bError } = await supabase
                .from('businesses')
                .insert([{ name: businessName, created_by: user.id, status: 'Pending' }])
                .select()
                .single();

            if (bError) throw bError;

            // Notify Admin
            const { error: notifyError } = await supabase
                .from('admin_notifications')
                .insert([{
                    user_id: user.id,
                    type: 'Business Creation',
                    message: `User ${user.user_metadata?.full_name || user.email} requested to create a business: ${businessName}`,
                    status: 'Unread'
                }]);

            if (notifyError) throw notifyError;

            alert('Business creation request sent to Admin!');
            setBusinessName('');
            fetchBusinesses();
        } catch (err) {
            alert('Failed to request business: ' + err.message);
        }
    }

    return (
        <div className="bg-[#1A2238] rounded-2xl border border-white/10 p-6 shadow-xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">My Businesses</h3>
                    <p className="text-sm text-gray-400">Manage your business profiles</p>
                </div>
                <div className="px-3 py-1 bg-[#85BB65]/10 rounded-full text-[#85BB65] text-sm font-semibold">
                    {myBusinesses.length} Total
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
                {myBusinesses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700/50 rounded-xl">
                        No businesses found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myBusinesses.map(bus => (
                            <div key={bus.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <h4 className="font-bold text-white">{bus.name}</h4>
                                    <p className="text-xs text-gray-400">Created: {new Date(bus.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${bus.status === 'Approved' ? 'bg-[#85BB65]/20 text-[#85BB65]' :
                                        bus.status === 'Pending' ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'
                                        }`}>
                                        {bus.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-auto">
                <form onSubmit={handleRequestBusiness} className="flex gap-2">
                    <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="New Business Name"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#85BB65]"
                        required
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[#85BB65] hover:bg-[#74a856] text-[#0f1729] font-bold rounded-lg transition-colors"
                    >
                        Request
                    </button>
                </form>
            </div>
        </div>
    );
}
