// Threat Emulator Component - AegisShield AI
import React, { useState, useEffect, useRef } from 'react';
import { Play, Shield, RefreshCw, Terminal, Globe, Server, Database, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const SCENARIOS = [
  {
    id: "supply_chain",
    name: "Supply Chain Backdoor",
    cve: "CVE-2026-38291",
    severity: "critical",
    severityText: "CRITICAL 10.0",
    desc: "Simulates an XZ-style malicious backdoor hidden in a deep transitive dependency. Triggering postinstall executes code stealing environment variables.",
    policyRequired: "sbomSignatureVerify",
    policyLabel: "SBOM Signature Verification"
  },
  {
    id: "api_bola",
    name: "API BOLA Exploit",
    cve: "OWASP-API1:2023",
    severity: "high",
    severityText: "HIGH 8.5",
    desc: "Attempts to scrape client billing invoices horizontally by incrementing invoice IDs in REST API endpoints. Exploits missing ownership logic.",
    policyRequired: "zeroTrustAccess",
    policyLabel: "Zero-Trust ABAC Proxy"
  },
  {
    id: "prompt_injection",
    name: "AI Prompt Injection",
    cve: "OWASP-LLM01",
    severity: "high",
    severityText: "HIGH 8.2",
    desc: "Triggers adversarial prompt injections into the support chatbot. Attacker bypasses agent context to extract system API keys.",
    policyRequired: "llmGuardrails",
    policyLabel: "LLM Input/Output Guardrails"
  },
  {
    id: "phishing",
    name: "Session Hijacking (Phish)",
    cve: "OWASP-A01:2021",
    severity: "high",
    severityText: "HIGH 8.1",
    desc: "Simulates an Adversary-in-the-Middle (AiTM) phishing site proxy capturing enterprise cookies to hijack active sessions.",
    policyRequired: "mfaPolicy",
    policyLabel: "FIDO2 WebAuthn Policy"
  }
];

export default function Emulator({ policies, onTogglePolicy, onUpdateMetrics }) {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [animationState, setAnimationState] = useState('idle'); // idle, running, breached, blocked
  const [simulationResult, setSimulationResult] = useState(null);
  
  const terminalEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Clean up SSE connection
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const runSimulation = () => {
    if (isSimulating) return;

    setLogs([]);
    setIsSimulating(true);
    setSimulationResult(null);
    setAnimationState('running');

    const backendUrl = `http://localhost:5000/api/simulate?type=${activeScenario.id}`;
    
    // Connect to Server-Sent Events stream
    const source = new EventSource(backendUrl);
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'log') {
        setLogs(prev => [...prev, data.log]);
      } 
      else if (data.type === 'complete') {
        setSimulationResult(data.result);
        onUpdateMetrics(data.metrics);
        
        if (data.result.blocked) {
          setAnimationState('blocked');
        } else {
          setAnimationState('breached');
        }

        setIsSimulating(false);
        source.close();
      }
    };

    source.onerror = (err) => {
      console.error("SSE stream error: ", err);
      setLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        level: "FAIL",
        source: "System",
        message: "Simulation stream disconnected unexpectedly."
      }]);
      setIsSimulating(false);
      setAnimationState('idle');
      source.close();
    };
  };

  const getFlowAnimationClass = () => {
    if (animationState === 'running') return 'connection-flow-dot';
    if (animationState === 'blocked') return 'connection-flow-dot blocked';
    return '';
  };

  return (
    <div className="emulator-grid">
      
      {/* Sidebar: Scenarios and Policies */}
      <div className="scenario-sidebar">
        <h3 className="sidebar-title">Select Cyber Threat</h3>
        {SCENARIOS.map(sc => (
          <button
            key={sc.id}
            className={`scenario-card ${activeScenario.id === sc.id ? 'active' : ''}`}
            onClick={() => {
              if (!isSimulating) {
                setActiveScenario(sc);
                setLogs([]);
                setSimulationResult(null);
                setAnimationState('idle');
              }
            }}
            disabled={isSimulating}
          >
            <div className="scenario-header">
              <span className="scenario-name">{sc.name}</span>
              <span className={`severity-badge ${sc.severity}`}>{sc.severityText}</span>
            </div>
            <p className="scenario-desc">{sc.desc}</p>
          </button>
        ))}

        <h3 className="sidebar-title" style={{ marginTop: '1rem' }}>Defense Guardrails</h3>
        <div className="glass-panel policy-panel">
          {SCENARIOS.map(sc => (
            <div key={sc.id} className="policy-row">
              <div className="policy-info">
                <span className="policy-name">{sc.policyLabel}</span>
                <span className="policy-desc">{sc.cve} Mitigation</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={policies[sc.policyRequired] || false}
                  onChange={() => onTogglePolicy(sc.policyRequired)}
                  disabled={isSimulating}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Simulation Canvas & Terminal */}
      <div className="emulator-main">
        
        {/* Network Flow Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="emulator-header-controls">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeScenario.name} Simulation</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Standards: OWASP Top 10 | CycloneDX SBOM Security</p>
            </div>
            <button
              className="btn-primary"
              onClick={runSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? <RefreshCw className="spin" size={16} /> : <Play size={16} />}
              {isSimulating ? 'Emulating...' : 'Run Simulation'}
            </button>
          </div>

          {/* Network Visualizer */}
          <div className="network-viz">
            {/* Flow dot animation */}
            <div className={getFlowAnimationClass()}></div>

            {/* Attacker Node */}
            <div className="network-node">
              <div className={`node-icon-wrapper active`}>
                <Globe size={24} />
              </div>
              <span className="node-label">Attacker (C2)</span>
            </div>

            {/* Gateway / Policy Proxy Node */}
            <div className="network-node">
              <div className={`node-icon-wrapper 
                ${animationState === 'blocked' ? 'mitigated' : ''} 
                ${animationState === 'running' ? 'active' : ''}
              `}>
                <Shield size={24} />
              </div>
              <span className="node-label">Policy Proxy</span>
            </div>

            {/* Main Application Node */}
            <div className="network-node">
              <div className={`node-icon-wrapper 
                ${animationState === 'breached' ? 'breached' : ''} 
                ${animationState === 'running' ? 'active' : ''}
              `}>
                <Server size={24} />
              </div>
              <span className="node-label">App Host</span>
            </div>

            {/* Database Node */}
            <div className="network-node">
              <div className={`node-icon-wrapper 
                ${animationState === 'breached' ? 'breached' : ''}
                ${animationState === 'running' ? 'active' : ''}
              `}>
                <Database size={24} />
              </div>
              <span className="node-label">Data Store</span>
            </div>
          </div>
        </div>

        {/* Live Logs Terminal */}
        <div className="terminal-wrapper">
          <div className="terminal-header">
            <div className="terminal-bullets">
              <span className="bullet red"></span>
              <span className="bullet yellow"></span>
              <span className="bullet green"></span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Terminal size={14} /> LIVE EXPLOIT LOGS
            </span>
            <span style={{ fontSize: '0.7rem' }}>localhost:5000</span>
          </div>
          <div className="terminal-logs">
            {logs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>Idle. Click 'Run Simulation' to execute threat vectors...</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-time">[{log.time}]</span>
                  <span className={`log-level ${log.level.toLowerCase()}`}>{log.level}</span>
                  <span className="log-source">[{log.source}]</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Post-Simulation Results */}
        {simulationResult && (
          <div className={`alert-popup ${simulationResult.blocked ? 'success' : 'danger'}`}>
            {simulationResult.blocked ? (
              <ShieldCheck size={28} style={{ flexShrink: 0 }} />
            ) : (
              <ShieldAlert size={28} style={{ flexShrink: 0 }} />
            )}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem' }}>
                {simulationResult.blocked ? 'Attack Mitigated Successfully!' : 'System Breach Confirmed!'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                <strong>Vulnerability:</strong> {simulationResult.attacked} | <strong>Mitigation:</strong> {simulationResult.mitigatedBy}
                <br />
                <span style={{ color: '#fff', display: 'inline-block', marginTop: '0.25rem' }}>
                  {simulationResult.technicalDetail}
                </span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Inline helper to support ShieldCheck
function ShieldCheck({ size, style }) {
  return <CheckCircle size={size} style={style} />;
}
