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
  const [soarTriggered, setSoarTriggered] = useState(false);
  const [soarLogs, setSoarLogs] = useState([]);
  const [isSoarRunning, setIsSoarRunning] = useState(false);
  
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
    setSoarTriggered(false);
    setSoarLogs([]);
    setIsSoarRunning(false);
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

  const triggerSoarContainment = () => {
    if (isSoarRunning || soarTriggered) return;
    setIsSoarRunning(true);
    setSoarLogs([]);

    const steps = [
      "SOAR Handshake with Kubernetes cluster api gateway...",
      "Isolating container node 'app-host-prod-01' (IP 10.244.0.12)...",
      "Updating Cloudflare WAF blocklists: Added IP 185.190.140.23 (Attacker C2)...",
      "Terminating active sessions on user authentication keys...",
      "Threat contained. Container isolated. WAF block rules active."
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setSoarLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          text: steps[current]
        }]);
        current++;
      } else {
        clearInterval(interval);
        setIsSoarRunning(false);
        setSoarTriggered(true);
        setAnimationState('blocked');
      }
    }, 450);
  };

  const downloadIncidentReport = () => {
    const dateStr = new Date().toLocaleString();
    const isMitigated = simulationResult.blocked || soarTriggered;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Incident Forensics Audit Report - ${activeScenario.name}</title>
  <style>
    :root {
      --bg-primary: #060913;
      --bg-secondary: #0d1222;
      --accent-cyan: #00f2fe;
      --accent-emerald: #05f28b;
      --accent-red: #ff3860;
      --accent-amber: #fecb00;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }
    body {
      background: var(--bg-primary);
      color: var(--text-main);
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 30px;
      line-height: 1.6;
    }
    .report-box {
      max-width: 800px;
      margin: 0 auto;
      background: var(--bg-secondary);
      border: 1px solid rgba(255, 56, 96, 0.2);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 0 35px rgba(255, 56, 96, 0.08);
    }
    .header {
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
    }
    .timeline {
      background: rgba(0,0,0,0.3);
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      margin-top: 15px;
    }
    .log-line {
      display: flex;
      gap: 10px;
      margin-bottom: 5px;
    }
    .log-time { color: var(--text-muted); }
    .log-source { color: var(--accent-cyan); }
    .status-badge {
      font-size: 12px;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-badge.remediated {
      background: rgba(5, 242, 139, 0.1);
      color: var(--accent-emerald);
      border: 1px solid var(--accent-emerald);
    }
    .status-badge.active {
      background: rgba(255, 56, 96, 0.1);
      color: var(--accent-red);
      border: 1px solid var(--accent-red);
    }
  </style>
</head>
<body>
  <div class="report-box" style="border-color: ${isMitigated ? 'rgba(5, 242, 139, 0.2)' : 'rgba(255, 56, 96, 0.2)'}">
    <div class="header">
      <div>
        <h1 style="margin: 0; font-size: 22px; color: ${isMitigated ? 'var(--accent-emerald)' : 'var(--accent-red)'}">
          ${isMitigated ? 'SECURED: Blocked Attack Forensics' : 'CRITICAL: Breach Containment Forensics'}
        </h1>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">Incident Reference: #${Math.floor(Math.random()*900000 + 100000)}</div>
      </div>
      <span class="status-badge ${isMitigated ? 'remediated' : 'active'}">
        ${isMitigated ? 'Contained / Mitigated' : 'Breach Active'}
      </span>
    </div>

    <h3>Incident Parameters</h3>
    <p><strong>Vector Target:</strong> ${activeScenario.name} (${activeScenario.cve})</p>
    <p><strong>Exploit Severity:</strong> ${activeScenario.severityText}</p>
    <p><strong>Incident Datetime:</strong> ${dateStr}</p>
    
    <h3>Exploit Execution Timeline Logs</h3>
    <div class="timeline">
      ${logs.map(l => '<div class="log-line"><span class="log-time">[' + l.time + ']</span> <span style="color: ' + (l.level === 'MALICIOUS' ? 'var(--accent-red)' : 'var(--accent-cyan)') + '">[' + l.level + ']</span> <span class="log-source">[' + l.source + ']</span> <span>' + l.message + '</span></div>').join('')}
    </div>

    ${soarLogs.length > 0 ? '<h3>SOAR Automated Containment Playbook Actions</h3><div class="timeline" style="border: 1px solid rgba(5, 242, 139, 0.2);">' + soarLogs.map(s => '<div class="log-line"><span class="log-time">[' + s.time + ']</span> <span style="color: var(--accent-emerald)">[CONTAINMENT]</span> <span>' + s.text + '</span></div>').join('') + '</div>' : ''}

    <div style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; font-size: 12px; color: var(--text-muted);">
      This report is cryptographically compiled by the AegisShield Incident Response (SOAR) engine.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AegisShield_Incident_Report_' + activeScenario.id + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div className={`alert-popup ${simulationResult.blocked ? 'success' : 'danger'}`} style={{ width: '100%' }}>
              {simulationResult.blocked ? (
                <ShieldCheck size={28} style={{ flexShrink: 0 }} />
              ) : (
                <ShieldAlert size={28} style={{ flexShrink: 0 }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
                <button 
                  className="btn-primary"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'none',
                    fontSize: '0.8rem',
                    padding: '0.5rem 1rem'
                  }}
                  onClick={downloadIncidentReport}
                >
                  Download incident Report
                </button>
              </div>
            </div>

            {/* SOAR Active Playbooks Panel */}
            {!simulationResult.blocked && (
              <div className="glass-panel" style={{
                background: 'linear-gradient(135deg, rgba(255, 56, 96, 0.05), rgba(13, 18, 34, 0.8))',
                borderColor: soarTriggered ? 'rgba(5, 242, 139, 0.25)' : 'rgba(255, 56, 96, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: soarTriggered ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                      {soarTriggered ? '✓ SOAR CONTAINMENT ACTIVE' : '⚠ SOAR INCIDENT RESPONSE PORTAL'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {soarTriggered ? 'System isolated and threat blocked.' : 'Unmitigated exploit payload active. Containment recommended.'}
                    </p>
                  </div>
                  
                  {!soarTriggered && (
                    <button
                      className="btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-emerald), #05ba6c)',
                        boxShadow: 'var(--shadow-glow-emerald)',
                        fontSize: '0.85rem'
                      }}
                      disabled={isSoarRunning}
                      onClick={triggerSoarContainment}
                    >
                      {isSoarRunning ? <RefreshCw className="spin" size={14} /> : <Shield size={14} />}
                      Execute Quarantine Playbook
                    </button>
                  )}
                </div>

                {/* SOAR logs console */}
                {(isSoarRunning || soarLogs.length > 0) && (
                  <div className="scanner-log-console" style={{ height: '90px', background: '#02040a', border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                    {soarLogs.map((s, idx) => (
                      <div key={idx} style={{ color: 'var(--accent-emerald)', marginBottom: '0.15rem' }}>
                        [{s.time}] {s.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
