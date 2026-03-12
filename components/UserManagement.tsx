
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, UserCheck, Shield, Trash2, X, Lock, Smartphone, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  system_id: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface UserManagementProps {
  isAdmin: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ isAdmin }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'team_member',
    system_id: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchUserAndStaff = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        await loadStaff();
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setStaff(data);
    } catch (error: any) {
      console.error("Error loading staff:", error);
      toast.error("Failed to load staff directory.");
    }
  };

  const handleDelete = async (staffMember: StaffMember) => {
    if (confirm(`Are you sure you want to remove ${staffMember.full_name} from the staff directory?`)) {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', staffMember.id);

        if (error) throw error;

        setStaff(prev => prev.filter(s => s.id !== staffMember.id));
        toast.success("Staff member removed successfully.");
      } catch (error: any) {
        console.error("Error deleting staff:", error);
        toast.error("Failed to remove staff member.");
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert({ 
          full_name: formData.full_name, 
          email: formData.email, 
          role: formData.role, 
          system_id: formData.system_id, 
          status: formData.status, 
          created_by: currentUser.id 
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setStaff([data, ...staff]);
      }
      
      setShowAddModal(false);
      setFormData({ full_name: '', email: '', role: 'team_member', system_id: '', status: 'active' });
      toast.success("Staff member registered successfully.");
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast.error(error.message || "Failed to register staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.system_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search staff members..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition dark:text-white"
          />
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition"
          >
            <UserPlus className="w-5 h-5" />
            Register Staff
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Staff Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">System ID</th>
              <th className="px-6 py-4">Status</th>
              {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading staff directory...
                </td>
              </tr>
            ) : filteredStaff.length > 0 ? filteredStaff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30 uppercase">
                      {member.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{member.full_name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${member.role === 'admin' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {member.system_id || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border
                    ${member.status === 'active' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                  `}>
                    {member.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(member)}
                      className="p-2 rounded-xl transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-20 text-center">
                  <UserIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Register New Staff
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition dark:text-white" disabled={isSubmitting}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Full Name" value={formData.full_name} onChange={v => setFormData({...formData, full_name: v})} icon={<UserIcon className="w-4 h-4" />} />
                <InputGroup label="System ID" value={formData.system_id} onChange={v => setFormData({...formData, system_id: v})} icon={<Smartphone className="w-4 h-4" />} />
              </div>
              <InputGroup label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} icon={<Mail className="w-4 h-4" />} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="team_member">Team Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-none mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Enroll Staff
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, icon: React.ReactNode, type?: string }> = ({ label, value, onChange, icon, type = 'text' }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        type={type} 
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
      />
    </div>
  </div>
);

export default UserManagement;
