'use client';
import React, { useEffect, useState } from 'react';

export default function TechDashboard() {
  const [status, setStatus] = useState<any[]>([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-status');
        const data = await res.json();
        if (Array.isArray(data)) setStatus(data);
      } catch (e) { console.error(e); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase">Polyglot.Mesh_Control</h1>
          <p className="text-xs text-muted mt-1 font-mono">System Epoch: {new Date().toISOString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono uppercase text-muted">Active_Nodes</p>
          <p className="text-2xl font-bold text-accent">{status.filter(s => s.status === 'online').length}<span className="text-muted">/</span>{status.length}</p>
        </div>
      </header>

      <main>
        <div className="terminal-grid">
          {status.map((s) => (
            <div key={s.name} className="node-card border-b border-r border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-muted uppercase">[{s.name}]</span>
                <div className={`status-indicator ${s.status === 'online' ? 'online' : 'offline'}`}></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted">ROLE:</span>
                  <span className="text-accent">{
                    s.name === 'Julia' ? 'STATISTICAL_ANALYSIS' :
                    s.name === 'Rust' ? 'BINARY_PROCESSING' :
                    s.name === 'Python' ? 'ML_INFERENCE' :
                    s.name === 'Prolog' ? 'LOGIC_RULES_ENGINE' :
                    s.name === 'Go' ? 'CONCURRENT_INDEXING' : 'GENERAL_COMPUTE'
                  }</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted">PORT:</span>
                  <span>{s.port}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted">LATENCY:</span>
                  <span className="font-mono">{s.latency || 0}ms</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="h-1 w-full bg-border">
                  <div className="h-1 bg-accent/30" style={{width: s.status === 'online' ? '100%' : '0%'}}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
