'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Cpu, Database, Play, CheckCircle2, 
  Terminal, Server, RefreshCw, BarChart2, Globe, Clock 
} from 'lucide-react';

export default function PolyMarketDashboard() {
  // Form state
  const [title, setTitle] = useState('iPhone 15 Pro Max');
  const [price, setPrice] = useState('1199');
  const [category, setCategory] = useState('electronics');
  const [sellerId, setSellerId] = useState('vendor_premium_01');
  const [location, setLocation] = useState('Cluj-Napoca');

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [report, setReport] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Nodes status
  const [nodes, setNodes] = useState<any[]>([]);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  // Flow steps for visual SVG graph mapping
  const flowSteps = [
    { name: 'Haskell', service: 'Haskell-Validator', role: 'Contract Validation' },
    { name: 'Prolog', service: 'Prolog-Fraud', role: 'Fraud Guard' },
    { name: 'Julia', service: 'Julia-Stats', role: 'Pricing Deviation' },
    { name: 'R-Stats', service: 'R-Regression', role: 'Linear Pricing Regression' },
    { name: 'Python', service: 'Python-ML', role: 'Product Recommendations' },
    { name: 'COBOL', service: 'COBOL-Ledger', role: 'Legacy Ledger Post' },
    { name: 'Assembly', service: 'Assembly-Fibo', role: 'Signature Match' },
    { name: 'Zig', service: 'Zig-Crypto', role: 'SHA-256 Hashing' },
    { name: 'Brainfuck', service: 'Brainfuck-Crypt', role: 'Esoteric Obfuscator' }
  ];

  const fetchStatus = async () => {
    setIsFetchingStatus(true);
    try {
      const res = await fetch('/api/v1/polyglot-status');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setNodes(data);
      } else {
        console.error('Expected array from polyglot-status, got:', data);
      }
    } catch (e) {
      console.error('Failed to fetch status:', e);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const runDistributedTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExecuting) return;

    setIsExecuting(true);
    setReport(null);
    setLogs([]);

    const logEvent = (source: string, msg: string, data?: any) => {
      setLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        source,
        msg,
        data
      }]);
    };

    logEvent('API-Gateway', 'Initiating polyglot mesh transaction...');

    // Simulate animated step propagation
    for (let i = 0; i < flowSteps.length; i++) {
      setActiveStep(i);
      logEvent(flowSteps[i].name, `Invoking ${flowSteps[i].role} pipeline...`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    try {
      const response = await fetch('/api/v1/polyglot-mesh/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: parseFloat(price),
          category,
          sellerId,
          location
        })
      });

      const data = await response.json();
      setReport(data);

      logEvent('Gateway', 'Distributed compute finished!', data);
      data.nodeReports.forEach((node: any) => {
        if (node.status === 'online') {
          logEvent(node.service, `Success: ${JSON.stringify(node.data)}`);
        } else {
          logEvent(node.service, `⚠️ Failed or Timeout! Details: ${JSON.stringify(node.data)}`);
        }
      });

    } catch (err: any) {
      logEvent('Gateway', `❌ Critical Transaction Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
      setActiveStep(null);
      fetchStatus();
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 font-sans pb-12 pt-20 px-4 md:px-8">
      {/* Cyber Glow Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/10">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-purple-600" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                POLYMARKET CORE MESH
              </h1>
            </div>
            <p className="text-slate-400 text-xs font-mono tracking-wider uppercase">
              Distributed Transaction Command Center
            </p>
          </div>

          <div className="flex gap-6">
            <div className="text-left font-mono">
              <div className="text-cyan-400 font-bold text-xl md:text-2xl">
                {Array.isArray(nodes) ? nodes.filter(n => n.status === 'online').length : 0} / {Array.isArray(nodes) ? nodes.length : 0}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Nodes</div>
            </div>
            <button 
              onClick={fetchStatus} 
              disabled={isFetchingStatus}
              className="flex items-center justify-center p-3 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 active:scale-95 transition-all text-slate-400 hover:text-cyan-400"
            >
              <RefreshCw className={`w-5 h-5 ${isFetchingStatus ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Transaction Panel */}
          <div className="xl:col-span-4 space-y-8">
            <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-cyan-300">
                <Play className="w-5 h-5 text-cyan-400 fill-cyan-400/10" />
                Launch New Transaction
              </h2>
              
              <form onSubmit={runDistributedTransaction} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Item Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Price (EUR)</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none cursor-pointer"
                    >
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Garden</option>
                      <option value="vehicles">Vehicles</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Seller ID</label>
                    <input 
                      type="text" 
                      value={sellerId} 
                      onChange={e => setSellerId(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Location</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isExecuting}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold uppercase tracking-widest text-slate-950 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                >
                  {isExecuting ? 'Orchestrating Mesh...' : 'Propose Transaction'}
                </button>
              </form>
            </section>

            {/* Performance Metrics */}
            <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <h2 className="text-lg font-bold mb-4 text-purple-400 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Transaction Metrics
              </h2>
              <div className="grid grid-cols-2 gap-4 font-mono">
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Duration</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">
                    {report ? `${report.durationMs}ms` : '0ms'}
                  </p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                  <p className={`text-xl font-bold mt-1 ${report ? 'text-green-400' : 'text-slate-500'}`}>
                    {report ? report.status : 'PENDING'}
                  </p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Fraud Screen</p>
                  <p className={`text-lg font-bold mt-1 ${
                    report ? (report.nodeReports[1]?.data?.status === 'warning' ? 'text-amber-400' : 'text-green-400') : 'text-slate-500'
                  }`}>
                    {report ? (report.nodeReports[1]?.data?.status === 'warning' ? 'WARN' : 'APPROVED') : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Contract Validate</p>
                  <p className={`text-lg font-bold mt-1 ${
                    report ? (report.nodeReports[0]?.data?.valid ? 'text-green-400' : 'text-red-400') : 'text-slate-500'
                  }`}>
                    {report ? (report.nodeReports[0]?.data?.valid ? 'VALID' : 'INVALID') : 'N/A'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* MIDDLE COLUMN: Flow Mapper */}
          <div className="xl:col-span-5 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-cyan-300">
                <Globe className="w-5 h-5" />
                Global Language Mesh Routing Map
              </h2>
              <p className="text-slate-400 text-xs mb-6 font-mono">
                Visualizing sequence pathways across 9 programming languages
              </p>
            </div>

            {/* Interactive SVG Router Map */}
            <div className="relative w-full aspect-square max-w-[400px] mx-auto my-4">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Connecting Lines with flow animations */}
                {flowSteps.map((step, idx) => {
                  const angle = (idx * 2 * Math.PI) / flowSteps.length - Math.PI / 2;
                  const x2 = 200 + 140 * Math.cos(angle);
                  const y2 = 200 + 140 * Math.sin(angle);
                  const isActive = activeStep === idx;
                  const isCompleted = activeStep !== null && activeStep > idx;

                  return (
                    <g key={`line-${idx}`}>
                      <line 
                        x1="200" 
                        y1="200" 
                        x2={x2} 
                        y2={y2} 
                        stroke={isActive ? '#06b6d4' : isCompleted ? '#ab00ff' : '#1e293b'} 
                        strokeWidth={isActive ? '3' : '1.5'}
                        className="transition-all duration-300"
                      />
                      {isActive && (
                        <circle cx="200" cy="200" r="4" fill="#00f0ff">
                          <animateMotion 
                            path={`M 200 200 L ${x2} ${y2}`} 
                            dur="0.25s" 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Central API Gateway Hub */}
                <circle 
                  cx="200" 
                  cy="200" 
                  r="28" 
                  className={`fill-[#0f172a] stroke-2 transition-all ${isExecuting ? 'stroke-cyan-400 shadow-cyan-500/20' : 'stroke-slate-700'}`} 
                />
                <text x="200" y="195" textAnchor="middle" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace">API</text>
                <text x="200" y="208" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold" fontFamily="monospace">GATEWAY</text>

                {/* Outer Node Circles */}
                {flowSteps.map((step, idx) => {
                  const angle = (idx * 2 * Math.PI) / flowSteps.length - Math.PI / 2;
                  const x = 200 + 140 * Math.cos(angle);
                  const y = 200 + 140 * Math.sin(angle);
                  const isActive = activeStep === idx;
                  const isCompleted = activeStep !== null && activeStep > idx;

                  return (
                    <g key={`node-${idx}`}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="20" 
                        className={`fill-[#07070a] stroke-2 transition-all duration-300 ${
                          isActive 
                            ? 'stroke-cyan-400 fill-cyan-950/20 animate-pulse' 
                            : isCompleted 
                              ? 'stroke-purple-500 fill-purple-950/10' 
                              : 'stroke-slate-800'
                        }`} 
                      />
                      <text 
                        x={x} 
                        y={y + 4} 
                        textAnchor="middle" 
                        fill={isActive ? '#00f0ff' : isCompleted ? '#ab00ff' : '#64748b'} 
                        fontSize="9" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                      >
                        {step.name.substring(0, 4).toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60 font-mono text-[10px] text-slate-500 flex justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span> Idle</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span> Active Route</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Processed</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Nodes Monitoring Grid */}
          <div className="xl:col-span-3 space-y-6">
            <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-300">
                <Server className="w-5 h-5 text-cyan-400" />
                Live Nodes Monitor
              </h2>
              
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {!Array.isArray(nodes) || nodes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs">
                    No active node data found.
                  </div>
                ) : (
                  nodes.map((s: any) => (
                    <div 
                      key={s.name} 
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 hover:bg-slate-900/30 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold font-mono tracking-wide text-slate-300">{s.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Port: {s.port}</p>
                      </div>
                      
                      <div className="flex items-center gap-3.5 font-mono">
                        {s.status === 'online' && (
                          <span className="text-[10px] text-slate-400">{s.latency}ms</span>
                        )}
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          s.status === 'online' ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-red-500 shadow-red-500/50'
                        }`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* BOTTOM PANEL: Console Logs Stream */}
          <div className="xl:col-span-12">
            <section className="bg-slate-950 border border-slate-900 rounded-2xl shadow-xl overflow-hidden shadow-black/80">
              <div className="bg-slate-900/60 px-6 py-4 border-b border-slate-900 flex justify-between items-center">
                <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Distributed Mesh Terminal Output
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Real-time log events</span>
              </div>
              
              <div className="p-6 h-[280px] overflow-y-auto font-mono text-xs space-y-2.5 bg-black/60 scrollbar-thin">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-16">
                    Waiting for transaction initialization... Propose a transaction above.
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-4 items-start leading-relaxed border-b border-slate-950 pb-2">
                      <span className="text-slate-600 text-[10px] select-none shrink-0">{log.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 ${
                        log.source === 'API-Gateway' 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                          : log.source === 'Gateway'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {log.source.toUpperCase()}
                      </span>
                      <div className="flex-1 text-slate-300">
                        <span>{log.msg}</span>
                        {log.data && (
                          <pre className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800/40 text-[11px] text-green-300 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
