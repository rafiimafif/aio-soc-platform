import { getRandomSecure } from './crypto';

export const MOCK_APT_GROUPS = [
  { id: 1, name: 'APT28 (Fancy Bear)', origin: 'Russia', targets: 'Government, Defense', confidence: 'High' },
  { id: 2, name: 'Lazarus Group', origin: 'North Korea', targets: 'Financial, Crypto', confidence: 'High' },
  { id: 3, name: 'Cozy Bear (APT29)', origin: 'Russia', targets: 'Think Tanks, IT', confidence: 'High' },
  { id: 4, name: 'Sandworm', origin: 'Russia', targets: 'Energy, Infrastructure', confidence: 'High' },
  { id: 5, name: 'APT41', origin: 'China', targets: 'Healthcare, Telecom', confidence: 'Medium' },
];

export const MOCK_TTPS = [
  { id: 'T1566', tactic: 'Initial Access', name: 'Phishing', actor: 'Lazarus Group', confidence: 'High', lastSeen: '2023-10-12' },
  { id: 'T1059', tactic: 'Execution', name: 'Command and Scripting Interpreter', actor: 'APT28', confidence: 'High', lastSeen: '2023-10-20' },
  { id: 'T1543', tactic: 'Persistence', name: 'Create or Modify System Process', actor: 'Sandworm', confidence: 'Medium', lastSeen: '2023-11-01' },
  { id: 'T1068', tactic: 'Privilege Escalation', name: 'Exploitation for Privilege Escalation', actor: 'APT41', confidence: 'Low', lastSeen: '2023-11-15' },
  { id: 'T1070', tactic: 'Defense Evasion', name: 'Indicator Removal', actor: 'Cozy Bear', confidence: 'High', lastSeen: '2023-10-05' },
  { id: 'T1071', tactic: 'Command and Control', name: 'Application Layer Protocol', actor: 'APT28', confidence: 'High', lastSeen: '2023-11-20' },
  { id: 'T1048', tactic: 'Exfiltration', name: 'Exfiltration Over Alternative Protocol', actor: 'APT41', confidence: 'Medium', lastSeen: '2023-11-21' },
];

export const MOCK_INCIDENTS = [
  { id: 'INC-901', title: 'Suspicious PowerShell Execution', severity: 'High', status: 'New', team: 'Endpoint IR', timeElapsed: '45m', tactic: 'Execution' },
  { id: 'INC-902', title: 'Ransomware Note Detected', severity: 'Critical', status: 'Investigating', team: 'Malware IR', timeElapsed: '2h', tactic: 'Impact' },
  { id: 'INC-903', title: 'Multiple Failed Logins', severity: 'Medium', status: 'Investigating', team: 'Identity IR', timeElapsed: '4h', tactic: 'Initial Access' },
  { id: 'INC-904', title: 'Data Exfil to Unknown IP', severity: 'High', status: 'Contained', team: 'Network IR', timeElapsed: '1d', tactic: 'Exfiltration' },
  { id: 'INC-905', title: 'Phishing Campaign Reported', severity: 'Low', status: 'Contained', team: 'Email IR', timeElapsed: '2d', tactic: 'Initial Access' },
  { id: 'INC-906', title: 'Unauthorized DB Access', severity: 'Critical', status: 'Resolved', team: 'Cloud IR', timeElapsed: '5d', tactic: 'Collection' },
];

export const MOCK_ANALYSTS = [
  { name: 'Chen Wei', closed: 142, mttr: '1.2h', accuracy: 98, status: 'Active' },
  { name: 'Aditya Sharma', closed: 89, mttr: '2.1h', accuracy: 94, status: 'Active' },
  { name: 'Sarah Johnson', closed: 210, mttr: '0.8h', accuracy: 99, status: 'Away' },
  { name: 'Marco Rossi', closed: 120, mttr: '1.5h', accuracy: 95, status: 'Active' },
  { name: 'Fatima Al-Hassan', closed: 175, mttr: '1.1h', accuracy: 97, status: 'Active' },
];

export const MOCK_FORENSIC_CASES = [
  { id: 'FC-101', analyst: 'Chen Wei', type: 'Malware Analysis', status: 'In Progress', priority: 'High', date: '2023-11-20' },
  { id: 'FC-102', analyst: 'Sarah Johnson', type: 'Memory Dump', status: 'Pending', priority: 'Critical', date: '2023-11-21' },
  { id: 'FC-103', analyst: 'Marco Rossi', type: 'Phishing Email', status: 'Completed', priority: 'Medium', date: '2023-11-18' },
  { id: 'FC-104', analyst: 'Fatima Al-Hassan', type: 'Disk Image', status: 'Completed', priority: 'Low', date: '2023-11-10' },
  { id: 'FC-105', analyst: 'Aditya Sharma', type: 'PCAP Analysis', status: 'In Progress', priority: 'High', date: '2023-11-22' },
];

export const EVENT_TYPES = ['Brute Force', 'Port Scan', 'SQL Injection', 'Lateral Movement', 'Data Exfiltration', 'Malware Execution', 'Anomalous Login', 'Privilege Escalation'];
export const IPS = ['192.168.1.105', '10.0.0.42', '172.16.254.1', '203.0.113.5', '198.51.100.22', '45.33.32.156', '8.8.8.8', '114.114.114.114'];

export const generateRandomEvent = (id) => {
  const type = EVENT_TYPES[Math.floor(getRandomSecure() * EVENT_TYPES.length)];
  const severity = getRandomSecure() > 0.85 ? 'Critical' : getRandomSecure() > 0.6 ? 'High' : getRandomSecure() > 0.3 ? 'Medium' : 'Low';
  return {
    id: `EVT-${id}`,
    timestamp: new Date().toISOString(),
    srcIp: IPS[Math.floor(getRandomSecure() * IPS.length)],
    dstIp: IPS[Math.floor(getRandomSecure() * IPS.length)],
    type,
    severity,
    status: 'Unacknowledged',
  };
};

export const INITIAL_EVENTS = Array.from({ length: 20 }).map((_, i) => generateRandomEvent(1000 + i)).reverse();

export const MOCK_HEATMAP_DATA = Array.from({ length: 24 }).map((_, i) => ({
  name: `${i}:00`,
  Critical: Math.floor(getRandomSecure() * 5),
  High: Math.floor(getRandomSecure() * 15),
  Medium: Math.floor(getRandomSecure() * 30),
  Low: Math.floor(getRandomSecure() * 50)
}));

export const getSeverityBgColor = (severity) => {
  switch (severity) {
    case 'Critical': return 'bg-soc-red/20 text-soc-red border border-soc-red/50';
    case 'High': return 'bg-soc-orange/20 text-soc-orange border border-soc-orange/50';
    case 'Medium': return 'bg-soc-yellow/20 text-soc-yellow border border-soc-yellow/50';
    case 'Low': return 'bg-soc-green/20 text-soc-green border border-soc-green/50';
    default: return 'bg-gray-800 text-gray-400';
  }
};
