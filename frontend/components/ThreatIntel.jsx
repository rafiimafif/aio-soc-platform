import React, { useState, useEffect } from 'react';
import { Search, Shield, Users, RefreshCw } from 'lucide-react';
import { MOCK_TTPS, MOCK_APT_GROUPS, getSeverityBgColor } from '../utils/data';
import { getRandomSecure } from '../utils/crypto';

export function ThreatIntel() {
  const [iocSearch, setIocSearch] = useState('');
  const [iocResult, setIocResult] = useState(null);
  const [ttpFilter, setTtpFilter] = useState('');

  const [mitreData, setMitreData] = useState(MOCK_TTPS);
  const [isLoadingMitre, setIsLoadingMitre] = useState(false);

  useEffect(() => {
    setIsLoadingMitre(true);
    fetch('https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.objects) {
          const techniques = data.objects
            .filter(obj => obj.type === 'attack-pattern')
            .slice(0, 50)
            .map(t => ({
              id: t.external_references?.[0]?.external_id || 'Unknown',
              tactic: t.kill_chain_phases?.[0]?.phase_name || 'Various',
              name: t.name,
              actor: 'Various Actors (Live Data)',
              confidence: 'High',
            }));
          setMitreData(techniques);
        }
      })
      .catch(err => {
        console.warn('Failed to load live MITRE data, falling back to mock.', err);
      })
      .finally(() => setIsLoadingMitre(false));
  }, []);

  const handleIocSearch = async () => {
    if(!iocSearch) return;
    setIocResult(null);
    
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(iocSearch);
    
    if (isIp) {
      try {
        const res = await fetch(`/api/ioc/${iocSearch}`);
        const data = await res.json();
        if (data && data.status === 'success') {
          setIocResult({
            score: Math.floor(getRandomSecure() * 100),
            tags: [data.isp, data.org].filter(Boolean),
            country: data.countryCode,
            firstSeen: 'Live Query',
            lastSeen: new Date().toISOString().split('T')[0]
          });
          return;
        }
      } catch (err) {
        console.warn('Failed live IOC lookup', err);
      }
    }
    
    setIocResult({
      score: Math.floor(getRandomSecure() * 100),
      tags: ['Botnet C2', 'Phishing', 'Malware'].sort(() => 0.5 - getRandomSecure()).slice(0, 2),
      country: ['RU', 'CN', 'KP', 'IR'][Math.floor(getRandomSecure() * 4)],
      firstSeen: '2022-04-15',
      lastSeen: new Date().toISOString().split('T')[0]
    });
  };

  const displayTtps = mitreData.filter(t => 
    t.actor.toLowerCase().includes(ttpFilter.toLowerCase()) || 
    t.tactic.toLowerCase().includes(ttpFilter.toLowerCase()) ||
    t.name.toLowerCase().includes(ttpFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-soc-card border border-soc-border rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search size={20} className="text-soc-cyan" />
              IOC Lookup
            </h3>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Enter IP, Domain, or Hash..." 
                className="flex-1 bg-gray-900 border border-soc-border rounded px-4 py-2 font-mono focus:outline-none focus:border-soc-cyan"
                value={iocSearch} onChange={e => setIocSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleIocSearch()}
              />
              <button onClick={handleIocSearch} className="bg-soc-cyan hover:bg-cyan-600 text-gray-900 font-bold px-4 py-2 rounded transition-colors flex items-center gap-2">
                <Search size={18} /> Search
              </button>
            </div>
            
            {iocResult && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg animate-in fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400">Target Indicator</p>
                    <p className="text-xl font-mono text-white mb-2">{iocSearch}</p>
                    <div className="flex gap-2">
                      {iocResult.tags.map(t => (
                        <span key={t} className="bg-soc-red/20 text-soc-red border border-soc-red/30 px-2 py-1 rounded text-xs uppercase">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Reputation Score</p>
                    <p className={`text-4xl font-bold ${iocResult.score > 70 ? 'text-soc-red' : iocResult.score > 40 ? 'text-soc-orange' : 'text-soc-green'}`}>
                      {iocResult.score}/100
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-800">
                  <div><p className="text-xs text-gray-500">Origin</p><p className="font-medium text-gray-300">Flag: {iocResult.country}</p></div>
                  <div><p className="text-xs text-gray-500">First Seen</p><p className="font-mono text-sm text-gray-300">{iocResult.firstSeen}</p></div>
                  <div><p className="text-xs text-gray-500">Last Seen</p><p className="font-mono text-sm text-gray-300">{iocResult.lastSeen}</p></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-soc-card border border-soc-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={20} className="text-soc-cyan" />
                MITRE ATT&CK TTP Browser
                {isLoadingMitre && <RefreshCw size={14} className="animate-spin text-gray-500" />}
              </h3>
              {ttpFilter && (
                <button onClick={() => setTtpFilter('')} className="text-xs text-soc-cyan hover:underline">Clear Filter</button>
              )}
            </div>
            <div className="overflow-auto border border-soc-border rounded-lg bg-gray-900 max-h-80">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800 sticky top-0 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="p-3">Tactic</th>
                    <th className="p-3">Tech ID</th>
                    <th className="p-3">Technique Name</th>
                    <th className="p-3">Threat Actor</th>
                    <th className="p-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soc-border">
                  {displayTtps.map(t => (
                    <tr key={t.id} className="hover:bg-gray-800">
                      <td className="p-3 font-medium text-gray-300">{t.tactic}</td>
                      <td className="p-3 font-mono text-soc-cyan">{t.id}</td>
                      <td className="p-3">{t.name}</td>
                      <td className="p-3 text-soc-orange">{t.actor}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${getSeverityBgColor(t.confidence === 'High' ? 'Critical' : t.confidence === 'Medium' ? 'Medium' : 'Low')}`}>
                          {t.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-soc-card border border-soc-border rounded-xl p-4 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-soc-cyan" />
            Active Threat Actors
          </h3>
          <div className="flex-1 overflow-auto pr-2 space-y-4">
            {MOCK_APT_GROUPS.map(apt => (
              <div key={apt.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-lg">{apt.name}</h4>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{apt.origin}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3"><span className="text-gray-500">Targets:</span> {apt.targets}</p>
                <button 
                  onClick={() => setTtpFilter(apt.name)}
                  className="w-full text-xs font-semibold py-1.5 bg-gray-800 hover:bg-gray-700 text-soc-cyan rounded transition-colors border border-gray-700">
                  View TTPs
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
