// SBOM & Supply Chain Visualizer - AegisShield AI
import React, { useState } from 'react';
import { Download, Search, AlertOctagon, CheckCircle2, ShieldCheck, GitBranch } from 'lucide-react';

const SBOM_COMPONENTS = [
  { name: "express", version: "4.18.2", type: "direct", status: "clean", license: "MIT", checksum: "sha256-df38d29a0de...", size: "1.2 MB" },
  { name: "jsonwebtoken", version: "9.0.0", type: "direct", status: "clean", license: "MIT", checksum: "sha256-a382fd9038d...", size: "450 KB" },
  { name: "pg", version: "8.11.0", type: "direct", status: "clean", license: "MIT", checksum: "sha256-bb8392fbcad...", size: "2.1 MB" },
  { name: "flat-dependency-parser", version: "1.0.4", type: "transitive", status: "backdoored", license: "BSD-3-Clause", checksum: "sha256-invalid-sig-checksum-482a", size: "15 KB", advisory: "CVE-2026-38291: Injected postinstall Trojan payload that exfiltrates process.env parameters to command server." },
  { name: "lodash", version: "4.17.20", type: "transitive", status: "outdated", license: "MIT", checksum: "sha256-fe23a9d98a2...", size: "1.4 MB", advisory: "CVE-2020-8203: Prototype Pollution vulnerability in defaultsDeep." },
  { name: "safe-buffer", version: "5.2.1", type: "transitive", status: "clean", license: "MIT", checksum: "sha256-9e90ba921e9...", size: "8 KB" },
  { name: "cookie", version: "0.5.0", type: "transitive", status: "clean", license: "MIT", checksum: "sha256-cc39da12f8a...", size: "12 KB" },
  { name: "ms", version: "2.1.3", type: "transitive", status: "clean", license: "MIT", checksum: "sha256-78e23fbca81...", size: "5 KB" }
];

export default function SbomVisualizer({ isSbomFixed }) {
  const [search, setSearch] = useState('');

  // Dynamically update the package list based on whether user applied the package patch
  const currentComponents = SBOM_COMPONENTS.map(c => {
    if (c.name === 'flat-dependency-parser' && isSbomFixed) {
      return {
        ...c,
        version: "1.0.5",
        status: "clean",
        checksum: "sha256-78d103ad982bfe88241e...",
        advisory: undefined
      };
    }
    return c;
  });

  const filteredComponents = currentComponents.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.status.toLowerCase().includes(search.toLowerCase())
  );

  const downloadCycloneDxSbom = () => {
    const sbomData = {
      bomFormat: "CycloneDX",
      specVersion: "1.5",
      serialNumber: `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : '3e657a7d-5a9e-4e44-b19e-e31644783389'}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [
          {
            vendor: "AegisShield AI",
            name: "CycloneDX SBOM Engine",
            version: "1.0.0"
          }
        ],
        component: {
          type: "application",
          name: "enterprise-portal",
          version: "2.4.1"
        }
      },
      components: currentComponents.map(c => ({
        type: "library",
        name: c.name,
        version: c.version,
        scope: c.type === 'direct' ? 'required' : 'optional',
        hashes: [
          {
            alg: "SHA-256",
            content: c.checksum
          }
        ],
        licenses: [
          {
            license: {
              id: c.license
            }
          }
        ],
        purl: `pkg:npm/${c.name}@${c.version}`
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sbomData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "cyclonedx-sbom.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="sbom-tree-container">
      
      {/* Visual Header Controls */}
      <div className="sbom-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(0, 242, 254, 0.1)', p: '0.5rem', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
            <GitBranch size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Software Bill of Materials (SBOM)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete inventory verification matching CycloneDX v1.5 Schema standards.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search dependencies..."
              className="search-input"
              style={{ paddingLeft: '2.2rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), #00b8ff)',
              boxShadow: 'var(--shadow-glow-cyan)'
            }}
            onClick={downloadCycloneDxSbom}
          >
            <Download size={16} />
            Export CycloneDX JSON
          </button>
        </div>
      </div>

      {/* Grid of Dependency Components */}
      <div className="dependency-grid">
        {filteredComponents.map(c => {
          
          const getStatusDetails = () => {
            if (c.status === 'backdoored') return {
              class: 'backdoored',
              color: 'var(--accent-red)',
              icon: <AlertOctagon size={16} />,
              label: 'Vulnerable / Unsigned'
            };
            if (c.status === 'outdated') return {
              class: 'outdated',
              color: 'var(--accent-amber)',
              icon: <AlertOctagon size={16} />,
              label: 'Outdated Component'
            };
            return {
              class: 'clean',
              color: 'var(--accent-emerald)',
              icon: <CheckCircle2 size={16} />,
              label: 'Secure / Signed'
            };
          };

          const s = getStatusDetails();

          return (
            <div key={c.name} className={`glass-panel dep-node-card ${s.class}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{c.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>v{c.version}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700, color: s.color }}>
                  {s.icon}
                  <span>{s.label}</span>
                </div>
              </div>

              <div className="dep-meta">
                <span>Scope: {c.type}</span>
                <span>License: {c.license}</span>
              </div>
              <div className="dep-meta" style={{ marginTop: '0.25rem', borderTop: '1px solid var(--border-muted)', paddingTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                Checksum: {c.checksum}
              </div>

              {c.advisory && (
                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.5rem', 
                  borderRadius: '6px', 
                  background: 'rgba(255, 56, 96, 0.05)', 
                  border: '1px solid rgba(255, 56, 96, 0.15)',
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                  color: 'var(--accent-red)'
                }}>
                  {c.advisory}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
