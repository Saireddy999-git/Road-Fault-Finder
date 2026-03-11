import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { LogOut, User as UserIcon, Calendar, Activity, Briefcase, MapPin } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      onLogout();
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { full_name, gender, dob, habits, occupation, location } = user.user_metadata || {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-8 text-white flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome, {full_name || 'User'}!</h1>
              <p className="text-blue-100">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Your Profile Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Gender</p>
                  <p className="text-slate-900 font-medium">{gender || 'Not specified'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Date of Birth</p>
                  <p className="text-slate-900 font-medium">{dob || 'Not specified'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Occupation</p>
                  <p className="text-slate-900 font-medium">{occupation || 'Not specified'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Location</p>
                  <p className="text-slate-900 font-medium">{location || 'Not specified'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 md:col-span-2">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Habits & Interests</p>
                  <p className="text-slate-900 font-medium">{habits || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
