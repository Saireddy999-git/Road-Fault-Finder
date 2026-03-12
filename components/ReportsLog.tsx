
import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Search, Download, Table, User, Filter, Calendar, AlertCircle } from 'lucide-react';
import { Violation } from '../types';
import { formatDateTime, exportToCSV } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ReportsLog: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadViolations();
  }, []);

  const loadViolations = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      // Removed the join to profiles to avoid foreign key/missing row issues
      const { data, error } = await supabase
        .from('violations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

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
          detectedBy: 'Officer', // Fallback since we removed the join
          officerId: row.scanned_by
        }));
        setViolations(formattedViolations);
      }
    } catch (error: any) {
      console.error("Error loading violations:", error);
      setErrorMsg(error.message || "An unknown error occurred while fetching data.");
      toast.error("Failed to load data logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const matchesSearch = 
        v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.detectedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.officerId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(v.timestamp) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(v.timestamp) <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [violations, searchTerm, statusFilter, dateRange]);

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Failed to load data logs</h3>
            <p className="text-sm mt-1 opacity-90">{errorMsg}</p>
            <button 
              onClick={loadViolations}
              className="mt-2 text-xs font-bold underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by vehicle, officer name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition dark:text-white"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-10 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-sm focus:outline-none dark:text-white"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-sm focus:outline-none dark:text-white"
            />
          </div>
        </div>
        
        <button 
          onClick={() => exportToCSV(filteredViolations)}
          className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition shadow-sm whitespace-nowrap"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Log ID</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Timestamp</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 w-64">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Officer Login Details
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Vehicle No.</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Violation Type</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Status</th>
                <th className="px-4 py-3">Loc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading data logs...
                  </td>
                </tr>
              ) : filteredViolations.length > 0 ? filteredViolations.map((v, idx) => (
                <tr 
                  key={v.id} 
                  className={`
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
                    ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}
                  `}
                >
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 font-mono text-slate-500 text-xs">{v.id.substring(0, 8)}</td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateTime(v.timestamp)}</td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{v.detectedBy}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {v.officerId || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 font-bold font-mono text-slate-800 dark:text-slate-200">{v.vehicleNumber}</td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">{v.violationType}</td>
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">
                    <span className={`
                      px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                      ${v.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50' : 
                        v.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50' : 
                        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}
                    `}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[100px]" title={v.location}>{v.location || 'Unit 04'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                    No log records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          * This sheet contains confidential officer login details. Handle with care.
        </p>
      </div>
    </div>
  );
};

export default ReportsLog;
