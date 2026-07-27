import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../frontend/App';
import { LoginGateway } from '../frontend/components/LoginGateway';
import { SiemDashboard } from '../frontend/components/SiemDashboard';
import { ThreatIntel } from '../frontend/components/ThreatIntel';
import { ForensicsWorkbench } from '../frontend/components/ForensicsWorkbench';
import { IncidentResponse } from '../frontend/components/IncidentResponse';
import { ReportGenerator } from '../frontend/components/ReportGenerator';
import { MetricsAnalytics } from '../frontend/components/MetricsAnalytics';
import { getRandomSecure, hashStringSHA256, calculateSecureHashes } from '../frontend/utils/crypto';
import { MOCK_INCIDENTS, INITIAL_EVENTS } from '../frontend/utils/data';

// Mock clipboard API
if (typeof navigator === 'undefined') {
  global.navigator = {};
}
navigator.clipboard = {
  writeText: vi.fn().mockResolvedValue(undefined)
};

// Mock global fetch to handle relative URLs in Node/JSDOM testing environment
global.fetch = vi.fn().mockImplementation((url, options) => {
  const urlString = typeof url === 'object' ? url.url : url;
  const absoluteUrl = urlString.startsWith('/')
    ? `http://localhost${urlString}`
    : urlString;

  // Handle Auth endpoint requests
  if (absoluteUrl.includes('/api/auth')) {
    let success = false;
    let message = 'Invalid Access Key.';
    try {
      if (options && options.body) {
        const body = JSON.parse(options.body);
        if (body.username === 'sec_analyst' && body.password === 'SecurityPassword123!') {
          success = true;
        } else if (body.username !== 'sec_analyst') {
          message = 'Invalid Analyst Signature.';
        }
      }
    } catch (e) {}

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success, message }),
    });
  }

  // Return mocked data matching project endpoints
  if (absoluteUrl.includes('/api/incidents')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(MOCK_INCIDENTS),
    });
  }
  if (absoluteUrl.includes('/api/ioc/')) {
    const indicator = absoluteUrl.split('/').pop();
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        indicator: indicator,
        score: 12,
        type: 'ip',
        threat_actors: ['APT41'],
        malware_families: ['CobaltStrike'],
        description: 'Indicator mapped from mock intelligence feed.',
      }),
    });
  }
  if (absoluteUrl.includes('/api/health')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'ok', message: 'CyberOps Backend is running.' }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

describe('Security & Crypto Utilities', () => {
  it('should generate random number via getRandomSecure', () => {
    const val = getRandomSecure();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  });

  it('should compute SHA-256 hash using hashStringSHA256', async () => {
    const hash = await hashStringSHA256('SecurityPassword123!');
    expect(hash).toBe('31928642d1e0beec45501504274d8031f3db3cf04a0bfcf2bf03e98c6b22be5b');
  });

  it('should compute SHA-256 and SHA-512 hashes using calculateSecureHashes', async () => {
    const hashes = await calculateSecureHashes('testfile');
    expect(hashes.sha256).toBeDefined();
    expect(hashes.sha512).toBeDefined();
    expect(hashes.sha256.length).toBe(64);
    expect(hashes.sha512.length).toBe(128);
  });
});

describe('LoginGateway Component', () => {
  it('should render the login gateway form', () => {
    render(<LoginGateway onLoginSuccess={vi.fn()} />);
    expect(screen.getByText('Security Operations Gateway')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. sec_analyst')).toBeInTheDocument();
  });

  it('should display error message on invalid credentials login attempt', async () => {
    render(<LoginGateway onLoginSuccess={vi.fn()} />);
    
    const userField = screen.getByPlaceholderText('e.g. sec_analyst');
    const passField = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByText('Decrypt & Initialize');

    fireEvent.change(userField, { target: { value: 'wrong_user' } });
    fireEvent.change(passField, { target: { value: 'wrong_pass' } });
    fireEvent.click(submitBtn);

    const errorMsg = await screen.findByText('ACCESS DENIED: Invalid Analyst Signature.');
    expect(errorMsg).toBeInTheDocument();
  });

  it('should display key error message on invalid password login attempt', async () => {
    render(<LoginGateway onLoginSuccess={vi.fn()} />);
    
    const userField = screen.getByPlaceholderText('e.g. sec_analyst');
    const passField = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByText('Decrypt & Initialize');

    fireEvent.change(userField, { target: { value: 'sec_analyst' } });
    fireEvent.change(passField, { target: { value: 'wrong_pass' } });
    fireEvent.click(submitBtn);

    const errorMsg = await screen.findByText('ACCESS DENIED: Invalid Access Key.');
    expect(errorMsg).toBeInTheDocument();
  });

  it('should trigger decryption and succeed on demo login bypass click', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginGateway onLoginSuccess={onLoginSuccess} />);
    
    const demoBtn = screen.getByText('⚡ Quick Demo Access');
    fireEvent.click(demoBtn);

    expect(screen.getByText('>> INITIALIZING SECURE LINK')).toBeInTheDocument();

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });

  it('should trigger decryption and succeed on valid submit', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginGateway onLoginSuccess={onLoginSuccess} />);
    
    const userField = screen.getByPlaceholderText('e.g. sec_analyst');
    const passField = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByText('Decrypt & Initialize');

    fireEvent.change(userField, { target: { value: 'sec_analyst' } });
    fireEvent.change(passField, { target: { value: 'SecurityPassword123!' } });
    fireEvent.click(submitBtn);

    const loadingText = await screen.findByText('>> INITIALIZING SECURE LINK');
    expect(loadingText).toBeInTheDocument();

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });
});

