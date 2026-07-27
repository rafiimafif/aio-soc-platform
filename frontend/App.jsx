import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Search, FileSearch, 
  FileText, BarChart2, Bell, User, Clock, Shield
} from 'lucide-react';
import { getRandomSecure } from './utils/crypto';
import { INITIAL_EVENTS, generateRandomEvent, MOCK_INCIDENTS } from './utils/data';

import { LoginGateway } from './components/LoginGateway';
import { SiemDashboard } from './components/SiemDashboard';
import { ThreatIntel } from './components/ThreatIntel';
import { ForensicsWorkbench } from './components/ForensicsWorkbench';
import { IncidentResponse } from './components/IncidentResponse';
import { ReportGenerator } from './components/ReportGenerator';
import { MetricsAnalytics } from './components/MetricsAnalytics';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeModule, setActiveModule] = useState('siem');
  const [time, setTime] = useState('');
  
  // SIEM State
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [eventCounter, setEventCounter] = useState(1020);

  // Incident Response State
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => {
        if(data && data.length > 0) {
          setIncidents(data);
        } else {
          setIncidents(MOCK_INCIDENTS);
        }
      })
      .catch(err => {
        console.warn('Backend unavailable, using mock incidents:', err);
        setIncidents(MOCK_INCIDENTS);
      });
  }, []);

  // Clock Sync
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Event Generator for SIEM
  useEffect(() => {
    if (activeModule === 'siem') {
      const generator = setInterval(() => {
        setEvents(prev => {
          const newEvt = generateRandomEvent(eventCounter);
          setEventCounter(c => c + 1);
          return [newEvt, ...prev].slice(0, 100);
        });
      }, 3000);
      return () => clearInterval(generator);
    }
  }, [activeModule, eventCounter]);

  const handleAddNewIncident = async () => {
    const newId = `INC-${Math.floor(100 + getRandomSecure() * 900)}`;
    const randomTitle = [
      'Unauthorized SSH Login Attempt',
      'Outbound Traffic Spike Detected',
      'Malicious Domain Query',
      'API Token Leak on GitHub',
      'EDR Agent Disabled'
    ][Math.floor(getRandomSecure() * 5)];
    const randomSev = ['Low', 'Medium', 'High', 'Critical'][Math.floor(getRandomSecure() * 4)];
    const randomTactic = ['Credential Access', 'Exfiltration', 'Command and Control', 'Initial Access', 'Defense Evasion'][Math.floor(getRandomSecure() * 5)];
    const newInc = {
      id: newId,
      title: randomTitle,
      severity: randomSev,
      status: 'New',
      team: 'Endpoint IR',
      timeElapsed: '1m',
      tactic: randomTactic
    };
    
    try {
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInc)
      });
    } catch (e) {
      console.warn('Failed to save to backend:', e);
    }

    setIncidents(prev => [newInc, ...prev]);
  };

  const unackCriticalCount = events.filter(e => e.severity === 'Critical' && e.status === 'Unacknowledged').length;

  const MODULES = [
    { id: 'siem', label: 'SIEM Dashboard', icon: Activity },
    { id: 'intel', label: 'Threat Intelligence', icon: Search },
    { id: 'forensics', label: 'Forensics Workbench', icon: FileSearch },
    { id: 'ir', label: 'Incident Response', icon: ShieldAlert },
    { id: 'reports', label: 'Report Generator', icon: FileText },
    { id: 'metrics', label: 'Metrics & Analytics', icon: BarChart2 },
  ];

  if (!isLoggedIn) {
    return <LoginGateway onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-soc-bg text-gray-300 overflow-hidden font-sans selection:bg-soc-cyan/30">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#0d1323] border-r border-soc-border flex flex-col flex-shrink-0 transition-all duration-300 z-20">
        <div className="h-16 flex items-center px-6 border-b border-soc-border">
          <Shield className="text-soc-cyan mr-3" size={28} />
          <h1 className="text-xl font-black text-white tracking-wider">CyberOps <span className="text-soc-cyan">AIO</span></h1>
        </div>
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-3 mb-2">Modules</div>
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                ${activeModule === m.id 
                  ? 'bg-soc-cyan/10 text-soc-cyan shadow-[inset_4px_0_0_0_#06b6d4]' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
              <m.icon size={18} className={activeModule === m.id ? 'animate-pulse' : ''} />
              {m.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-soc-border bg-gray-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-800 p-2 rounded-full"><User size={20} className="text-gray-400"/></div>
            <div>
              <p className="text-sm font-bold text-white">Analyst-01</p>
              <p className="text-xs text-soc-green flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-soc-green"></span> Online</p>
            </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="text-xs text-gray-500 hover:text-soc-red hover:bg-soc-red/10 p-1.5 rounded transition-colors"
            title="Log Out"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <div className="h-16 bg-soc-card border-b border-soc-border flex items-center justify-between px-8 flex-shrink-0 z-10 shadow-sm">
          <h2 className="text-lg font-bold text-white">{MODULES.find(m => m.id === activeModule)?.label}</h2>
          <div className="flex items-center gap-6">
            <div className="font-mono text-soc-cyan bg-soc-cyan/10 px-3 py-1 rounded border border-soc-cyan/30 flex items-center gap-2">
              <Clock size={14}/> {time}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative cursor-pointer">
                <Bell size={20} className="text-gray-400 hover:text-white transition-colors" />
                {unackCriticalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-soc-red text-white text-[10px] font-bold px-1.5 rounded-full animate-pulse">
                    {unackCriticalCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-auto p-8 bg-soc-bg relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20"></div>
          
          <div className="relative z-10 h-full">
            {activeModule === 'siem' && (
              <SiemDashboard 
                events={events} 
                setEvents={setEvents} 
                incidents={incidents} 
                unackCriticalCount={unackCriticalCount} 
              />
            )}
            {activeModule === 'intel' && <ThreatIntel />}
            {activeModule === 'forensics' && <ForensicsWorkbench />}
            {activeModule === 'ir' && (
              <IncidentResponse 
                incidents={incidents} 
                setIncidents={setIncidents} 
                selectedIncident={selectedIncident} 
                setSelectedIncident={setSelectedIncident} 
                handleAddNewIncident={handleAddNewIncident} 
              />
            )}
            {activeModule === 'reports' && <ReportGenerator incidents={incidents} />}
            {activeModule === 'metrics' && <MetricsAnalytics incidents={incidents} />}
          </div>
        </div>
      </div>
    </div>
  );
}
