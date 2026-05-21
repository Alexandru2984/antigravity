'use client';
import React, { useEffect, useState } from 'react';

export default function PolyglotDashboard() {
  const [status, setStatus] = useState<any[]>([]);
  const [input, setInput] = useState('10, 20, 30, 40, 50');
  const [report, setReport] = useState<any>(null);
  const [isComputing, setIsComputing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-status');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setStatus(data);
      } else {
        console.error('Expected array from polyglot-status, got:', data);
      }
    } catch (e) { console.error(e); }
  };

  const runCompute = async () => {
    setIsComputing(true);
    try {
      const values = input.split(',').map(n => parseFloat(n.trim()));
      const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      });
      const data = await res.json();
      setReport(data);
    } catch (e) {
      alert('Computation failed: Check if services are UP');
    } finally {
      setIsComputing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen gradient-bg p-6 md:p-12 text-white font-sans">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter mb-2">
            POLYGLOT <span className="text-cyan-400 neon-text">NEXUS</span>
          </h1>
          <p className="text-gray-400 font-mono tracking-widest uppercase text-xs">Cross-Language Orchestration Platform</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-cyan-400">{Array.isArray(status) ? status.filter(s => s.status === 'online').length : 0} / {Array.isArray(status) ? status.length : 0}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Active Nodes</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Computing Panel */}
        <div className="lg:col-span-1 space-y-8">
          <section className="glass-card p-8 border-cyan-500/30">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              Execution Command
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Input Data (CSV)</label>
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-cyan-300 font-mono focus:border-cyan-500 outline-none transition-all"
                />
              </div>
              <button 
                onClick={runCompute}
                disabled={isComputing}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isComputing ? 'Processing...' : 'Deploy Task'}
              </button>
            </div>
          </section>

          {report && (
            <section className="glass-card p-8 border-purple-500/30 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold mb-6 text-purple-400">Execution Report</h2>
              <div className="space-y-4 font-mono text-xs">
                {report.steps?.map((step: any, i: number) => (
                  <div key={i} className="border-l-2 border-purple-500/50 pl-4 py-1">
                    <p className="text-purple-300 font-bold">{step.service} → {step.action}</p>
                    <p className="text-gray-500">{JSON.stringify(step.data || step.hash)}</p>
                  </div>
                ))}
                <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-center font-bold">
                  STATUS: {report.finalStatus}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Nodes Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.isArray(status) && status.map((s) => (
            <div key={s.name} className="glass-card p-5 hover:bg-white/5 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold tracking-widest text-gray-400">{s.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {s.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.status === 'online' ? 'bg-cyan-500' : 'bg-gray-700'}`} style={{width: s.status === 'online' ? '100%' : '0%'}}></div>
                </div>
                <span className="text-[10px] font-mono text-gray-500">{s.latency || 0}ms</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