describe('SiemDashboard Component', () => {
  let eventsState;
  const setEventsMock = vi.fn((cb) => {
    eventsState = cb(eventsState);
  });

  beforeEach(() => {
    eventsState = [...INITIAL_EVENTS];
    setEventsMock.mockClear();
  });

  it('should render SIEM total events and critical counter cards', () => {
    render(
      <SiemDashboard 
        events={eventsState} 
        setEvents={setEventsMock} 
        incidents={MOCK_INCIDENTS} 
        unackCriticalCount={3} 
      />
    );
    expect(screen.getByText('Total Events (24h)')).toBeInTheDocument();
    expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
  });

  it('should filter events based on severity, type, and IP search text', () => {
    render(
      <SiemDashboard 
        events={eventsState} 
        setEvents={setEventsMock} 
        incidents={MOCK_INCIDENTS} 
        unackCriticalCount={0} 
      />
    );
    
    const ipInput = screen.getByPlaceholderText('Filter IP...');
    fireEvent.change(ipInput, { target: { value: '192.168.1.105' } });
    
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Critical' } });
    fireEvent.change(selects[1], { target: { value: 'Brute Force' } });
    
    expect(ipInput.value).toBe('192.168.1.105');
  });

  it('should acknowledge an event when its table row is clicked', () => {
    render(
      <SiemDashboard 
        events={eventsState} 
        setEvents={setEventsMock} 
        incidents={MOCK_INCIDENTS} 
        unackCriticalCount={0} 
      />
    );

    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]);
    expect(setEventsMock).toHaveBeenCalled();
  });
});

describe('ThreatIntel Component', () => {
  it('should render TTP table and threat actors list', () => {
    render(<ThreatIntel />);
    expect(screen.getByText('MITRE ATT&CK TTP Browser')).toBeInTheDocument();
    expect(screen.getByText('Active Threat Actors')).toBeInTheDocument();
  });

  it('should execute IOC reputation lookup on enter key or search click', async () => {
    render(<ThreatIntel />);
    const iocInput = screen.getByPlaceholderText('Enter IP, Domain, or Hash...');
    const searchBtn = screen.getByText('Search');

    fireEvent.change(iocInput, { target: { value: '8.8.8.8' } });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Target Indicator')).toBeInTheDocument();
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
      expect(screen.getByText('Reputation Score')).toBeInTheDocument();
    });
  });

  it('should filter TTPs by clicking an actor badge', () => {
    render(<ThreatIntel />);
    const ttpBadges = screen.getAllByText('View TTPs');
    fireEvent.click(ttpBadges[0]); 
    
    expect(screen.getByText('Clear Filter')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Clear Filter'));
    expect(screen.queryByText('Clear Filter')).not.toBeInTheDocument();
  });
});

describe('ForensicsWorkbench Component', () => {
  it('should render file integrity comparisons and analyzing fields', () => {
    render(<ForensicsWorkbench />);
    expect(screen.getByText('Real File Analyzer (WebCrypto)')).toBeInTheDocument();
    expect(screen.getByText('Integrity Verifier')).toBeInTheDocument();
  });

  it('should calculate secure SHA-256/SHA-512 hashes for uploaded file', async () => {
    const mockDigest = vi.fn().mockImplementation((algo, data) => {
      return Promise.resolve(new ArrayBuffer(8));
    });
    vi.stubGlobal('crypto', {
      subtle: {
        digest: mockDigest
      }
    });

    render(<ForensicsWorkbench />);
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    file.arrayBuffer = async () => new ArrayBuffer(8);
    const fileInput = screen.getByText('Click or Drag & Drop a file here').closest('label').querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('VirusTotal Detection')).toBeInTheDocument();
      expect(screen.getByText('SHA256:')).toBeInTheDocument();
      expect(screen.getByText('SHA512:')).toBeInTheDocument();
    });
  });

  it('should display matching integrity indicator on equal compare hashes', () => {
    render(<ForensicsWorkbench />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'abc' } });
    fireEvent.change(inputs[1], { target: { value: 'abc' } });
    
    const compareBtn = screen.getByText('Compare');
    fireEvent.click(compareBtn);

    expect(screen.getByText('MATCH VALIDATED')).toBeInTheDocument();
  });

  it('should display mismatching integrity warning on non-equal compare hashes', () => {
    render(<ForensicsWorkbench />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'abc' } });
    fireEvent.change(inputs[1], { target: { value: 'xyz' } });
    
    const compareBtn = screen.getByText('Compare');
    fireEvent.click(compareBtn);

    expect(screen.getByText('TAMPERED - HASH MISMATCH')).toBeInTheDocument();
  });

  it('should analyze extensions in file type checker dropdown', () => {
    render(<ForensicsWorkbench />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '.exe' } });

    const analyzeBtn = screen.getByText('Analyze');
    fireEvent.click(analyzeBtn);

    expect(screen.getByText('4D 5A (MZ)')).toBeInTheDocument();
    expect(screen.getByText('Droppers, Payloads')).toBeInTheDocument();
  });
});

