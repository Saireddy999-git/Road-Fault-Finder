
import { Violation } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const exportToCSV = (data: Violation[]) => {
  // Expanded headers to include login details
  const headers = [
    'Log ID', 
    'Officer Name', 
    'Officer Login ID', 
    'Vehicle Number', 
    'Violation Type', 
    'Timestamp', 
    'Location', 
    'Status', 
    'Confidence'
  ];
  
  const rows = data.map(v => [
    v.id,
    v.detectedBy,
    v.officerId || 'N/A', // Handle legacy data
    v.vehicleNumber,
    v.violationType,
    v.timestamp,
    v.location,
    v.status,
    (v.confidence * 100).toFixed(1) + '%'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  // Using .csv, but Excel opens this natively as a sheet
  link.setAttribute('download', `Violation_Log_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
