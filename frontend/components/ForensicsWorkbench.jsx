import { useState } from 'react';
import { Hash, CheckCircle, AlertTriangle, FileSearch, Check } from 'lucide-react';
import { MOCK_FORENSIC_CASES, getSeverityBgColor } from '../utils/data';

export function ForensicsWorkbench() {
  const [hashResult, setHashResult] = useState(null);
  const [origHash, setOrigHash] = useState('');
  const [currHash, setCurrHash] = useState('');
  const [integrityResult, setIntegrityResult] = useState(null);
  const [fileType, setFileType] = useState('');
  const [fileTypeResult, setFileTypeResult] = useState(null);

  const [vtApiKey, setVtApiKey] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileType(file.name.substring(file.name.lastIndexOf('.')).toLowerCase());
    
    const buffer = await file.arrayBuffer();
    
    // Extract magic bytes (first 8 bytes)
    const view = new Uint8Array(buffer.slice(0, 8));
    const magicHex = Array.from(view).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    // Calculate real hashes
    const sha256Buffer = await crypto.subtle.digest('SHA-256', buffer);
    const sha256 = Array.from(new Uint8Array(sha256Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const sha512Buffer = await crypto.subtle.digest('SHA-512', buffer);
    const sha512 = Array.from(new Uint8Array(sha512Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    let vtScore = 'No API Key Provided';

    setHashResult({
      sha256,
      sha512,
      magic: magicHex,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      mime: file.type || 'application/octet-stream',
      vtScore: 'Scanning...'
    });

    if (vtApiKey) {
      try {
        const vtRes = await fetch('/api/vt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash: sha256, apiKey: vtApiKey })
        });
        const vtData = await vtRes.json();
        if (vtData.data && vtData.data.attributes) {
          const stats = vtData.data.attributes.last_analysis_stats;
          vtScore = `${stats.malicious}/${stats.malicious + stats.undetected + stats.harmless}`;
        } else {
          vtScore = 'Not Found on VT';
        }
      } catch {
        vtScore = 'Error contacting VT';
      }
    }

    setHashResult(prev => ({ ...prev, vtScore }));
  };

  const handleIntegrityCheck = () => {
    if(!origHash || !currHash) return;
    setIntegrityResult(origHash === currHash ? 'PASS' : 'FAIL');
  };

  const handleFileTypeCheck = () => {
    if(!fileType) return;
    const db = {
      '.exe': { magic: '4D 5A (MZ)', risk: 'Critical', use: 'Droppers, Payloads', action: 'Quarantine & Sandbox' },
      '.pdf': { magic: '25 50 44 46 (%PDF)', risk: 'Medium', use: 'Embedded JS, Phishing', action: 'Scan for active content' },
      '.docx': { magic: '50 4B 03 04 (PK)', risk: 'High', use: 'Malicious Macros', action: 'Extract VBA & analyze' },
      '.ps1': { magic: 'Various (Text)', risk: 'High', use: 'Living off the land', action: 'Review script logic' },
    };
    setFileTypeResult(db[fileType] || { magic: 'Unknown', risk: 'Low', use: 'General', action: 'Standard scan' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-soc-card border border-soc-border rounded-xl p-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Hash size={20} className="text-soc-cyan" />
              Real File Analyzer (WebCrypto)
            </h3>
            <div className="flex flex-col gap-4 mb-4">
              <input type="password" placeholder="Enter VirusTotal API Key (Optional)" 
                className="w-full bg-gray-900 border border-soc-border rounded px-4 py-2 font-mono text-sm focus:outline-none focus:border-soc-cyan"
                value={vtApiKey} onChange={e => setVtApiKey(e.target.value)}
              />
              <label className="border-2 border-dashed border-soc-border hover:border-soc-cyan rounded-xl p-8 text-center cursor-pointer transition-colors bg-gray-900/50">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <FileSearch size={32} className="mx-auto mb-3 text-gray-500" />
                <p className="text-sm font-bold text-gray-300">Click or Drag & Drop a file here</p>
                <p className="text-xs text-gray-500 mt-1">Hashes are calculated locally in your browser.</p>
              </label>
            </div>
            {hashResult && (
              <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">VirusTotal Detection</span>
                  <span className="font-bold text-soc-orange">{hashResult.vtScore}</span>
                </div>
                <div><span className="text-gray-500 inline-block w-20">SHA256:</span><span className="font-mono text-soc-cyan text-xs break-all">{hashResult.sha256}</span></div>
                <div><span className="text-gray-500 inline-block w-20">SHA512:</span><span className="font-mono text-gray-300 text-[10px] break-all">{hashResult.sha512}</span></div>
                <div><span className="text-gray-500 inline-block w-20">Magic Bytes:</span><span className="font-mono text-soc-yellow text-xs">{hashResult.magic}</span></div>
                <div><span className="text-gray-500 inline-block w-20">File Size:</span><span className="text-gray-300">{hashResult.size}</span></div>
                <div><span className="text-gray-500 inline-block w-20">MIME:</span><span className="text-gray-300">{hashResult.mime}</span></div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-soc-cyan" />
              Integrity Verifier
            </h3>
            <div className="space-y-3">
              <input type="text" placeholder="Original Hash" className="w-full bg-gray-900 border border-soc-border rounded px-3 py-2 font-mono text-sm" value={origHash} onChange={e => setOrigHash(e.target.value)} />
              <input type="text" placeholder="Current Hash" className="w-full bg-gray-900 border border-soc-border rounded px-3 py-2 font-mono text-sm" value={currHash} onChange={e => setCurrHash(e.target.value)} />
              <div className="flex items-center gap-4">
                <button onClick={handleIntegrityCheck} className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded border border-gray-600">Compare</button>
                {integrityResult === 'PASS' && <span className="text-soc-green font-bold flex items-center gap-1"><Check size={18}/> MATCH VALIDATED</span>}
                {integrityResult === 'FAIL' && <span className="text-soc-red font-bold flex items-center gap-1"><AlertTriangle size={18}/> TAMPERED - HASH MISMATCH</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-soc-card border border-soc-border rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileSearch size={20} className="text-soc-cyan" />
              File Type Analyzer
            </h3>
            <div className="flex gap-2 mb-4">
              <select className="bg-gray-900 border border-soc-border rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-soc-cyan"
                value={fileType} onChange={e => setFileType(e.target.value)}>
                <option value="">Select extension...</option>
                <option value=".exe">.exe</option>
                <option value=".pdf">.pdf</option>
                <option value=".docx">.docx</option>
                <option value=".ps1">.ps1</option>
              </select>
              <button onClick={handleFileTypeCheck} className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded border border-gray-600">Analyze</button>
            </div>
            {fileTypeResult && (
              <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-lg border border-gray-800 text-sm">
                <div><p className="text-gray-500 mb-1">Magic Bytes</p><p className="font-mono text-soc-cyan">{fileTypeResult.magic}</p></div>
                <div>
                  <p className="text-gray-500 mb-1">Risk Level</p>
                  <span className={`px-2 py-0.5 rounded text-xs ${getSeverityBgColor(fileTypeResult.risk)}`}>{fileTypeResult.risk}</span>
                </div>
                <div className="col-span-2"><p className="text-gray-500 mb-1">Common Malware Uses</p><p className="text-gray-300">{fileTypeResult.use}</p></div>
                <div className="col-span-2"><p className="text-gray-500 mb-1">Recommended Action</p><p className="text-soc-orange">{fileTypeResult.action}</p></div>
              </div>
            )}
          </div>

          <div className="bg-soc-card border border-soc-border rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Forensic Cases</h3>
            <div className="overflow-auto rounded-lg border border-gray-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400">
                  <tr><th className="p-2">ID</th><th className="p-2">Type</th><th className="p-2">Status</th><th className="p-2">Analyst</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {MOCK_FORENSIC_CASES.map(c => (
                    <tr key={c.id} className="hover:bg-gray-800/50">
                      <td className="p-2 font-mono text-soc-cyan text-xs">{c.id}</td>
                      <td className="p-2 text-gray-300">{c.type}</td>
                      <td className="p-2">
                        <span className={`text-xs ${c.status === 'Completed' ? 'text-soc-green' : 'text-soc-yellow'}`}>{c.status}</span>
                      </td>
                      <td className="p-2 text-gray-400">{c.analyst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
