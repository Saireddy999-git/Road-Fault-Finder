
import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Download, Table, User } from 'lucide-react';
import { Violation } from '../types';
import { STORAGE_KEY_VIOLATIONS } from '../constants';
import { formatDateTime, exportToCSV } from '../utils/helpers';

const ReportsLog: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadViolations = () => {
      const data = localStorage.getItem(STORAGE_KEY_VIOLATIONS);
      if (data) setViolations(JSON.parse(data));
    };
    loadViolations();
    window.addEventListener('storage', loadViolations);
    return () => window.removeEventListener('storage', loadViolations);
  }, []);

  const filteredViolations = violations.filter(v => 
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.detectedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.officerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        
        <button 
          onClick={() => exportToCSV(violations)}
          className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition shadow-sm"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Download Excel Sheet
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
              {filteredViolations.length > 0 ? filteredViolations.map((v, idx) => (
                <tr 
                  key={v.id} 
                  className={`
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
                    ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}
                  `}
                >
                  <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-800 font-mono text-slate-500 text-xs">{v.id}</td>
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
                      ${v.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200' : 
                        v.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
                        'bg-gray-100 text-gray-800 border-gray-200'}
                    `}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[100px]" title={v.location}>Unit 04</td>
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
