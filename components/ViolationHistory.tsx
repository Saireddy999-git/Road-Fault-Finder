
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, FileDown, MoreVertical, Check, X, Eye, History } from 'lucide-react';
import { Violation, ViolationType } from '../types';
import { formatDateTime, exportToCSV } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ViolationHistoryProps {
  isAdmin: boolean;
}

const ViolationHistory: React.FC<ViolationHistoryProps> = ({ isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [violations, setViolations] = useState<Violation[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndViolations = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          setUserId(authData.user.id);
          await loadViolations(authData.user.id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndViolations();
  }, []);

  const loadViolations = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('violations')
        .select('*')
        .eq('scanned_by', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedViolations: Violation[] = data.map(row => ({
          id: row.id,
          vehicleNumber: row.vehicle_number,
          violationType: row.violation_type,
          timestamp: row.created_at,
          location: row.location,
          mediaUrl: row.media_url,
          status: row.status,
          confidence: 1,
          detectedBy: 'User',
          officerId: row.scanned_by
        }));
        setViolations(formattedViolations);
      }
    } catch (error: any) {
      console.error("Error loading violations:", error);
      toast.error("Failed to load violations.");
    }
  };

  useEffect(() => {
    // Real-time subscription temporarily removed as requested
  }, [userId]);

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const matchesSearch = v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || v.violationType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [violations, searchTerm, filterType]);

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('violations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Violation marked as ${status}`);
      // The real-time subscription will update the list, but we can also update optimistically
      setViolations(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by vehicle number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition dark:text-white"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm appearance-none focus:outline-none transition dark:text-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.values(ViolationType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => exportToCSV(violations)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Vehicle Details</th>
              <th className="px-6 py-4">Violation</th>
              <th className="px-6 py-4">Time & Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Confidence</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredViolations.length > 0 ? filteredViolations.map((violation) => (
              <tr key={violation.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {violation.mediaUrl ? (
                        <img src={violation.mediaUrl} alt="Vehicle" className="w-full h-full object-cover" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{violation.vehicleNumber}</p>
                      <p className="text-xs text-slate-400 italic">Plate # ID: {violation.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                    ${violation.violationType === ViolationType.RED_LIGHT 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}
                  `}>
                    {violation.violationType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateTime(violation.timestamp)}</p>
                  <p className="text-xs text-slate-400">{violation.location}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                    ${violation.status === 'verified' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 
                      violation.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30' : 
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}
                  `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      violation.status === 'verified' ? 'bg-green-500' : 
                      violation.status === 'rejected' ? 'bg-red-500' : 'bg-slate-400'
                    }`} />
                    {violation.status.charAt(0).toUpperCase() + violation.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                  {(violation.confidence * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {violation.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(violation.id, 'verified')}
                          className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition shadow-sm" 
                          title="Verify"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(violation.id, 'rejected')}
                          className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition shadow-sm" 
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button 
                      className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition shadow-sm flex items-center gap-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-semibold hidden sm:inline">Details</span>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <History className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-bold text-lg">No violation logs found</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                    Uploaded media that triggers a violation alert will appear here for review and verification.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViolationHistory;