describe('IncidentResponse Component', () => {
  let incidentsState;
  const setIncidentsMock = vi.fn((cb) => {
    incidentsState = typeof cb === 'function' ? cb(incidentsState) : cb;
  });

  beforeEach(() => {
    incidentsState = [...MOCK_INCIDENTS];
    setIncidentsMock.mockClear();
  });

  it('should render Kanban columns and active incident card details', () => {
    render(
      <IncidentResponse 
        incidents={incidentsState} 
        setIncidents={setIncidentsMock} 
        selectedIncident={null} 
        setSelectedIncident={vi.fn()} 
        handleAddNewIncident={vi.fn()} 
      />
    );
    expect(screen.getByText('IR Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Investigating')).toBeInTheDocument();
  });

  it('should move incident cards when action arrows are clicked', () => {
    render(
      <IncidentResponse 
        incidents={incidentsState} 
        setIncidents={setIncidentsMock} 
        selectedIncident={null} 
        setSelectedIncident={vi.fn()} 
        handleAddNewIncident={vi.fn()} 
      />
    );

    const moveButtons = screen.getAllByText('Move →');
    fireEvent.click(moveButtons[0]);
    expect(setIncidentsMock).toHaveBeenCalled();
  });

  it('should show incident details inside side drawer when selected', () => {
    const setSelectedIncidentMock = vi.fn();
    render(
      <IncidentResponse 
        incidents={incidentsState} 
        setIncidents={setIncidentsMock} 
        selectedIncident={MOCK_INCIDENTS[0]} 
        setSelectedIncident={setSelectedIncidentMock} 
        handleAddNewIncident={vi.fn()} 
      />
    );

    expect(screen.getByText('IR Playbook Steps')).toBeInTheDocument();
    expect(screen.getByText('Isolate affected host')).toBeInTheDocument();
    
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    expect(setSelectedIncidentMock).toHaveBeenCalledWith(null);
  });
});

describe('ReportGenerator Component', () => {
  it('should render parameters and default layout info', () => {
    render(<ReportGenerator incidents={MOCK_INCIDENTS} />);
    expect(screen.getByText('Report Parameters')).toBeInTheDocument();
    expect(screen.getByText('Select parameters and generate a report')).toBeInTheDocument();
  });

  it('should generate report layout and toggle clipboard copy on export click', async () => {
    render(<ReportGenerator incidents={MOCK_INCIDENTS} />);
    const genBtn = screen.getByText('Generate Report');
    fireEvent.click(genBtn);

    expect(screen.getByText('CyberOps Intelligence Report')).toBeInTheDocument();
    expect(screen.getByText('CONFIDENTIAL')).toBeInTheDocument();

    const exportBtn = screen.getByText('Export Text');
    fireEvent.click(exportBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

describe('MetricsAnalytics Component', () => {
  it('should render overall health scores, false positive progress, and charts', () => {
    render(<MetricsAnalytics incidents={MOCK_INCIDENTS} />);
    expect(screen.getByText('Overall SOC Health')).toBeInTheDocument();
    expect(screen.getByText('Alert Fatigue (False Positives)')).toBeInTheDocument();
    expect(screen.getByText('Analyst Leaderboard')).toBeInTheDocument();
  });
});

describe('Main App Integration Flow', () => {
  it('should display login first, successfully bypass and access SIEM dashboard, and allow logout', async () => {
    render(<App />);
    expect(screen.getByText('Security Operations Gateway')).toBeInTheDocument();

    // Click demo bypass
    const demoBtn = screen.getByText('⚡ Quick Demo Access');
    fireEvent.click(demoBtn);

    // Wait for bypass state update
    const dashboardHeadings = await screen.findAllByText('SIEM Dashboard');
    expect(dashboardHeadings.length).toBeGreaterThan(0);

    // Sidebar switching to threat intel
    const intelBtn = screen.getByRole('button', { name: /Threat Intelligence/i });
    fireEvent.click(intelBtn);
    expect(screen.getByText('MITRE ATT&CK TTP Browser')).toBeInTheDocument();

    // Create new incident via incident response module
    const irBtn = screen.getByRole('button', { name: /Incident Response/i });
    fireEvent.click(irBtn);
    const newIncBtn = screen.getByText('New Incident');
    fireEvent.click(newIncBtn);

    // Logout
    const logoutBtn = screen.getByTitle('Log Out');
    fireEvent.click(logoutBtn);
    expect(screen.getByText('Security Operations Gateway')).toBeInTheDocument();
  });
});
