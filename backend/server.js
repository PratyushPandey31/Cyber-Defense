// Express server for AegisShield AI
import express from 'express';
import cors from 'cors';
import { mockCodebase } from './mockCodebase.js';
import { runSimulation } from './simulations.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory Database state
let securityPolicies = {
  sbomSignatureVerify: false,
  zeroTrustAccess: false,
  llmGuardrails: false,
  mfaPolicy: false
};

let filesState = JSON.parse(JSON.stringify(mockCodebase));

// Calculate security posture metrics
function calculateMetrics() {
  const totalVulnerabilities = Object.keys(filesState).length;
  const mitigatedCount = Object.values(filesState).filter(f => f.isMitigated).length;
  
  // Base score: 20. Every mitigation adds 20. Active policy toggles add another component.
  // Maximum score: 100
  let score = 20;
  
  // 1. Check code mitigation (up to 40 points: 10 per file mitigated)
  score += mitigatedCount * 10;

  // 2. Check active system policies (up to 40 points: 10 per policy active)
  const activePolicyCount = Object.values(securityPolicies).filter(Boolean).length;
  score += activePolicyCount * 10;

  // Extra credit for full alignment (remediated AND active policy)
  if (filesState['package.json'].isMitigated && securityPolicies.sbomSignatureVerify) score += 5;
  if (filesState['apiGateway.js'].isMitigated && securityPolicies.zeroTrustAccess) score += 5;
  if (filesState['llmAgent.js'].isMitigated && securityPolicies.llmGuardrails) score += 5;
  if (filesState['authController.js'].isMitigated && securityPolicies.mfaPolicy) score += 5;

  score = Math.min(score, 100);

  // Mean Time to Detect / Mitigate simulated metrics (lower is better)
  // These improve as policies are enabled and code is mitigated.
  const mttd = Math.max(12, 120 - (activePolicyCount * 25)); // from 120s down to 12s
  const mttm = Math.max(30, 240 - (mitigatedCount * 45) - (activePolicyCount * 10)); // from 240s down to 30s

  return {
    securityScore: score,
    mitigatedCount,
    totalVulnerabilities,
    meanTimeToDetect: mttd,
    meanTimeToMitigate: mttm,
    activePolicies: activePolicyCount
  };
}

// 1. Policy Endpoints
app.get('/api/policies', (req, res) => {
  res.json(securityPolicies);
});

app.post('/api/policies/toggle', (req, res) => {
  const { policyName } = req.body;
  if (policyName in securityPolicies) {
    securityPolicies[policyName] = !securityPolicies[policyName];
    res.json({ success: true, policies: securityPolicies, metrics: calculateMetrics() });
  } else {
    res.status(400).json({ error: 'Invalid policy name' });
  }
});

// 2. Codebase Workspace Endpoints
app.get('/api/codebase', (req, res) => {
  res.json({
    files: Object.values(filesState).map(({ name, path, severity, category, isMitigated, cve }) => ({
      name, path, severity, category, isMitigated, cve
    })),
    metrics: calculateMetrics()
  });
});

app.get('/api/codebase/file', (req, res) => {
  const { path } = req.query;
  const file = filesState[path];
  if (file) {
    res.json(file);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/api/codebase/mitigate', (req, res) => {
  const { path } = req.body;
  const file = filesState[path];
  if (file) {
    file.isMitigated = true;
    
    // Automatically toggle the corresponding policy as well for demo flow convenience (optional, let's keep it manual or auto? User clicks mitigate, it fixes code, but policies show the system settings. Let's make it so code mitigation solves the codebase issue, policy toggles active firewall checks.)
    res.json({ 
      success: true, 
      file, 
      metrics: calculateMetrics() 
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/api/codebase/reset', (req, res) => {
  filesState = JSON.parse(JSON.stringify(mockCodebase));
  securityPolicies = {
    sbomSignatureVerify: false,
    zeroTrustAccess: false,
    llmGuardrails: false,
    mfaPolicy: false
  };
  res.json({ success: true, metrics: calculateMetrics(), policies: securityPolicies, files: Object.values(filesState) });
});

// 3. Simulation Endpoint (Server-Sent Events)
app.get('/api/simulate', async (req, res) => {
  const { type } = req.query;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Keep connection open
  res.write('\n');

  // Trigger simulation run
  try {
    const result = await runSimulation(type, securityPolicies, (log) => {
      res.write(`data: ${JSON.stringify({ type: 'log', log })}\n\n`);
    });
    
    // Calculate final metrics after simulation
    const metrics = calculateMetrics();
    res.write(`data: ${JSON.stringify({ type: 'complete', result, metrics })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  } finally {
    res.end();
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[AegisShield Backend] Server running on http://localhost:${PORT}`);
});
