import { Users, Plus, Clock } from 'lucide-react';
import { getSeverityBgColor } from '../utils/data';

export function IncidentResponse({ incidents, setIncidents, selectedIncident, setSelectedIncident, handleAddNewIncident }) {
  const stages = ['New', 'Investigating', 'Contained', 'Resolved'];

  const moveIncident = async (id, nextStage) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: nextStage } : i));
    if(selectedIncident?.id === id) setSelectedIncident(prev => prev ? { ...prev, status: nextStage } : null);

    try {
      await fetch(`/api/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStage })
      });
    } catch (e) {
      console.warn('Failed to update status on backend:', e);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-soc-cyan" /> IR Kanban Board
        </h2>
        <button 
          onClick={handleAddNewIncident}
          className="bg-soc-cyan hover:bg-cyan-600 text-gray-900 font-bold px-4 py-2 rounded transition-colors flex items-center gap-2">
          <Plus size={18} /> New Incident
        </button>
      </div>

      <div className="flex gap-6 flex-1 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage} className="flex-1 min-w-[300px] bg-gray-900/50 rounded-xl p-4 flex flex-col border border-gray-800">
            <h3 className="font-bold text-gray-300 mb-4 uppercase text-sm tracking-wider flex justify-between">
              {stage} 
              <span className="bg-gray-800 text-soc-cyan px-2 py-0.5 rounded-full text-xs">
                {incidents.filter(i => i.status === stage).length}
              </span>
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {incidents.filter(i => i.status === stage).map(inc => (
                <div key={inc.id} 
                  onClick={() => setSelectedIncident(inc)}
                  className="bg-soc-card p-4 rounded-lg border border-soc-border hover:border-soc-cyan transition-colors cursor-pointer shadow-lg group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-soc-cyan bg-soc-cyan/10 px-2 py-1 rounded">{inc.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityBgColor(inc.severity)}`}>{inc.severity}</span>
                  </div>
                  <h4 className="font-semibold text-gray-100 mb-2 leading-tight">{inc.title}</h4>
                  <div className="flex justify-between items-end text-xs text-gray-500 mt-4">
                    <span>{inc.team}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {inc.timeElapsed}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    {stage !== 'New' && (
                      <button onClick={(e) => { e.stopPropagation(); moveIncident(inc.id, stages[stages.indexOf(stage)-1]); }} className="text-xs text-gray-400 hover:text-white">← Move</button>
                    )}
                    {stage !== 'Resolved' && (
                      <button onClick={(e) => { e.stopPropagation(); moveIncident(inc.id, stages[stages.indexOf(stage)+1]); }} className="text-xs text-soc-cyan hover:text-cyan-400 ml-auto">Move →</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Side Drawer for Incident Details */}
      {selectedIncident && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-soc-card border-l border-soc-border shadow-2xl p-6 flex flex-col z-50 animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-mono text-soc-cyan">{selectedIncident.id}</h3>
            <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">{selectedIncident.title}</h4>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBgColor(selectedIncident.severity)}`}>{selectedIncident.severity}</span>
                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">{selectedIncident.status}</span>
                <span className="bg-gray-800 text-soc-orange px-2 py-1 rounded text-xs border border-soc-orange/30">{selectedIncident.tactic}</span>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h5 className="text-sm font-semibold text-gray-400 mb-3">IR Playbook Steps</h5>
              <div className="space-y-2">
                {['Isolate affected host', 'Preserve memory dump', 'Notify stakeholders', 'Block IOC at firewall'].map((step, i) => (
                  <label key={i} className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer hover:text-white">
                    <input type="checkbox" className="form-checkbox bg-gray-800 border-gray-600 text-soc-cyan rounded focus:ring-0 w-4 h-4" />
                    {step}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-400 mb-3">Timeline & Notes</h5>
              <div className="space-y-3 mb-4">
                <div className="border-l-2 border-gray-700 pl-3">
                  <p className="text-xs text-gray-500 mb-1">Today 10:45 AM - System</p>
                  <p className="text-sm text-gray-300">Incident created automatically via SIEM alert correlation.</p>
                </div>
                <div className="border-l-2 border-soc-cyan pl-3">
                  <p className="text-xs text-gray-500 mb-1">Today 11:10 AM - {selectedIncident.team}</p>
                  <p className="text-sm text-gray-300">Investigation started. Initial host triage under way.</p>
                </div>
              </div>
              <textarea className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-300 focus:border-soc-cyan focus:outline-none" rows="3" placeholder="Add a note..."></textarea>
              <button className="mt-2 w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded transition-colors text-sm">Add Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
