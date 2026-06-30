// Code Workspace Component - AegisShield AI
import React, { useState, useEffect } from 'react';
import { FileCode, AlertTriangle, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function CodeWorkspace({ onUpdateMetrics }) {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patching, setPatching] = useState(false);

  useEffect(() => {
    fetchCodebaseFiles();
  }, []);

  const fetchCodebaseFiles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/codebase');
      const data = await res.json();
      setFiles(data.files);
      
      // Set active file default if none selected
      if (data.files.length > 0 && !activeFile) {
        handleSelectFile(data.files[0].path);
      }
    } catch (err) {
      console.error("Error fetching codebase list:", err);
    }
  };

  const handleSelectFile = async (path) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/codebase/file?path=${path}`);
      const fileData = await res.json();
      setFileDetails(fileData);
      
      // Update activeFile path to sync state
      setActiveFile(path);
    } catch (err) {
      console.error("Error loading file contents:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyRemediation = async () => {
    if (!fileDetails || fileDetails.isMitigated || patching) return;
    
    setPatching(true);
    try {
      const res = await fetch('http://localhost:5000/api/codebase/mitigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFile })
      });
      const data = await res.json();
      if (data.success) {
        setFileDetails(data.file);
        onUpdateMetrics(data.metrics);
        // Refresh codebase list to update dot statuses
        fetchCodebaseFiles();
      }
    } catch (err) {
      console.error("Error applying remediation patch:", err);
    } finally {
      setPatching(false);
    }
  };

  // Helper to format code blocks with highlighted ins/del lines
  const renderCodeWithDiff = (code, type) => {
    // Basic text parsing to highlight special blocks
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      let style = {};
      let isIns = false;
      let isDel = false;

      if (type === 'vulnerable') {
        if (line.includes('VULNERABILITY:') || line.includes('WARNING:')) {
          isDel = true;
        }
      } else {
        if (line.includes('MITIGATION:') || line.includes('MITIGATED:') || line.includes('MITIGATION 1') || line.includes('MITIGATION 2') || line.includes('MITIGATION 3')) {
          isIns = true;
        }
      }

      if (isDel) {
        return <del key={idx} style={{ display: 'block', background: 'rgba(255,56,96,0.15)', color: 'var(--accent-red)', padding: '0 0.25rem' }}>{line}</del>;
      }
      if (isIns) {
        return <ins key={idx} style={{ display: 'block', background: 'rgba(5,242,139,0.15)', color: 'var(--accent-emerald)', padding: '0 0.25rem', textDecoration: 'none' }}>{line}</ins>;
      }
      return <span key={idx} style={{ display: 'block' }}>{line}</span>;
    });
  };

  return (
    <div className="workspace-grid">
      
      {/* File Explorer List */}
      <div className="file-explorer">
        <h3 className="sidebar-title">Codebase Explorer</h3>
        {files.map(f => (
          <div
            key={f.path}
            className={`explorer-item ${activeFile === f.path ? 'active' : ''}`}
            onClick={() => handleSelectFile(f.path)}
          >
            <div className="file-info">
              <FileCode size={16} style={{ color: f.isMitigated ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
              <span>{f.name}</span>
            </div>
            <span className={`status-dot ${f.isMitigated ? 'secured' : ''}`}></span>
          </div>
        ))}
      </div>

      {/* Code Editor and side-by-side Diffs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {loading || !fileDetails ? (
          <div className="glass-panel" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Loading virtual codebase...</span>
          </div>
        ) : (
          <>
            <div className="glass-panel" style={{ paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    File: {fileDetails.name} 
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                      {fileDetails.language.toUpperCase()}
                    </span>
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Category: {fileDetails.category} | CVE reference: {fileDetails.cve}
                  </p>
                </div>
                
                <span className={`severity-badge ${fileDetails.severity.toLowerCase().startsWith('critical') ? 'critical' : 'high'}`}>
                  {fileDetails.severity}
                </span>
              </div>

              {/* Symmetrical Side-by-Side Editor View */}
              <div className="code-split-view">
                {/* Vulnerable Panel */}
                <div className="code-pane">
                  <div className="pane-title" style={{ color: 'var(--accent-red)' }}>
                    <span>Vulnerable Source (Production)</span>
                    <AlertTriangle size={14} />
                  </div>
                  <div className="code-block-display">
                    {renderCodeWithDiff(fileDetails.vulnerable, 'vulnerable')}
                  </div>
                </div>

                {/* Mitigated Panel */}
                <div className="code-pane" style={{ borderStyle: fileDetails.isMitigated ? 'solid' : 'dashed' }}>
                  <div className="pane-title" style={{ color: 'var(--accent-emerald)' }}>
                    <span>Secured Code (Shield Patch)</span>
                    <ShieldCheck size={14} />
                  </div>
                  <div className="code-block-display">
                    {renderCodeWithDiff(fileDetails.secured, 'secured')}
                  </div>
                </div>
              </div>

              {/* Explanation & Patch Apply panel */}
              <div className="patch-desc-box">
                <h4>Vulnerability Analysis & Mitigation Rationale</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.5', marginTop: '0.25rem' }}>
                  {fileDetails.explanation}
                </p>
              </div>

              <div className="action-bar">
                <span style={{ fontSize: '0.85rem', color: fileDetails.isMitigated ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {fileDetails.isMitigated 
                    ? '✓ Secure patch active in code execution branch.' 
                    : '⚠ Code vulnerability is currently active and exploitable.'
                  }
                </span>
                <button
                  className="btn-primary"
                  style={{
                    background: fileDetails.isMitigated 
                      ? 'rgba(5, 242, 139, 0.15)' 
                      : 'linear-gradient(135deg, var(--accent-emerald), #05ba6c)',
                    color: fileDetails.isMitigated ? 'var(--accent-emerald)' : '#fff',
                    border: fileDetails.isMitigated ? '1px solid rgba(5, 242, 139, 0.3)' : 'none',
                    boxShadow: fileDetails.isMitigated ? 'none' : 'var(--shadow-glow-emerald)'
                  }}
                  disabled={fileDetails.isMitigated || patching}
                  onClick={applyRemediation}
                >
                  {patching ? <Cpu className="spin" size={16} /> : <ShieldCheck size={16} />}
                  {fileDetails.isMitigated ? 'Mitigated' : 'Apply Security Patch'}
                </button>
              </div>

            </div>
          </>
        )}
      </div>

    </div>
  );
}
