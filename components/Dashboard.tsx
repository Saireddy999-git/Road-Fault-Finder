import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LogOut, User as UserIcon, Calendar, Activity, Briefcase, MapPin, 
  Pencil, ShieldAlert, CheckCircle, UploadCloud, FileText, AlertTriangle, FileVideo,
  X, Check, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardProps {
  onLogout: () => void;
  onNavigate?: (tab: 'dashboard' | 'upload' | 'history' | 'reports' | 'admin') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigate }) => {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const [stats, setStats] = useState({
    reported: 0,
    resolved: 0,
    uploads: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
    occupation: '',
    location: '',
    habits_interests: ''
  });

  // Quick Actions State
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUser(user);

        // Fetch profile to get full name and other details
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const name = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
        setDisplayName(name);

        setProfileData({
          full_name: name,
          gender: profile?.gender || user?.user_metadata?.gender || '',
          date_of_birth: profile?.date_of_birth || user?.user_metadata?.dob || '',
          occupation: profile?.occupation || user?.user_metadata?.occupation || '',
          location: profile?.location || user?.user_metadata?.location || '',
          habits_interests: profile?.habits_interests || profile?.habits?.join(', ') || user?.user_metadata?.habits || ''
        });

        await loadStats(user.id);

      } catch (err) {
        console.error("Failed to fetch user or stats", err);
        setIsLoadingStats(false);
      }
    };
    fetchUserAndStats();
  }, []);

  const loadStats = async (userId: string) => {
    setIsLoadingStats(true);
    try {
      // Violations Reported
      const { count: reportedCount } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('scanned_by', userId);

      // Cases Resolved
      const { count: resolvedCount } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('scanned_by', userId)
        .eq('status', 'verified');

      // Media Uploads
      const { count: uploadsCount } = await supabase
        .from('violations')
        .select('*', { count: 'exact', head: true })
        .eq('scanned_by', userId)
        .not('media_url', 'is', null);

      setStats({
        reported: reportedCount || 0,
        resolved: resolvedCount || 0,
        uploads: uploadsCount || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'violations',
          filter: `scanned_by=eq.${user.id}`
        },
        () => {
          loadStats(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const payload: any = { 
        id: user.id, 
        full_name: profileData.full_name,
        gender: profileData.gender, 
        date_of_birth: profileData.date_of_birth, 
        occupation: profileData.occupation, 
        location: profileData.location, 
        updated_at: new Date().toISOString() 
      };

      // Try with all fields first
      let { error } = await supabase
        .from('profiles')
        .upsert({ 
          ...payload,
          habits_interests: profileData.habits_interests, 
        });

      // If it fails because of missing columns, retry with basic payload
      if (error && error.message.includes('Could not find the')) {
        console.warn('Some columns missing in schema, retrying with basic payload...', error);
        const { error: retryError } = await supabase
          .from('profiles')
          .upsert(payload);
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }

      // Re-fetch profile to update display
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (updatedProfile) {
        setProfileData({
          full_name: updatedProfile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          gender: updatedProfile.gender || '',
          date_of_birth: updatedProfile.date_of_birth || '',
          occupation: updatedProfile.occupation || '',
          location: updatedProfile.location || '',
          habits_interests: updatedProfile.habits_interests || updatedProfile.habits?.join(', ') || ''
        });
        setDisplayName(updatedProfile.full_name || user?.email?.split('@')[0] || 'User');
      }

      setIsEditingProfile(false);
      toast.success('Profile updated successfully ✓');
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleQuickAction = (action: 'upload' | 'history' | 'reports') => {
    if (onNavigate) {
      setNavigatingTo(action);
      // Small delay to show spinner
      setTimeout(() => {
        onNavigate(action);
        setNavigatingTo(null);
      }, 300);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingMedia(true);
    const toastId = toast.loading('Uploading media...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('violation-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Optionally create a violation record for the uploaded media
      const { data: publicUrlData } = supabase.storage
        .from('violation-media')
        .getPublicUrl(filePath);

      await supabase.from('violations').insert({
        scanned_by: user.id,
        media_url: publicUrlData.publicUrl,
        vehicle_number: 'PENDING',
        violation_type: 'Unclassified',
        status: 'pending'
      });

      toast.success('Media uploaded successfully', { id: toastId });
      // Stats will update automatically via realtime subscription
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload media', { id: toastId });
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-2xl border border-white/10">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[120%] bg-purple-500/20 blur-[120px] rounded-full mix-blend-screen"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </div>

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 z-10">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-6 text-center md:text-left">
              {/* Avatar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 flex items-center justify-center shadow-xl ring-4 ring-white/10">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-bold text-white tracking-wider">
                    {initials}
                  </div>
                </div>
              </div>
              
              {/* Welcome Text */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  Welcome back, {displayName}
                </h1>
                <p className="text-blue-200/80 font-medium flex items-center justify-center md:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {user.email}
                </p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Quick Stats Row */}
          <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-blue-200/70 font-medium">Violations Reported</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{stats.reported}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-blue-200/70 font-medium">Cases Resolved</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{stats.resolved}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-blue-200/70 font-medium">Media Uploads</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{stats.uploads}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Details Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:border-slate-700">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Profile Information
                </h2>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      disabled={isSavingProfile}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name (Only visible in edit mode here, otherwise in header) */}
                {isEditingProfile && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 md:col-span-2">
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
                      <input 
                        type="text" 
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Gender</p>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileData.gender}
                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Male, Female, Other"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{profileData.gender || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Date of Birth</p>
                    {isEditingProfile ? (
                      <input 
                        type="date" 
                        value={profileData.date_of_birth}
                        onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{profileData.date_of_birth || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Occupation</p>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileData.occupation}
                        onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Software Engineer"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{profileData.occupation || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Location</p>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. New York, USA"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{profileData.location || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group md:col-span-2">
                  <div className="bg-rose-100 dark:bg-rose-900/40 p-3 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Habits & Interests</p>
                    {isEditingProfile ? (
                      <textarea 
                        value={profileData.habits_interests}
                        onChange={(e) => setProfileData({...profileData, habits_interests: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="e.g. Reading, Cycling, Photography"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{profileData.habits_interests || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Quick Actions</h2>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleQuickAction('history')}
                disabled={navigatingTo !== null}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Report Violation</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submit a new incident</p>
                  </div>
                </div>
                {navigatingTo === 'history' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*" 
                onChange={handleMediaUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-100 dark:border-slate-700/50 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Upload Media</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Process dashcam footage</p>
                  </div>
                </div>
                {isUploadingMedia && <Loader2 className="w-5 h-5 animate-spin text-purple-500" />}
              </button>

              <button 
                onClick={() => handleQuickAction('reports')}
                disabled={navigatingTo !== null}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200">View Logs</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Check recent activity</p>
                  </div>
                </div>
                {navigatingTo === 'reports' && <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
