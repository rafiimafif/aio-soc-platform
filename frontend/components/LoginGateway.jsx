import { useState } from 'react';
import { ShieldAlert, Shield, Terminal } from 'lucide-react';
import { hashStringSHA256, SECURE_HASH } from '../utils/crypto';

export function LoginGateway({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptLog, setDecryptLog] = useState('');

  const executeLoginDecryption = (logs, completionCallback) => {
    setIsDecrypting(true);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < logs.length) {
        setDecryptLog(logs[idx]);
        idx++;
      } else {
        clearInterval(interval);
        setIsDecrypting(false);
        completionCallback();
      }
    }, (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ? 1 : 500);
    return () => clearInterval(interval);
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setLoginError('');
    
    if (username === 'sec_analyst' && password) {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
          const logs = [
            'Connecting to postgres://localhost:5432/cyberops_db...',
            'Handshake established. Authorizing credentials...',
            'Role: sec_analyst - ACCESS GRANTED',
            'Decrypting secure telemetry packages...',
            'CyberOps AIO Interface Initialized.'
          ];
          executeLoginDecryption(logs, onLoginSuccess);
        } else {
          setLoginError('ACCESS DENIED: ' + data.message);
        }
      } catch {
        // Fallback to local auth if backend is unreachable
        console.warn('Backend unavailable, falling back to local auth');
        const hashedVal = await hashStringSHA256(password);
        if (hashedVal === SECURE_HASH) {
          const logs = [
            'Backend unavailable. Using local fallback...',
            'Role: sec_analyst - LOCAL ACCESS GRANTED',
            'CyberOps AIO Interface Initialized.'
          ];
          executeLoginDecryption(logs, onLoginSuccess);
        } else {
          setLoginError('ACCESS DENIED: Invalid Access Key.');
        }
      }
    } else {
      setLoginError('ACCESS DENIED: Invalid Analyst Signature.');
    }
  };

  const handleDemoLogin = () => {
    setUsername('sec_analyst');
    setPassword('SecurityPassword123!');
    const logs = [
      'Bypassing secure gate via DEMO credentials...',
      'Role: sec_analyst - ACCESS GRANTED',
      'CyberOps AIO Interface Initialized.'
    ];
    executeLoginDecryption(logs, onLoginSuccess);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-soc-bg text-gray-300 font-sans relative selection:bg-soc-cyan/30 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-soc-cyan/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-soc-red/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0d1323]/80 border border-soc-border rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-soc-cyan/10 border border-soc-cyan/30 rounded-2xl mb-4 animate-pulse">
            <Shield className="text-soc-cyan" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wider">CyberOps <span className="text-soc-cyan">AIO</span></h1>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Security Operations Gateway</p>
        </div>

        {isDecrypting ? (
          <div className="space-y-6 py-8 text-center animate-pulse">
            <div className="w-12 h-12 border-4 border-soc-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="bg-black/40 border border-soc-border p-4 rounded-lg font-mono text-xs text-left max-h-32 overflow-hidden text-soc-cyan">
              <p className="text-gray-500">{">> INITIALIZING SECURE LINK"}</p>
              <p className="mt-2">{decryptLog}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="bg-soc-red/10 border border-soc-red/30 p-3 rounded-lg text-soc-red text-xs font-semibold flex items-center gap-2">
                <ShieldAlert size={16} />
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Analyst Signature (Username)</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sec_analyst" 
                required
                className="w-full bg-gray-950 border border-soc-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-soc-cyan text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Access Key (Password)</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                required
                className="w-full bg-gray-950 border border-soc-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-soc-cyan text-white transition-colors"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-soc-cyan hover:bg-cyan-600 text-gray-900 font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2"
            >
              <Terminal size={18} /> Decrypt & Initialize
            </button>

            <button 
              type="button"
              onClick={handleDemoLogin}
              className="w-full bg-gray-900 hover:bg-gray-800 text-soc-cyan font-bold py-2.5 rounded-xl transition-colors border border-soc-border/60 text-xs flex items-center justify-center gap-1.5"
            >
              ⚡ Quick Demo Access
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-soc-border/60 text-center">
          <div className="bg-soc-red/5 border border-soc-red/20 rounded-lg p-3 text-[10px] text-soc-red/80 font-mono tracking-normal leading-normal">
            🔒 WARNING: UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED. ALL INGRESS & SESSION TELEMETRY IS MONITORED AND LOGGED.
          </div>
        </div>
      </div>
    </div>
  );
}
