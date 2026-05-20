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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 mb-4">
          Polyglot Command Center
        </h1>
        <p className="text-gray-400 text-lg">Monitoring 63+ containers across 27+ languages</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {status.map((s) => (
          <div key={s.name} className="bg-[#16161a] border border-gray-800 rounded-xl p-6 hover:border-cyan-500 transition-all duration-300 shadow-xl group">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-100 group-hover:text-cyan-400 transition-colors">{s.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'online' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                {s.status.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Port</span>
                <span className="text-gray-300">{s.port}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Latency</span>
                <span className="text-gray-300">{s.latency || '--'}ms</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Service Response</p>
                <div className="bg-black/40 rounded p-2 text-xs font-mono text-cyan-300 overflow-hidden text-ellipsis whitespace-nowrap">
                  {typeof s.response === 'string' ? s.response : JSON.stringify(s.response) || 'No data'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
