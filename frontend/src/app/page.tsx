'use client';
import React, { useState, useEffect } from 'react';

export default function MeshConsole() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const runFullMesh = async () => {
    setIsExecuting(true);
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: 'Initializing Global Mesh Compute...' }]);
    
    try {
      const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-mesh/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [1, 2, 3] })
      });
      const data = await res.json();
      data.forEach((r: any) => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `[${r.node}] Response: ${JSON.stringify(r.data || r.error)}` }]);
      });
    } catch (e) {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: 'Global Mesh Timeout' }]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#0f0', minHeight: '100-screen', padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ borderBottom: '1px solid #0f0' }}>GLOBAL POLYGLOT MESH OPERATIONAL</h1>
      <button 
        onClick={runFullMesh} 
        disabled={isExecuting}
        style={{ backgroundColor: '#0f0', color: '#000', border: 'none', padding: '15px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginBottom: '20px' }}
      >
        {isExecuting ? 'COMPUTING ON ALL NODES...' : 'TRIGGER ALL 30+ NODES'}
      </button>

      <div style={{ backgroundColor: '#111', padding: '10px', height: '70vh', overflowY: 'auto', border: '1px solid #333' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '5px' }}>
            <span style={{ color: '#555' }}>[{log.time}]</span> {log.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
