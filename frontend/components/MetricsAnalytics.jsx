import { LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { MOCK_ANALYSTS } from '../utils/data';

export function MetricsAnalytics() {
  const trendData = [
    { day: '01', mttd: 25, mttr: 120 }, { day: '05', mttd: 22, mttr: 110 },
    { day: '10', mttd: 18, mttr: 95 },  { day: '15', mttd: 15, mttr: 80 },
    { day: '20', mttd: 16, mttr: 85 },  { day: '25', mttd: 14, mttr: 70 },
    { day: '30', mttd: 12, mttr: 65 },
  ];

  const pieData = [
    { name: 'Malware', value: 400, color: '#ef4444' },
    { name: 'Phishing', value: 300, color: '#f97316' },
    { name: 'Insider', value: 100, color: '#f59e0b' },
    { name: 'Anomaly', value: 200, color: '#06b6d4' },
    { name: 'Exploit', value: 150, color: '#10b981' },
  ];

  const healthScore = 84;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-soc-card border border-soc-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-soc-cyan/5 group-hover:bg-soc-cyan/10 transition-colors"></div>
          <h3 className="text-gray-400 font-semibold mb-4 z-10">Overall SOC Health</h3>
          <div className="relative w-48 h-48 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="#1f2937" strokeWidth="12" fill="none" />
              <circle cx="96" cy="96" r="88" stroke="#06b6d4" strokeWidth="12" fill="none" strokeDasharray="552.9" strokeDashoffset={552.9 * (1 - healthScore/100)} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white">{healthScore}</span>
              <span className="text-soc-cyan text-sm font-bold">EXCELLENT</span>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-soc-card border border-soc-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Performance Trends (MTTD / MTTR)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#fff' }} />
                <Line type="monotone" dataKey="mttr" stroke="#f59e0b" strokeWidth={3} dot={{r:4, fill:'#f59e0b'}} name="MTTR (mins)" />
                <Line type="monotone" dataKey="mttd" stroke="#06b6d4" strokeWidth={3} dot={{r:4, fill:'#06b6d4'}} name="MTTD (mins)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-soc-card border border-soc-border rounded-xl p-4 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Alert Distribution</h3>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/3 space-y-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-gray-300">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-semibold text-gray-400">Alert Fatigue (False Positives)</span>
              <span className="text-sm font-bold text-soc-green">14.2%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-soc-green h-2 rounded-full" style={{ width: '14.2%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">Target &lt; 20%</p>
          </div>
        </div>

        <div className="bg-soc-card border border-soc-border rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Analyst Leaderboard</h3>
          <div className="overflow-auto rounded-lg border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                <tr><th className="p-3">Analyst</th><th className="p-3">Closed</th><th className="p-3">MTTR</th><th className="p-3">Accuracy</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {MOCK_ANALYSTS.slice().sort((a,b) => b.closed - a.closed).map((a, i) => (
                  <tr key={a.name} className="hover:bg-gray-800/50">
                    <td className="p-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${a.status === 'Active' ? 'bg-soc-green' : 'bg-gray-500'}`}></span>
                      <span className={`font-medium ${i===0 ? 'text-soc-yellow' : 'text-gray-300'}`}>{a.name} {i===0&&'👑'}</span>
                    </td>
                    <td className="p-3 font-mono text-white">{a.closed}</td>
                    <td className="p-3 font-mono text-soc-cyan">{a.mttr}</td>
                    <td className="p-3 font-bold text-soc-green">{a.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
