import React, { useState } from 'react';
import { FileText, Download, Copy, CheckCircle } from 'lucide-react';
import { MOCK_ANALYSTS } from '../utils/data';
import { getRandomSecure } from '../utils/crypto';

export function ReportGenerator({ incidents }) {
  const defaultIncidentId = incidents[0]?.id || '';
  const [reportForm, setReportForm] = useState({ incidentId: defaultIncidentId, type: 'Both', analyst: 'Chen Wei' });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const inc = incidents.find(i => i.id === reportForm.incidentId) || incidents[0] || { id: 'INC-MOCK', title: 'Mock Incident', severity: 'High' };
    setGeneratedReport({
      id: `REP-${Math.floor(getRandomSecure() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      incident: inc,
      type: reportForm.type,
      analyst: reportForm.analyst,
      executive: {
        impact: "A potential breach was identified and contained. No customer data was exfiltrated. Operations have returned to normal.",
        riskRating: "3/5",
        cost: "$15,000 - $25,000",
        action: "Approve budget for EDR rollout across legacy subnets."
      },
      technical: {
        systems: ["APP-SRV-01", "DB-CL-04"],
        vector: "Phishing email delivering weaponized macro",
        ioc: ["198.51.100.22", "bad-domain.com", "hash:d41d8cd..."],
        remediation: ["Host isolated", "Malicious file deleted", "Firewall rules updated"]
      }
    });
    setReportHistory(prev => [{ id: `REP-${Math.floor(getRandomSecure() * 1000)}`, date: new Date().toLocaleDateString(), type: reportForm.type }, ...prev].slice(0,5));
  };

  const handleCopyText = () => {
    if (!generatedReport) return;
    const textContent = `CYBEROPS INTELLIGENCE REPORT\nREF: ${generatedReport.id}\nDATE: ${generatedReport.date}\nANALYST: ${generatedReport.analyst}\nIMPACT: ${generatedReport.executive?.impact || ''}`;
    navigator.clipboard?.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-soc-card border border-soc-border rounded-xl p-6 h-fit">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FileText size={20} className="text-soc-cyan" />
            Report Parameters
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Target Incident</label>
              <select className="w-full bg-gray-900 border border-soc-border rounded px-3 py-2 text-sm focus:outline-none focus:border-soc-cyan"
                value={reportForm.incidentId} onChange={e => setReportForm({...reportForm, incidentId: e.target.value})}>
                {incidents.map(i => <option key={i.id} value={i.id}>{i.id} - {i.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Report Type</label>
              <select className="w-full bg-gray-900 border border-soc-border rounded px-3 py-2 text-sm focus:outline-none focus:border-soc-cyan"
                value={reportForm.type} onChange={e => setReportForm({...reportForm, type: e.target.value})}>
                <option value="Executive Summary">Executive Summary</option>
                <option value="Technical Report">Technical Report</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Lead Analyst</label>
              <select className="w-full bg-gray-900 border border-soc-border rounded px-3 py-2 text-sm focus:outline-none focus:border-soc-cyan"
                value={reportForm.analyst} onChange={e => setReportForm({...reportForm, analyst: e.target.value})}>
                {MOCK_ANALYSTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <button onClick={handleGenerate} className="w-full bg-soc-cyan hover:bg-cyan-600 text-gray-900 font-bold py-3 rounded mt-4 transition-colors">
              Generate Report
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <h4 className="text-sm font-semibold mb-3 text-gray-400">Recent Reports</h4>
            <div className="space-y-2">
              {reportHistory.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-gray-800 rounded">
                  <span className="font-mono text-soc-cyan">{r.id}</span>
                  <span className="text-gray-500 text-xs">{r.date}</span>
                  <Download size={14} className="text-gray-400 hover:text-white cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          {generatedReport ? (
            <div className="bg-[#e5e7eb] text-gray-900 rounded-xl p-8 shadow-2xl font-sans relative">
              <button 
                onClick={handleCopyText}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded shadow-sm border border-gray-200 text-sm font-medium transition-colors"
              >
                <Copy size={14}/> {copied ? 'Copied!' : 'Export Text'}
              </button>
              
              <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase tracking-tight">CyberOps Intelligence Report</h1>
                <p className="text-gray-600 font-mono mt-1">REF: {generatedReport.id} | DATE: {generatedReport.date}</p>
              </div>

              {(generatedReport.type === 'Both' || generatedReport.type === 'Executive Summary') && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-soc-bg uppercase">Executive Summary</h2>
                  <div className="bg-white p-4 rounded border border-gray-300 mb-4 shadow-sm">
                    <p className="text-gray-800 leading-relaxed">{generatedReport.executive?.impact}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border border-gray-300 shadow-sm">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Business Risk</span>
                      <span className="text-lg font-black text-red-600">{generatedReport.executive?.riskRating}</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-300 shadow-sm">
                      <span className="block text-xs font-bold text-gray-500 uppercase">Est. Cost Impact</span>
                      <span className="text-lg font-black text-gray-800">{generatedReport.executive?.cost}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Recommended Board Action</span>
                    <p className="font-medium text-gray-800">{generatedReport.executive?.action}</p>
                  </div>
                </div>
              )}

              {(generatedReport.type === 'Both' || generatedReport.type === 'Technical Report') && (
                <div>
                  <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-soc-bg uppercase">Technical Details</h2>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Affected Systems</h3>
                      <ul className="list-disc pl-5 font-mono text-sm">
                        {generatedReport.technical?.systems?.map(s => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Attack Vector</h3>
                      <p className="text-sm font-medium">{generatedReport.technical?.vector}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Indicators of Compromise (IOCs)</h3>
                    <div className="bg-gray-900 text-soc-cyan font-mono text-sm p-3 rounded overflow-x-auto shadow-inner">
                      {generatedReport.technical?.ioc?.join('\n')}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Remediation Steps Taken</h3>
                    <ul className="space-y-1">
                      {generatedReport.technical?.remediation?.map((r,i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle size={14} className="text-green-600"/> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Prepared By</p>
                  <p className="font-medium">{generatedReport.analyst}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                  <p className="font-medium text-red-600">CONFIDENTIAL</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-500 flex-col gap-3 min-h-[500px]">
              <FileText size={48} className="opacity-20" />
              <p>Select parameters and generate a report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
