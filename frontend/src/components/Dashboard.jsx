// Dashboard Component - AegisShield AI
import React from 'react';
import { Shield, AlertTriangle, Clock, ShieldCheck, TrendingUp, BarChart3, Radio } from 'lucide-react';

export default function Dashboard({ metrics, files = [] }) {
  const { securityScore, mitigatedCount, totalVulnerabilities, meanTimeToDetect, meanTimeToMitigate, activePolicies } = metrics;

  // Calculate SVG stroke parameters for circular score dial
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (securityScore / 100) * circumference;

  const getScoreColor = () => {
    if (securityScore < 50) return 'var(--accent-red)';
    if (securityScore < 80) return 'var(--accent-amber)';
    return 'var(--accent-emerald)';
  };

  // --- DYNAMIC RADAR CHART CALCULATION ---
  // Vertices of the pentagon
  const cx = 160;
  const cy = 150;
  const maxR = 100;
  const numSides = 5;
  const angles = Array.from({ length: numSides }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / numSides);

  // Map files and policies to 5 risk profile axes
  const isMitigated = (path) => {
    const file = files.find(f => f.path === path);
    return file ? file.isMitigated : false;
  };

  const axisValues = [
    isMitigated('package.json') ? 100 : 20,       // Supply Chain Axis
    isMitigated('apiGateway.js') ? 100 : 20,      // API Security Axis
    isMitigated('llmAgent.js') ? 100 : 20,        // AI Safety Axis
    isMitigated('authController.js') ? 100 : 20,  // Session Integrity Axis
    (activePolicies / 4) * 100                    // Network Policies Axis
  ];

  // Helper to compute polygon points string
  const getPolygonPoints = (values, rMultiplier = 1) => {
    return angles.map((angle, i) => {
      const value = values[i] || 20;
      const r = (value / 100) * maxR * rMultiplier;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Baseline Grid polygon coordinates (100%, 75%, 50%, 25%)
  const getGridPoints = (level) => {
    return angles.map(angle => {
      const r = maxR * level;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getVertexLabelCoords = (angle, label) => {
    const r = maxR + 22; // place label slightly outside the radar boundary
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    // Text anchor alignments based on angle position
    let textAnchor = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    if (Math.cos(angle) < -0.1) textAnchor = 'end';
    
    return { x, y: y + 4, textAnchor };
  };

  const labels = [
    "Supply Chain",
    "API Security",
    "AI Safety",
    "Session Auth",
    "Policies"
  ];

  const downloadHtmlReport = () => {
    const dateStr = new Date().toLocaleString();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AegisShield AI Security Audit Report</title>
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
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 30px;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg-secondary);
      border: 1px solid rgba(0, 242, 254, 0.2);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 0 30px rgba(0, 242, 254, 0.1);
    }
    .header {
      border-bottom: 2px solid rgba(255,255,255,0.05);
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      background: linear-gradient(135deg, #fff, var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      font-size: 11px;
      font-weight: bold;
      padding: 4px 10px;
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid var(--accent-cyan);
      color: var(--accent-cyan);
      border-radius: 4px;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .score-box {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .score-num {
      font-size: 72px;
      font-weight: 900;
      line-height: 1;
    }
    .metric-table {
      width: 100%;
      border-collapse: collapse;
    }
    .metric-table th, .metric-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .metric-table th {
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
    }
    .status-pill {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .status-pill.secured {
      background: rgba(5, 242, 139, 0.1);
      color: var(--accent-emerald);
      border: 1px solid var(--accent-emerald);
    }
    .status-pill.vulnerable {
      background: rgba(255, 56, 96, 0.1);
      color: var(--accent-red);
      border: 1px solid var(--accent-red);
    }
    .section-title {
      font-size: 18px;
      margin-top: 30px;
      margin-bottom: 15px;
      color: var(--accent-cyan);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 5px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="title">AegisShield AI Security Audit Report</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">Generated on: ${dateStr}</div>
      </div>
      <div class="badge">Compliance Verified</div>
    </div>

    <div class="grid">
      <div class="score-box">
        <div class="score-num" style="color: ${securityScore < 50 ? 'var(--accent-red)' : securityScore < 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)'}">${securityScore}</div>
        <div style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-top: 10px;">Security Posture Index</div>
      </div>
      
      <div>
        <h3>Executive Summary</h3>
        <p style="font-size: 14px; color: var(--text-muted); margin: 0;">
          This document verifies the operational security capabilities of the Target Application hosting environment. 
          AegisShield AI audited the codebase structure and active Zero-Trust policy definitions to calculate 
          the overall posture index. Currently, ${mitigatedCount} of ${totalVulnerabilities} audited codebase modules are cryptographically secured and patched.
        </p>
      </div>
    </div>

    <div class="section-title">Audit Metrics & Response Benchmarks</div>
    <table class="metric-table">
      <thead>
        <tr>
          <th>Metric Parameters</th>
          <th>Measured Response</th>
          <th>Rating / Threshold</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Mean Time to Detect (MTTD)</td>
          <td>${meanTimeToDetect} seconds</td>
          <td style="color: var(--accent-emerald)">${meanTimeToDetect < 30 ? 'Excellent' : 'Nominal'}</td>
        </tr>
        <tr>
          <td>Mean Time to Mitigate (MTTM)</td>
          <td>${meanTimeToMitigate} seconds</td>
          <td style="color: var(--accent-emerald)">${meanTimeToMitigate < 60 ? 'Immediate Remediator' : 'Nominal'}</td>
        </tr>
        <tr>
          <td>Active Gateway Guardrail Policies</td>
          <td>${activePolicies} policies enabled</td>
          <td>${activePolicies === 4 ? 'Full Gatekeepers' : 'Partial Gates'}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Audited Codebase Security Checkmarks</div>
    <table class="metric-table">
      <thead>
        <tr>
          <th>Source Module</th>
          <th>Vulnerability Reference</th>
          <th>Risk Category</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${files.map(f => `
          <tr>
            <td><strong>${f.name}</strong></td>
            <td>${f.cve}</td>
            <td>${f.category}</td>
            <td>
              <span class="status-pill ${f.isMitigated ? 'secured' : 'vulnerable'}">
                ${f.isMitigated ? 'Mitigated / Signed' : 'Vulnerable'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      This is a cryptographically simulated validation report. Powered by AegisShield AI Security Suite.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AegisShield_Audit_Report_' + new Date().toISOString().split('T')[0] + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Metrics & Dial Row */}
      <div className="dashboard-grid">
        
        {/* Score Dial Card */}
        <div className="glass-panel score-card">
          <h3 className="sidebar-title" style={{ marginBottom: '1.5rem' }}>Security Posture Score</h3>
          <div className="score-dial-wrapper">
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="var(--bg-tertiary)"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={getScoreColor()}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s' }}
              />
            </svg>
            <div className="score-value-overlay">
              <span className="score-number" style={{ color: getScoreColor() }}>{securityScore}</span>
              <span className="score-label">Posture Index</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', lineHeight: '1.4' }}>
            {securityScore === 100 
              ? 'All zero-trust policies active and code vulnerabilities successfully mitigated.' 
              : 'Warning: Active vulnerabilities detected. Configure policies and remediate code to reach 100% security.'
            }
          </p>
        </div>

        {/* Dynamic Pentagon Radar Chart */}
        <div className="glass-panel score-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Radio size={16} className="pulse-glow" style={{ color: 'var(--accent-cyan)' }} />
            Dynamic OWASP Risk Profile Radar
          </h3>
          <div style={{ display: 'flex', width: '100%', height: '240px', justifyContent: 'center' }}>
            <svg width="320" height="270">
              <defs>
                <radialGradient id="radarGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.05" />
                </radialGradient>
              </defs>

              {/* Grid Lines (Concentric rings) */}
              <polygon points={getGridPoints(1)} fill="transparent" stroke="var(--border-muted)" strokeWidth="1" strokeDasharray="3,3" />
              <polygon points={getGridPoints(0.75)} fill="transparent" stroke="var(--border-muted)" strokeWidth="0.75" strokeDasharray="3,3" />
              <polygon points={getGridPoints(0.5)} fill="transparent" stroke="var(--border-muted)" strokeWidth="0.75" strokeDasharray="3,3" />
              <polygon points={getGridPoints(0.25)} fill="transparent" stroke="var(--border-muted)" strokeWidth="0.75" strokeDasharray="3,3" />

              {/* Radial Spokes */}
              {angles.map((angle, i) => {
                const x = cx + maxR * Math.cos(angle);
                const y = cy + maxR * Math.sin(angle);
                return (
                  <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-muted)" strokeWidth="0.8" />
                );
              })}

              {/* Active Radar Value Polygon */}
              <polygon 
                points={getPolygonPoints(axisValues)} 
                fill="url(#radarGlowGrad)" 
                stroke="var(--accent-cyan)" 
                strokeWidth="2.5"
                style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />

              {/* Radar Vertices Dots */}
              {angles.map((angle, i) => {
                const val = axisValues[i] || 20;
                const r = (val / 100) * maxR;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                return (
                  <circle 
                    key={i} 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="var(--accent-cyan)" 
                    style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                );
              })}

              {/* Labels */}
              {angles.map((angle, i) => {
                const coords = getVertexLabelCoords(angle, labels[i]);
                return (
                  <text
                    key={i}
                    x={coords.x}
                    y={coords.y}
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor={coords.textAnchor}
                    fontFamily="var(--font-sans)"
                  >
                    {labels[i]}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Mitigations Metrics */}
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Remediated Vulnerabilities</span>
            <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div>
            <div className="metric-value">
              {mitigatedCount}
              <span className="metric-unit">/ {totalVulnerabilities}</span>
            </div>
            <div className="metric-footer">
              <span style={{ color: mitigatedCount === totalVulnerabilities ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {mitigatedCount === totalVulnerabilities ? 'Clean Codebase' : `${totalVulnerabilities - mitigatedCount} pending patches`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Advanced Charting Panel: Incident Latency (Line) & Threat Distribution (Bar) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Incident Mitigation Timeline - SVG Line Chart */}
        <div className="glass-panel">
          <h3 className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
            Mitigation Response Timeline
          </h3>
          <div style={{ height: '170px', width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 400 170" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGlowCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGlowAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-amber)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--accent-amber)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="var(--border-muted)" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-muted)" strokeWidth="0.5" />
              <line x1="0" y1="130" x2="400" y2="130" stroke="var(--border-muted)" strokeWidth="0.5" />

              {/* Area Plots */}
              {/* MTTD Area (Cyan) */}
              <path 
                d={`M 0 140 L 100 120 L 200 95 L 300 70 L 400 ${140 - (120 - meanTimeToDetect)*0.8} L 400 160 L 0 160 Z`}
                fill="url(#lineGlowCyan)"
              />
              {/* MTTM Area (Amber) */}
              <path 
                d={`M 0 155 L 100 140 L 200 110 L 300 80 L 400 ${155 - (240 - meanTimeToMitigate)*0.5} L 400 160 L 0 160 Z`}
                fill="url(#lineGlowAmber)"
              />

              {/* Line Plots */}
              {/* MTTD Line */}
              <path 
                d={`M 0 140 L 100 120 L 200 95 L 300 70 L 400 ${140 - (120 - meanTimeToDetect)*0.8}`}
                fill="transparent"
                stroke="var(--accent-cyan)"
                strokeWidth="2"
                style={{ transition: 'all 0.8s' }}
              />
              {/* MTTM Line */}
              <path 
                d={`M 0 155 L 100 140 L 200 110 L 300 80 L 400 ${155 - (240 - meanTimeToMitigate)*0.5}`}
                fill="transparent"
                stroke="var(--accent-amber)"
                strokeWidth="2"
                style={{ transition: 'all 0.8s' }}
              />

              {/* Dots */}
              <circle cx="400" cy={140 - (120 - meanTimeToDetect)*0.8} r="4" fill="var(--accent-cyan)" style={{ transition: 'all 0.8s' }} />
              <circle cx="400" cy={155 - (240 - meanTimeToMitigate)*0.5} r="4" fill="var(--accent-amber)" style={{ transition: 'all 0.8s' }} />
            </svg>
            
            {/* Legend Overlay */}
            <div style={{ display: 'flex', gap: '1rem', position: 'absolute', bottom: '0', left: '0', fontSize: '0.7rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-cyan)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></span>
                Detection Latency: {meanTimeToDetect}s
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }}></span>
                Mitigation Response: {meanTimeToMitigate}s
              </span>
            </div>
          </div>
        </div>

        {/* Threat prevalence (Horizontal Bar Chart) */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} style={{ color: 'var(--accent-cyan)' }} />
            Annual Penetration Vector Distribution
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Prevailing exploit techniques classified by global breach logs.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Bar 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Supply Chain Injection (Log4j/XZ Utils)</span>
                <span style={{ color: 'var(--accent-red)' }}>38%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '38%', background: 'linear-gradient(90deg, var(--accent-red), #e01b44)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Bar 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Identity Spoofing & Phishing (AiTM Cookie Theft)</span>
                <span style={{ color: 'var(--accent-amber)' }}>29%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '29%', background: 'linear-gradient(90deg, var(--accent-amber), #d6ab00)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Bar 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Broken API Authorization (BOLA/IDOR)</span>
                <span style={{ color: 'var(--accent-purple)' }}>22%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '22%', background: 'linear-gradient(90deg, var(--accent-purple), #7c3aed)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* Bar 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Adversarial Prompt Injections</span>
                <span style={{ color: 'var(--accent-cyan)' }}>11%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '11%', background: 'linear-gradient(90deg, var(--accent-cyan), #00b8ff)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Overview Context Panel */}
      <div className="glass-panel">
        <h3 className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Shield size={20} style={{ color: 'var(--accent-cyan)' }} />
          Enterprise Cyber Security Posture Analysis
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
          AegisShield monitors internal code commits, dependency signatures, and runtime endpoints in real time. 
          By combining **Zero-Trust Network Access policies** with **Automated Code Remediation**, we can reduce the risk profile 
          of modern attacks. Enable defensive protocols in the **Threat Emulator** tab, or apply patches inside the **Vulnerability Workspace** 
          to observe mitigation effectiveness in real time.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Report integrity certified by AegisShield AI Security Engine.
          </span>
          <button 
            className="btn-primary" 
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-emerald), #05ba6c)',
              boxShadow: 'var(--shadow-glow-emerald)'
            }}
            onClick={downloadHtmlReport}
          >
            <ShieldCheck size={16} />
            Download Security Audit Report
          </button>
        </div>
      </div>

    </div>
  );
}
