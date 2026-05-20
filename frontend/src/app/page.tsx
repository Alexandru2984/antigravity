'use client';
import React, { useState, useEffect } from 'react';

export default function PolyglotApp() {
  const [inputData, setInputData] = useState('10, 20, 50, 100, 200');
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any[]>([]);

  const runPipeline = async () => {
    const data = inputData.split(',').map(Number);
    const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    const json = await res.json();
    setResult(json);
  };

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch('http://polyglot.micutu.com/api/v1/polyglot-status');
      const data = await res.json();
      if (Array.isArray(data)) setStatus(data);
    };
    fetchStatus();
  }, []);

  return (
    <div style={{ padding: '40px', backgroundColor: '#000', color: '#0f0', fontFamily: 'monospace' }}>
      <h1>POLYGLOT MASTER CONTROL</h1>
      <hr />
      <div style={{ marginBottom: '20px' }}>
        <h3>1. INPUT DATA (Market Prices)</h3>
        <input 
          value={inputData} 
          onChange={(e) => setInputData(e.target.value)}
          style={{ width: '100%', padding: '10px', backgroundColor: '#111', color: '#0f0', border: '1px solid #333' }} 
        />
        <button onClick={runPipeline} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#0f0', color: '#000', fontWeight: 'bold' }}>
          EXECUTE DISTRIBUTED PIPELINE
        </button>
      </div>

      {result && (
        <div style={{ backgroundColor: '#111', padding: '20px', border: '1px solid #0f0' }}>
          <h3>2. EXECUTION LOG</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h3>3. MESH STATUS ({status.filter(s => s.status === 'online').length} Nodes Active)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {status.map(s => (
            <div key={s.name} style={{ fontSize: '10px', border: '1px solid #333', padding: '5px' }}>
              {s.name}: {s.status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
