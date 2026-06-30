// Login Component - AegisShield AI Secure Gateway Portal
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Cpu, Fingerprint, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('credentials'); // credentials, fido2
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerLogs, setScannerLogs] = useState([]);
  
  const logConsoleRef = useRef(null);

  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [scannerLogs]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLoginSuccess();
    } else {
      alert("Please enter both username and password.");
    }
  };

  const startFido2Verification = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScannerLogs([]);

    const logLines = [
      { text: "Initializing WebAuthn handshake sequence...", type: "info" },
      { text: "Requesting credential challenge from relying party...", type: "info" },
      { text: "Domain origin verified: http://localhost:5173", type: "info" },
      { text: "Waiting for hardware key gesture/biometric touch...", type: "warn" },
      { text: "USB Token detected: Yubikey 5 NFC (FIDO2)", type: "info" },
      { text: "Cryptographic credential assertion generated.", type: "info" },
      { text: "Validating signature assertions on server-side...", type: "info" },
      { text: "Auth verification success! Issuing Session Cookie.", type: "success" }
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < logLines.length) {
        setScannerLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          ...logLines[currentLine]
        }]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      }
    }, 400);
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        
        {/* Header Logo */}
        <div className="login-logo">
          <Shield size={44} />
          <h1 className="logo-text" style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>AegisShield Gateway</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Military-Grade Security Access
          </span>
        </div>

        {/* Tab Selection */}
        <div className="login-tabs">
          <button 
            className={`login-tab-btn ${authMode === 'credentials' ? 'active' : ''}`}
            onClick={() => { if (!isScanning) setAuthMode('credentials'); }}
          >
            Password Auth
          </button>
          <button 
            className={`login-tab-btn ${authMode === 'fido2' ? 'active' : ''}`}
            onClick={() => { if (!isScanning) setAuthMode('fido2'); }}
          >
            FIDO2 Security Key
          </button>
        </div>

        {/* Credentials Authentication Form */}
        {authMode === 'credentials' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="login-input-group">
              <label htmlFor="username-field">Username</label>
              <input
                id="username-field"
                type="text"
                className="login-input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="login-input-group" style={{ position: 'relative' }}>
              <label htmlFor="password-field">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password-field"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input-field"
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, var(--accent-cyan), #00b8ff)',
                boxShadow: 'var(--shadow-glow-cyan)',
                marginTop: '0.5rem',
                justifyContent: 'center'
              }}
            >
              Sign In
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* FIDO2 Biometric Scanner Simulation */}
        {authMode === 'fido2' && (
          <div className="hardware-scanner-panel">
            <button 
              className={`biometric-scanner ${isScanning ? 'scanning' : ''}`}
              onClick={startFido2Verification}
              disabled={isScanning}
              style={{ border: 'none', cursor: isScanning ? 'default' : 'pointer' }}
            >
              {isScanning && <div className="scanner-radar-line"></div>}
              <Fingerprint size={48} style={{ 
                filter: isScanning ? 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.8))' : 'none',
                transition: 'all 0.3s'
              }} />
            </button>

            <span style={{ fontSize: '0.8rem', color: isScanning ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {isScanning ? 'Verifying Hardware Key Origin...' : 'Click Yubikey to initiate Hardware scan'}
            </span>

            {/* SSE-Style Hardware Audit Logger */}
            <div className="scanner-log-console" ref={logConsoleRef}>
              {scannerLogs.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>Security hardware interface offline.</span>
              ) : (
                scannerLogs.map((l, i) => (
                  <div key={i} className={`scanner-log-line ${l.type}`}>
                    [{l.time}] {l.text}
                  </div>
                ))
              )}
            </div>

            {!isScanning && (
              <button
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-cyan), #00b8ff)',
                  boxShadow: 'var(--shadow-glow-cyan)',
                  width: '100%',
                  justifyContent: 'center'
                }}
                onClick={startFido2Verification}
              >
                Scan Security Key
                <Fingerprint size={16} />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
