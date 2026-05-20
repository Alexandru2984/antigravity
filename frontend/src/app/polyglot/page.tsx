'use client';
import React, { useEffect, useState } from 'react';

export default function PolyglotDashboard() {
  const [status, setStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-status');
      const data = await res.json();
      setStatus(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen gradient-bg p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-16 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <h1 className="text-6xl font-black tracking-tighter mb-4">
          POLYGLOT <span className="text-cyan-400 neon-text">NEXUS</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
          <p className="text-gray-400 font-mono tracking-widest uppercase text-sm">Distributed Infrastructure v2.0.4</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {status.map((s) => (
          <div key={s.name} className="glass-card p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 group-hover:border-cyan-500/50">
                   <div className="w-8 h-8 flex items-center justify-center font-bold text-xl text-cyan-400">
                     {s.name[0]}
                   </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`w-2 h-2 rounded-full ${s.status === 'online' ? 'bg-green-400 animate-ping' : 'bg-red-500'}`}></div>
                  <span className={`text-[10px] font-bold mt-1 ${s.status === 'online' ? 'text-green-400' : 'text-red-500'}`}>
                    {s.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1 tracking-tight">{s.name}</h3>
              <p className="text-gray-500 text-xs font-mono">NODE_PORT: {s.port}</p>
            </div>

            <div className="mt-8">
              <div className="bg-black/50 rounded-lg p-3 border border-white/5 overflow-hidden">
                <p className="text-[10px] text-gray-500 uppercase mb-2 font-bold tracking-widest">Live Output</p>
                <code className="text-xs text-cyan-300/80 block truncate">
                  {s.response ? (typeof s.response === 'string' ? s.response : JSON.stringify(s.response)) : '> NO_DATA'}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
