
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, UserCheck, Shield, Trash2, X, Lock, Smartphone, Mail, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { STORAGE_KEY_USERS } from '../constants';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: UserRole.TEAM_MEMBER
  });

  useEffect(() => {
    const loadUsers = () => {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      if (data) setUsers(JSON.parse(data));
    };
    loadUsers();
    window.addEventListener('storage', loadUsers);
    return () => window.removeEventListener('storage', loadUsers);
  }, []);

  const handleDelete = (id: string) => {
    if (id === 'admin') {
      alert("System Administrator cannot be deleted.");
      return;
    }
    if (confirm(`Remove access for ${id}?`)) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.id === formData.id)) {
      alert("Staff ID already enrolled.");
      return;
    }

    const updatedUsers = [...users, { ...formData }];
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    setShowAddModal(false);
    setFormData({ id: '', name: '', email: '', password: '', role: UserRole.TEAM_MEMBER });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
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
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition"
        >
          <UserPlus className="w-5 h-5" />
          Register Staff
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Staff Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">System ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.role === UserRole.ADMIN ? (
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider ${user.role === UserRole.ADMIN ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {user.id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === 'admin'}
                    className={`p-2 rounded-xl transition-all ${user.id === 'admin' ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <UserIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl relative border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Staff Registry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} icon={<UserIcon className="w-4 h-4" />} />
                <InputGroup label="System ID" value={formData.id} onChange={v => setFormData({...formData, id: v})} icon={<Smartphone className="w-4 h-4" />} />
              </div>
              <InputGroup label="Email" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} icon={<Mail className="w-4 h-4" />} />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Password" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} icon={<Lock className="w-4 h-4" />} />
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value={UserRole.TEAM_MEMBER}>Officer</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 dark:shadow-none mt-4">
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
