import * as XLSX from 'xlsx';
import type { Conversation } from '@/types/conversations';

export const exportConversationsToExcel = (conversations: Conversation[], filename: string = 'conversations') => {
  const data = conversations.map(conv => ({
    'Customer Name': conv.customerName || 'N/A',
    'Phone': conv.customerPhone || 'N/A',
    'Email': conv.customerEmail || 'N/A',
    'Status': conv.status || 'N/A',
    'Lead Quality': conv.leadQuality || 'N/A',
    'Lead Score': conv.leadScore || 0,
    'Intent': conv.intent || 'N/A',
    'Budget': conv.budget || 'N/A',
    'Property Type': conv.propertyType || 'N/A',
    'Preferred Area': conv.preferredArea || 'N/A',
    'Assigned Agent': conv.assignedAgent || 'Unassigned',
    'Start Time': conv.startTime ? new Date(conv.startTime).toLocaleString() : 'N/A',
    'Duration (mins)': conv.durationMinutes || 0,
    'Follow-up Date': conv.followUpDate ? new Date(conv.followUpDate).toLocaleString() : 'N/A',
    'Tags': Array.isArray(conv.tags) ? conv.tags.join(', ') : '',
    'Notes': conv.notes || '',
    'Last Message': conv.lastMessageSnippet || '',
    'Outcome': conv.outcome || 'Pending',
    'Conversion Value': conv.conversionValue || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Customer Name
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 12 }, // Status
    { wch: 12 }, // Lead Quality
    { wch: 10 }, // Lead Score
    { wch: 10 }, // Intent
    { wch: 15 }, // Budget
    { wch: 15 }, // Property Type
    { wch: 20 }, // Preferred Area
    { wch: 15 }, // Assigned Agent
    { wch: 20 }, // Start Time
    { wch: 12 }, // Duration
    { wch: 20 }, // Follow-up Date
    { wch: 30 }, // Tags
    { wch: 40 }, // Notes
    { wch: 50 }, // Last Message
    { wch: 15 }, // Outcome
    { wch: 15 }, // Conversion Value
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conversations');

  XLSX.writeFile(workbook, `${filename}-${Date.now()}.xlsx`);
};

export const exportConversationsToCSV = (conversations: Conversation[], filename: string = 'conversations') => {
  const data = conversations.map(conv => ({
    'Customer Name': conv.customerName || 'N/A',
    'Phone': conv.customerPhone || 'N/A',
    'Email': conv.customerEmail || 'N/A',
    'Status': conv.status || 'N/A',
    'Lead Quality': conv.leadQuality || 'N/A',
    'Lead Score': conv.leadScore || 0,
    'Intent': conv.intent || 'N/A',
    'Budget': conv.budget || 'N/A',
    'Property Type': conv.propertyType || 'N/A',
    'Preferred Area': conv.preferredArea || 'N/A',
    'Assigned Agent': conv.assignedAgent || 'Unassigned',
    'Start Time': conv.startTime ? new Date(conv.startTime).toLocaleString() : 'N/A',
    'Duration (mins)': conv.durationMinutes || 0,
    'Follow-up Date': conv.followUpDate ? new Date(conv.followUpDate).toLocaleString() : 'N/A',
    'Tags': Array.isArray(conv.tags) ? conv.tags.join(', ') : '',
    'Notes': conv.notes || '',
    'Last Message': conv.lastMessageSnippet || '',
    'Outcome': conv.outcome || 'Pending',
    'Conversion Value': conv.conversionValue || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportConversationsToPDF = async (conversations: Conversation[], filename: string = 'conversations') => {
  // For PDF export, we'll create a simple HTML table and use the browser's print functionality
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Conversations Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #DC2626; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #DC2626; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .hot { color: #DC2626; font-weight: bold; }
        .warm { color: #F59E0B; font-weight: bold; }
        .cold { color: #3B82F6; }
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>Conversation Intelligence Hub - Export</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Total Conversations: ${conversations.length}</p>
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Lead Quality</th>
            <th>Score</th>
            <th>Intent</th>
            <th>Property Type</th>
            <th>Area</th>
            <th>Budget</th>
            <th>Agent</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${conversations.map(conv => `
            <tr>
              <td>${conv.customerName || 'N/A'}</td>
              <td>${conv.customerPhone || ''}<br/>${conv.customerEmail || ''}</td>
              <td>${conv.status || 'N/A'}</td>
              <td class="${conv.leadQuality}">${conv.leadQuality || 'N/A'}</td>
              <td>${conv.leadScore || 0}</td>
              <td>${conv.intent || 'N/A'}</td>
              <td>${conv.propertyType || 'N/A'}</td>
              <td>${conv.preferredArea || 'N/A'}</td>
              <td>${conv.budget || 'N/A'}</td>
              <td>${conv.assignedAgent || 'Unassigned'}</td>
              <td>${conv.startTime ? new Date(conv.startTime).toLocaleDateString() : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
