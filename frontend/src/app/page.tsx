'use client';
import React, { useEffect, useState } from 'react';

export default function PolyglotNexus() {
  const [status, setStatus] = useState<any[]>([]);
  const [input, setInput] = useState('10, 20, 30, 40, 50');
  const [report, setReport] = useState<any>(null);
  const [isComputing, setIsComputing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-status');
      const data = await res.json();
      if (Array.isArray(data)) setStatus(data);
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
      console.error(e);
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
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end relative">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div>
          <h1 className="text-7xl font-black tracking-tighter mb-2 italic">
            POLYGLOT <span className="text-cyan-400 neon-text not-italic">NEXUS</span>
          </h1>
          <p className="text-gray-400 font-mono tracking-[0.3em] uppercase text-[10px]">Unified Computing & Intelligence Platform</p>
        </div>
        <div className="text-right glass-card px-6 py-3 border-cyan-500/20">
          <p className="text-4xl font-black text-cyan-400">{status.filter(s => s.status === 'online').length}<span className="text-gray-600 text-xl">/</span>{status.length || '63'}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Nodes</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="glass-card p-8 border-cyan-500/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,242,255,0.8)]"></span>
              Task Dispatcher
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-3 block tracking-widest">Global Input Vector</label>
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  className="w-full bg-black/60 border border-white/5 rounded-xl p-4 text-cyan-300 font-mono focus:border-cyan-500/50 outline-none transition-all shadow-inner"
                />
              </div>
              <button 
                onClick={runCompute}
                disabled={isComputing}
                className="w-full py-5 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-xl font-black uppercase tracking-[0.2em] text-sm hover:brightness-125 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,242,255,0.3)]"
              >
                {isComputing ? 'Synchronizing Nodes...' : 'Execute Compute'}
              </button>
            </div>
          </section>

          {report && (
            <section className="glass-card p-8 border-purple-500/30 animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-xl font-bold mb-6 text-purple-400 flex items-center gap-3">
                 <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                 Orchestration Report
              </h2>
              <div className="space-y-5">
                {report.steps?.map((step: any, i: number) => (
                  <div key={i} className="bg-black/30 p-4 rounded-lg border border-white/5 group hover:border-purple-500/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-purple-300 font-bold text-xs uppercase tracking-tighter">{step.service}</p>
                      <span className="text-[9px] text-green-400 font-mono">OK</span>
                    </div>
                    <p className="text-gray-400 text-[10px] mb-2">{step.action}</p>
                    <code className="text-[10px] text-gray-500 block bg-black/50 p-2 rounded truncate font-mono">
                      {JSON.stringify(step.data || step.hash)}
                    </code>
                  </div>
                ))}
                <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Final Integrity</span>
                    <span className="text-cyan-300 font-mono font-bold">{report.finalStatus}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
          {status.length > 0 ? status.map((s) => (
            <div key={s.name} className="glass-card p-5 group hover:bg-cyan-500/5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,242,255,1)]' : 'bg-gray-700'}`}></div>
                  <span className="text-sm font-black tracking-widest text-gray-200 group-hover:text-cyan-400 transition-colors uppercase">{s.name}</span>
                </div>
                <span className="text-[9px] font-mono text-gray-600">PORT:{s.port}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${s.status === 'online' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-800'}`} style={{width: s.status === 'online' ? '100%' : '5%'}}></div>
                </div>
                <span className="text-[10px] font-mono text-cyan-500/50 w-8">{s.latency || 0}ms</span>
              </div>
            </div>
          )) : (
            Array(12).fill(0).map((_, i) => (
               <div key={i} className="glass-card p-5 animate-pulse bg-white/5 h-20"></div>
            ))
          )}
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em]">Antigravity Intelligence Systems • Advanced Polyglot Mesh</p>
      </footer>
    </div>
  );
}
