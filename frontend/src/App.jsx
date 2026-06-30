// Main App Component - AegisShield AI
import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, Zap, Code2, GitMerge, RotateCcw, AlertTriangle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Emulator from './components/Emulator';
import CodeWorkspace from './components/CodeWorkspace';
import SbomVisualizer from './components/SbomVisualizer';
import Login from './components/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [files, setFiles] = useState([]);
  const [policies, setPolicies] = useState({
    sbomSignatureVerify: false,
    zeroTrustAccess: false,
    llmGuardrails: false,
    mfaPolicy: false
  });
  const [metrics, setMetrics] = useState({
    securityScore: 20,
    mitigatedCount: 0,
    totalVulnerabilities: 4,
    meanTimeToDetect: 120,
    meanTimeToMitigate: 240,
    activePolicies: 0
  });
  
  // Track if package.json has been mitigated (passed to SBOM visualizer)
  const [isSbomFixed, setIsSbomFixed] = useState(false);

  useEffect(() => {
    fetchInitialState();
  }, []);

  const fetchInitialState = async () => {
    try {
      // 1. Fetch current policies
      const policyRes = await fetch('http://localhost:5000/api/policies');
      const policyData = await policyRes.json();
      setPolicies(policyData);

      // 2. Fetch codebase status to compute metrics
      const codebaseRes = await fetch('http://localhost:5000/api/codebase');
      const codebaseData = await codebaseRes.json();
      setMetrics(codebaseData.metrics);
      setFiles(codebaseData.files || []);
      
      // Update isSbomFixed flag if package.json has isMitigated true
      const packageFile = codebaseData.files.find(f => f.path === 'package.json');
      if (packageFile) {
        setIsSbomFixed(packageFile.isMitigated);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  const handleTogglePolicy = async (policyName) => {
    try {
      const res = await fetch('http://localhost:5000/api/policies/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyName })
      });
      const data = await res.json();
      if (data.success) {
        setPolicies(data.policies);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Error toggling policy:", err);
    }
  };

  const handleResetSystem = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/codebase/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setPolicies(data.policies);
        setFiles(data.files || []);
        setIsSbomFixed(false);
        alert("System parameters reset to vulnerable state.");
      }
    } catch (err) {
      console.error("Error resetting system:", err);
    }
  };

  // Callback to sync metrics when code is mitigated or simulation updates metrics
  const handleUpdateMetrics = (newMetrics) => {
    setMetrics(newMetrics);
    // Refresh package mitigation state
    fetchInitialState();
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthenticated(true); }} />;
  }

  return (
    <div className="app-container">
      
      {/* Header Panel */}
      <header className="app-header">
        <div className="logo-container">
          <Shield className="logo-icon" size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="logo-text">AegisShield AI</span>
              <span className="logo-badge">V1.0</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next-Gen Supply Chain Security & Active Threat Mitigation</span>
          </div>
        </div>

        {/* Central Tab Controls */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} />
            Overview
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'emulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('emulator')}
          >
            <Zap size={16} />
            Threat Emulator
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'codebase' ? 'active' : ''}`}
            onClick={() => setActiveTab('codebase')}
          >
            <Code2 size={16} />
            Vulnerability Workspace
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'sbom' ? 'active' : ''}`}
            onClick={() => setActiveTab('sbom')}
          >
            <GitMerge size={16} />
            Supply Chain (SBOM)
          </button>
        </nav>

        {/* Global Action Header Button */}
        <button 
          onClick={handleResetSystem}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(255, 56, 96, 0.05)',
            border: '1px solid rgba(255, 56, 96, 0.2)',
            color: 'var(--accent-red)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={14} />
          Reset Environment
        </button>
      </header>

      {/* Warning alert if score is low */}
      {metrics.securityScore < 50 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          background: 'rgba(255, 56, 96, 0.08)',
          border: '1px solid rgba(255, 56, 96, 0.15)',
          borderRadius: '12px',
          marginTop: '1.25rem',
          fontSize: '0.85rem',
          color: 'var(--accent-red)'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span><strong>Critical Warning:</strong> System security posture score is vulnerable ({metrics.securityScore}/100). Apply mitigation patches in the Vulnerability Workspace to lock down codebase risks.</span>
        </div>
      )}

      {/* Main Views Container */}
      <main style={{ flexGrow: 1, marginTop: '1.5rem', paddingBottom: '3rem' }}>
        {activeTab === 'dashboard' && <Dashboard metrics={metrics} files={files} currentUser={currentUser} />}
        {activeTab === 'emulator' && (
          <Emulator 
            policies={policies} 
            onTogglePolicy={handleTogglePolicy} 
            onUpdateMetrics={handleUpdateMetrics} 
          />
        )}
        {activeTab === 'codebase' && (
          <CodeWorkspace 
            onUpdateMetrics={handleUpdateMetrics} 
          />
        )}
        {activeTab === 'sbom' && <SbomVisualizer isSbomFixed={isSbomFixed} />}
      </main>

    </div>
  );
}
