'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { 
  Activity, ShieldAlert, Cpu, Database, Play, CheckCircle2, 
  Terminal, Server, RefreshCw, BarChart2, Globe, Clock,
  MapPin, User, Trash2, Image as ImageIcon, UploadCloud, X
} from 'lucide-react';

export default function PolyMarketDashboard() {
  // Form state
  const [title, setTitle] = useState('iPhone 15 Pro Max');
  const [price, setPrice] = useState('1199');
  const [category, setCategory] = useState('electronics');
  const [sellerId, setSellerId] = useState('vendor_premium_01');
  const [location, setLocation] = useState('Cluj-Napoca');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [report, setReport] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Nodes & Listings state
  const [nodes, setNodes] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  // Business logic flow steps mapped to professional enterprise modules
  const flowSteps = [
    { name: 'Schema', service: 'Haskell-Validator', role: 'Formal Schema Contract Validator' },
    { name: 'Fraud', service: 'Prolog-Fraud', role: 'AI Fraud Detection System' },
    { name: 'Deviation', service: 'Julia-Stats', role: 'Pricing Standard Deviation Engine' },
    { name: 'Trend', service: 'R-Regression', role: 'Linear Pricing Regression Model' },
    { name: 'ML AI', service: 'Python-ML', role: 'Product Recommendation Engine' },
    { name: 'Audit', service: 'COBOL-Ledger', role: 'Mainframe Financial Ledger Auditing' },
    { name: 'Hardware', service: 'Assembly-Fibo', role: 'Hardware Signature Verification' },
    { name: 'Binary', service: 'Zig-Crypto', role: 'SHA-256 Binary Checksumming' },
    { name: 'Crypt', service: 'Brainfuck-Crypt', role: 'Esoteric Signature Obfuscator' },
    { name: 'Persist', service: 'Rust-Persist-Core', role: 'Database Core Persistence (Rust)' }
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

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/v1/listings');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setListings(data.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch listings:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchListings();
    const statusInterval = setInterval(fetchStatus, 8000);
    const listingsInterval = setInterval(fetchListings, 12000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(listingsInterval);
    };
  }, []);

  const runDistributedTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExecuting) return;

    setIsExecuting(true);
    setReport(null);
    setLogs([]);

    const logEvent = (source: string, msg: string, data?: any) => {
      const cleanSource = source
        .replace('Haskell-Validator', 'Schema Contract')
        .replace('Prolog-Fraud', 'Fraud Detection')
        .replace('Julia-Stats', 'Price Deviation')
        .replace('R-Regression', 'Linear Regression')
        .replace('Python-ML', 'ML Recommendations')
        .replace('COBOL-Ledger', 'Mainframe Ledger')
        .replace('Assembly-Fibo', 'Hardware Verification')
        .replace('Zig-Crypto', 'SHA-256 Hashing')
        .replace('Brainfuck-Crypt', 'Obfuscation Core')
        .replace('Rust-Persist-Core', 'Rust DB Storage');

      setLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        source: cleanSource,
        msg,
        data
      }]);
    };

    logEvent('API-Gateway', 'Initiating multi-language distributed transaction flow...');

    // Simulate animated step propagation on the SVG grid
    for (let i = 0; i < flowSteps.length; i++) {
      setActiveStep(i);
      logEvent(flowSteps[i].name, `Accessing ${flowSteps[i].role} pipeline...`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    try {
      let imageIds: string[] = uploadedImage?.key ? [uploadedImage.key] : [];
      if (selectedImage && imageIds.length === 0) {
        setIsUploadingImage(true);
        logEvent('C++ Images', `Uploading ${selectedImage.name} to image processing service...`);

        const formData = new FormData();
        formData.append('file', selectedImage);

        const imageResponse = await fetch('/api/v1/images/upload', {
          method: 'POST',
          body: formData
        });

        if (!imageResponse.ok) {
          const details = await imageResponse.json().catch(() => ({}));
          throw new Error(details.error || 'Image upload failed');
        }

        const imageData = await imageResponse.json();
        setUploadedImage(imageData);
        imageIds = [imageData.key];
        logEvent('C++ Images', 'Image converted to WebP and stored in MinIO.', imageData);
      }

      const response = await fetch('/api/v1/polyglot-mesh/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: parseFloat(price),
          category,
          sellerId,
          location,
          imageIds
        })
      });

      const data = await response.json();
      setReport(data);

      logEvent('Gateway', 'Distributed transaction execution finalized!', {
        status: data.status,
        durationMs: data.durationMs,
        mongoId: data.transactionDetails?.mongo_id
      });

      data.nodeReports.forEach((node: any) => {
        if (node.status === 'online') {
          logEvent(node.service, `Processed and validated successfully. Details:`, node.data);
        } else {
          logEvent(node.service, `⚠️ Node offline or timeout. Schema check returned exception. Details:`, node.data);
        }
      });

    } catch (err: any) {
      logEvent('Gateway', `❌ Critical Network Exception: ${err.message}`);
    } finally {
      setIsExecuting(false);
      setIsUploadingImage(false);
      setActiveStep(null);
      fetchStatus();
      fetchListings();
    }
  };

  const markAsSold = async (id: string, sellerId: string) => {
    try {
      const response = await fetch(`/api/v1/listings/${id}/mark-sold`, {
        method: 'POST',
        headers: {
          'x-user-id': sellerId,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        fetchListings();
        fetchStatus();
      } else {
        alert('Failed to mark listing as sold.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteListing = async (id: string, sellerId: string) => {
    try {
      const response = await fetch(`/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': sellerId,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        fetchListings();
        fetchStatus();
      } else {
        alert('Failed to delete listing.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#060609] text-slate-100 font-sans pb-16 pt-24 px-4 md:px-8 relative overflow-x-hidden">
      {/* Premium Obsidian Cyber Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* Header - Enterprise Cockpit Banner */}
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-8 bg-slate-950/40 backdrop-blur-xl border border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-cyan-500 to-purple-600" />
          
          <div>
            <div className="flex items-center gap-3.5 mb-1.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                POLYMARKET TRANSACTION CORE
              </h1>
            </div>
            <p className="text-slate-400 text-xs font-mono tracking-wider uppercase">
              Secure SaaS Cloud Cockpit & Multi-Language Validation Mesh
            </p>
          </div>

          <div className="flex gap-8 items-center">
            <div className="text-left font-mono">
              <div className="text-cyan-400 font-black text-2xl">
                {Array.isArray(nodes) ? nodes.filter(n => n.status === 'online').length : 0} / {Array.isArray(nodes) ? nodes.length : 0}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure Pipelines Active</div>
            </div>
            
            <button 
              onClick={fetchStatus} 
              disabled={isFetchingStatus}
              className="flex items-center justify-center p-3.5 rounded-xl border border-slate-900 bg-slate-950/50 hover:bg-slate-900/60 active:scale-95 transition-all text-slate-400 hover:text-cyan-400 shadow-inner"
            >
              <RefreshCw className={`w-5 h-5 ${isFetchingStatus ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dashboard Control Grids */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Launch New Transaction Form & Metrics */}
          <div className="xl:col-span-4 space-y-8">
            <section className="bg-slate-950/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2.5 text-cyan-300">
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
                    className="w-full bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Price (RON)</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none cursor-pointer"
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
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Location</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 text-cyan-300 font-mono text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-900 bg-slate-950/60 p-3.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Listing Image</label>
                  {selectedImage ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-cyan-300 truncate">{selectedImage.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{Math.ceil(selectedImage.size / 1024)} KB queued for C++ processing</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setUploadedImage(null);
                        }}
                        className="p-2 rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-all"
                        aria-label="Remove selected image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-800 py-4 text-xs font-mono text-slate-500 hover:border-cyan-500/40 hover:text-cyan-300 transition-all">
                      <UploadCloud className="w-4 h-4" />
                      Upload image through C++ image-service
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(event) => {
                          setSelectedImage(event.target.files?.[0] ?? null);
                          setUploadedImage(null);
                        }}
                      />
                    </label>
                  )}
                  {uploadedImage && (
                    <p className="mt-2 text-[10px] text-green-400 font-mono">
                      Stored in MinIO as {uploadedImage.key}
                    </p>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isExecuting || isUploadingImage}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold uppercase tracking-widest text-slate-950 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                >
                  {isUploadingImage ? 'Uploading Image...' : isExecuting ? 'Orchestrating Mesh...' : 'Propose Transaction'}
                </button>
              </form>
            </section>

            {/* Performance Live Metrics */}
            <section className="bg-slate-950/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <h2 className="text-lg font-bold mb-4 text-purple-400 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Performance Metrics
              </h2>
              <div className="grid grid-cols-2 gap-4 font-mono">
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mesh Duration</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">
                    {report ? `${report.durationMs}ms` : '0ms'}
                  </p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Core Status</p>
                  <p className={`text-sm font-bold mt-1.5 ${report ? 'text-green-400 font-black' : 'text-slate-500'}`}>
                    {report ? report.status : 'WAITING'}
                  </p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">AI Fraud Result</p>
                  <p className={`text-sm font-bold mt-1.5 ${
                    report ? (report.nodeReports[1]?.data?.status === 'warning' ? 'text-amber-400' : 'text-green-400') : 'text-slate-500'
                  }`}>
                    {report ? (report.nodeReports[1]?.data?.status === 'warning' ? 'WARN: SENSITIVE' : 'PASSED SECURE') : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Formal Schema</p>
                  <p className={`text-sm font-bold mt-1.5 ${
                    report ? (report.nodeReports[0]?.data?.valid ? 'text-green-400' : 'text-red-400') : 'text-slate-500'
                  }`}>
                    {report ? (report.nodeReports[0]?.data?.valid ? 'VERIFIED VALID' : 'REJECTED') : 'N/A'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* MIDDLE: Circular SVG Routing Network Map */}
          <div className="xl:col-span-5 bg-slate-950/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl min-h-[500px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-cyan-300">
                <Globe className="w-5 h-5 animate-pulse text-cyan-400" />
                Global Transaction Network Routing Map
              </h2>
              <p className="text-slate-400 text-xs mb-6 font-mono">
                Visualizing sequence validation pathways across the polyglot nodes
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
                        stroke={isActive ? '#06b6d4' : isCompleted ? '#ab00ff' : '#111520'} 
                        strokeWidth={isActive ? '3.5' : '1.5'}
                        className="transition-all duration-300"
                      />
                      {isActive && (
                        <circle cx="200" cy="200" r="4" fill="#00f0ff">
                          <animateMotion 
                            path={`M 200 200 L ${x2} ${y2}`} 
                            dur="0.2s" 
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
                  className={`fill-[#050508] stroke-2 transition-all duration-300 ${isExecuting ? 'stroke-cyan-400 shadow-cyan-500/20' : 'stroke-slate-800'}`} 
                />
                <text x="200" y="196" textAnchor="middle" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace">API</text>
                <text x="200" y="209" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold" fontFamily="monospace">GATEWAY</text>

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
                        r="22" 
                        className={`fill-[#030305] stroke-2 transition-all duration-300 ${
                          isActive 
                            ? 'stroke-cyan-400 fill-cyan-950/20 animate-pulse' 
                            : isCompleted 
                              ? 'stroke-purple-500 fill-purple-950/10' 
                              : 'stroke-slate-900'
                        }`} 
                      />
                      <text 
                        x={x} 
                        y={y + 4} 
                        textAnchor="middle" 
                        fill={isActive ? '#00f0ff' : isCompleted ? '#ab00ff' : '#475569'} 
                        fontSize="8.5" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                      >
                        {step.name.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-500 flex justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></span> Idle</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span> Active Pipeline</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Verified Step</span>
            </div>
          </div>

          {/* RIGHT: Live Pipelines Monitor (Zero Ports, Clean Naming) */}
          <div className="xl:col-span-3 space-y-6">
            <section className="bg-slate-950/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-300">
                <Server className="w-5 h-5 text-cyan-400" />
                Live Pipelines Monitor
              </h2>
              
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {!Array.isArray(nodes) || nodes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs">
                    No active node telemetry found.
                  </div>
                ) : (
                  nodes.map((s: any) => (
                    <div 
                      key={s.name} 
                      className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-900 hover:bg-slate-900/10 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold font-mono tracking-wide text-slate-300">
                          {s.name
                            .replace('-Validator', ' Validator')
                            .replace('-Fraud', ' Fraud Shield')
                            .replace('-Stats', ' Analytics')
                            .replace('-Regression', ' Regression Forecaster')
                            .replace('-ML', ' AI Core')
                            .replace('-Ledger', ' Core Ledger')
                            .replace('-Fibo', ' Signature Verifier')
                            .replace('-Crypto', ' Cryptography Engine')
                            .replace('-Crypt', ' Esoteric Cryptography')
                            .replace('-Core', ' Storage Core')}
                        </p>
                        <p className="text-[9px] text-cyan-500/70 font-mono mt-0.5 tracking-wider">
                          Protocol: SECURE HTTP / gRPC
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 font-mono">
                        {s.status === 'online' && (
                          <span className="text-[10px] text-slate-400 font-bold">{s.latency}ms</span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${
                          s.status === 'online' ? 'bg-green-500 shadow-green-500/50 shadow-md' : 'bg-red-500 shadow-red-500/50 shadow-md'
                        }`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* BOTTOM: Glowing Console Logs Terminal Output */}
          <div className="xl:col-span-12">
            <section className="bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-slate-900/40 px-6 py-4 border-b border-slate-900 flex justify-between items-center">
                <h3 className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Distributed Mesh Terminal Output
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Real-time log events</span>
              </div>
              
              <div className="p-6 h-[280px] overflow-y-auto font-mono text-xs space-y-2.5 bg-black/60 scrollbar-thin">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-16">
                    Waiting for transaction initialization... Propose a transaction above to view network routes.
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-4 items-start leading-relaxed border-b border-slate-950 pb-2">
                      <span className="text-slate-600 text-[10px] select-none shrink-0">{log.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0 uppercase border ${
                        log.source === 'API-Gateway' 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                          : log.source === 'Gateway'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {log.source}
                      </span>
                      <div className="flex-1 text-slate-300">
                        <span>{log.msg}</span>
                        {log.data && (
                          <pre className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-900 text-[11px] text-green-300 overflow-x-auto">
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

          {/* BOTTOM CATALOG: Live listings fetched from MongoDB */}
          <div className="xl:col-span-12">
            <section className="bg-slate-950/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
                    <Database className="w-5 h-5" />
                    Live Catalog of Distributed Listings
                  </h2>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    Active records persisted in MongoDB and synchronized via Kafka events
                  </p>
                </div>
                
                <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                  {listings.length} Persisted Items
                </span>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/20 rounded-xl border border-dashed border-slate-900 text-slate-500 font-mono text-sm">
                  No active listings persisted in the database. Propose a transaction above to create one!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map((item) => (
                    <div key={item.id} className="relative group bg-slate-950/80 border border-slate-900 hover:border-cyan-500/50 rounded-xl p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-bl text-[8px] font-mono tracking-widest text-slate-950 font-bold uppercase">
                        Mesh Persistent
                      </div>
                      
                      <div>
                        {item.images?.[0]?.medium && (
                          <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg border border-slate-900 bg-slate-900/40">
                            <NextImage
                              src={item.images[0].medium}
                              alt={item.title}
                              width={640}
                              height={480}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-900 text-[10px] text-cyan-400 font-mono uppercase font-bold">
                            {item.category}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            item.status === 'sold' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1 font-mono tracking-wide">{item.title}</h3>
                        <p className="text-2xl font-black text-purple-400 font-sans">
                          {item.price / 100} <span className="text-xs font-mono text-slate-400">{item.currency || 'RON'}</span>
                        </p>
                        
                        <div className="space-y-2 mt-4 pt-3 border-t border-slate-900 font-mono text-[9px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-600" />
                            <span className="truncate">{item.location?.city || 'Bucuresti'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-600" />
                            <span className="truncate text-slate-400">Seller: {item.seller_id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-5">
                        {item.status !== 'sold' && (
                          <button 
                            onClick={() => markAsSold(item.id, item.seller_id)}
                            className="flex-1 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider transition-all duration-200"
                          >
                            Mark Sold
                          </button>
                        )}
                        <button 
                          onClick={() => deleteListing(item.id, item.seller_id)}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500 bg-red-500/5 hover:bg-red-500/20 text-[10px] font-bold text-red-400 transition-all duration-200"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
