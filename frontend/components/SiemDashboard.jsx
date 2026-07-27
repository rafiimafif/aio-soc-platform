import { useState } from 'react';
import { ShieldAlert, Activity, BarChart2, AlertTriangle, Clock, Terminal, Filter, Check, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Papa from 'papaparse';
import { MOCK_HEATMAP_DATA, EVENT_TYPES, getSeverityBgColor } from '../utils/data';

export function SiemDashboard({ events, setEvents, incidents, unackCriticalCount }) {
  const [siemFilter, setSiemFilter] = useState({ severity: 'All', type: 'All', ip: '' });

  const toggleAck = (id) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'Acknowledged' ? 'Unacknowledged' : 'Acknowledged' } : e));
  };

  const filteredEvents = events.filter(e => {
    const matchSev = siemFilter.severity === 'All' || e.severity === siemFilter.severity;
    const matchType = siemFilter.type === 'All' || e.type === siemFilter.type;
    const matchIp = e.srcIp.includes(siemFilter.ip) || e.dstIp.includes(siemFilter.ip);
    return matchSev && matchType && matchIp;
  });

  const handleLogUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedEvents = results.data.map((row, i) => ({
          id: `REAL-${i}`,
          timestamp: row.timestamp || new Date().toISOString(),
          srcIp: row.srcIp || 'Unknown',
          dstIp: row.dstIp || 'Unknown',
          type: row.type || 'Parsed Log',
          severity: row.severity || 'Low',
          status: 'Unacknowledged'
        }));
        setEvents(parsedEvents);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events (24h)', value: '142,509', icon: Activity, color: 'text-soc-cyan' },
          { label: 'Critical Alerts', value: unackCriticalCount, icon: AlertTriangle, color: 'text-soc-red' },
          { label: 'Active Incidents', value: incidents.filter(i => i.status !== 'Resolved').length, icon: ShieldAlert, color: 'text-soc-orange' },
          { label: 'MTTD', value: '14.2 min', icon: Clock, color: 'text-soc-green' },
        ].map((kpi, i) => (
          <div key={i} className="bg-soc-card border border-soc-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{kpi.label}</p>
              <p className="text-3xl font-bold mt-1 text-white">{kpi.value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-gray-800 ${kpi.color}`}>
              <kpi.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-soc-card border border-soc-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-soc-cyan" />
          24-Hour Event Heatmap
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_HEATMAP_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#fff' }} />
              <Bar dataKey="Critical" stackId="a" fill="#ef4444" />
              <Bar dataKey="High" stackId="a" fill="#f97316" />
              <Bar dataKey="Medium" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Low" stackId="a" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-soc-card border border-soc-border rounded-xl p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Terminal size={20} className="text-soc-cyan" />
            Real-Time Event Feed
          </h3>
          <div className="flex gap-2 items-center">
            <label className="cursor-pointer bg-soc-cyan/10 hover:bg-soc-cyan/20 text-soc-cyan border border-soc-cyan/30 px-3 py-1 rounded text-sm font-bold flex items-center gap-2 transition-colors">
              <Upload size={14} /> Ingest Logs (CSV)
              <input type="file" className="hidden" accept=".csv" onChange={handleLogUpload} />
            </label>
            <Filter size={16} className="text-gray-400 ml-2" />
            <select className="bg-gray-900 border border-soc-border rounded px-2 py-1 text-sm focus:outline-none focus:border-soc-cyan"
              value={siemFilter.severity} onChange={e => setSiemFilter(f => ({ ...f, severity: e.target.value }))}>
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select className="bg-gray-900 border border-soc-border rounded px-2 py-1 text-sm focus:outline-none focus:border-soc-cyan"
              value={siemFilter.type} onChange={e => setSiemFilter(f => ({ ...f, type: e.target.value }))}>
              <option value="All">All Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Filter IP..." 
              className="bg-gray-900 border border-soc-border rounded px-2 py-1 text-sm focus:outline-none focus:border-soc-cyan w-32 font-mono"
              value={siemFilter.ip}
              onChange={e => setSiemFilter(f => ({ ...f, ip: e.target.value }))}
            />
          </div>
        </div>
        <div className="overflow-auto border border-soc-border rounded-lg bg-gray-900 flex-1 max-h-96">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-800 sticky top-0 z-10 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">Source IP</th>
                <th className="p-3 font-medium">Destination IP</th>
                <th className="p-3 font-medium">Event Type</th>
                <th className="p-3 font-medium">Severity</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border">
              {filteredEvents.map(evt => (
                <tr key={evt.id} 
                    onClick={() => toggleAck(evt.id)}
                    className={`cursor-pointer hover:bg-gray-800 transition-colors ${evt.status === 'Acknowledged' ? 'opacity-50' : ''}`}>
                  <td className="p-3 font-mono text-gray-400">{evt.timestamp?.split('T')[1]?.split('.')[0]}</td>
                  <td className="p-3 font-mono text-soc-cyan">{evt.srcIp}</td>
                  <td className="p-3 font-mono">{evt.dstIp}</td>
                  <td className="p-3">{evt.type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBgColor(evt.severity)}`}>
                      {evt.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    {evt.status === 'Acknowledged' ? 
                      <span className="flex items-center gap-1 text-soc-green line-through"><Check size={14}/> Ack</span> : 
                      <span className="text-gray-400">Unacknowledged</span>
                    }
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No events match filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
