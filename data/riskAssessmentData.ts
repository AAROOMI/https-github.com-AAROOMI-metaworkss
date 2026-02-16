
import type { Risk } from '../types';

export const likelihoodOptions = [
    { value: 1, label: '1 - Rare' }, 
    { value: 2, label: '2 - Unlikely' }, 
    { value: 3, label: '3 - Possible' }, 
    { value: 4, label: '4 - Likely' },
    { value: 5, label: '5 - Almost Certain' }
];
export const impactOptions = [
    { value: 1, label: '1 - Insignificant' },
    { value: 2, label: '2 - Minor' },
    { value: 3, label: '3 - Moderate' },
    { value: 4, label: '4 - Major' },
    { value: 5, label: '5 - Catastrophic' }
];

const mapEffectiveness = (val: number): any => {
    if (val > 0.7) return 'Effective';
    if (val > 0.4) return 'Needs Improvement';
    return 'Ineffective';
};

export const prebuiltRiskRegister: Risk[] = [
    {
        id: 'PR-001',
        title: "No Formal Change Management for PLC Network",
        description: "No Formal Change Management for PLC Network may lead to confidentiality, integrity or availability issues affecting PLC Network. Requires assessment and controls alignment to relevant frameworks.",
        category: "OT",
        owner: "Infrastructure Team",
        inherentLikelihood: 3,
        inherentImpact: 4,
        inherentScore: 12,
        existingControl: "Manual Review",
        controlEffectiveness: mapEffectiveness(0.57),
        residualLikelihood: 3,
        residualImpact: 3,
        residualScore: 9,
        treatmentOption: "Mitigate",
        mitigation: "Implement automated change tracking.",
        responsibility: "Infrastructure Lead",
        dueDate: "2025-06-30",
        acceptanceCriteria: "Log of all changes verified.",
        approvedBy: "Rashid AI",
        remarks: "Standards: NCA, IEC62443, CMA",
        progress: 0
    },
    {
        id: 'PR-002',
        title: "Poor Patch Management for Payroll System",
        description: "Poor Patch Management for Payroll System may lead to confidentiality, integrity or availability issues affecting Payroll System. Requires assessment and controls alignment to relevant frameworks.",
        category: "IT",
        owner: "App Owner",
        inherentLikelihood: 2,
        inherentImpact: 4,
        inherentScore: 8,
        existingControl: "Monthly patching",
        controlEffectiveness: mapEffectiveness(0.48),
        residualLikelihood: 2,
        residualImpact: 2,
        residualScore: 4,
        treatmentOption: "Accept",
        mitigation: "Continue current schedule.",
        responsibility: "IT Operations",
        dueDate: "2025-12-31",
        acceptanceCriteria: "Patches applied within 30 days.",
        approvedBy: "Rashid AI",
        remarks: "Standards: NCA, SAMA, OTCC",
        progress: 100
    },
    {
        id: 'PR-003',
        title: "Insufficient Monitoring of Active Directory",
        description: "Insufficient Monitoring of Active Directory may lead to confidentiality, integrity or availability issues affecting Active Directory. Requires assessment and controls alignment to relevant frameworks.",
        category: "IT",
        owner: "Infrastructure Team",
        inherentLikelihood: 2,
        inherentImpact: 3,
        inherentScore: 6,
        existingControl: "Local logs",
        controlEffectiveness: mapEffectiveness(0.35),
        residualLikelihood: 2,
        residualImpact: 2,
        residualScore: 4,
        treatmentOption: "Mitigate",
        mitigation: "Centralize logs to SIEM.",
        responsibility: "SOC Team",
        dueDate: "2025-08-15",
        acceptanceCriteria: "AD events visible in Splunk dashboard.",
        approvedBy: "Rashid AI",
        remarks: "Standards: NCA, ISO27001, CMA",
        progress: 40
    }
    // ... Additional risks from CSV would be mapped similarly
];

export const initialRiskData: Risk[] = [
    { 
        id: 'ns1', 
        title: 'Firewall Breach',
        description: 'Unauthorized access to internal network via unpatched firewall vulnerability.', 
        category: 'Network Security',
        owner: 'IT Security Manager',
        inherentLikelihood: 4,
        inherentImpact: 5,
        inherentScore: 20,
        existingControl: 'Basic Firewall Rules',
        controlEffectiveness: 'Needs Improvement',
        residualLikelihood: 3, 
        residualImpact: 5, 
        residualScore: 15,
        treatmentOption: 'Mitigate',
        mitigation: 'Implement automated patch management system and conduct quarterly firewall rule reviews.', 
        responsibility: 'Network Admin',
        dueDate: '2024-12-31',
        acceptanceCriteria: 'Zero high-risk vulnerabilities on external scan.',
        approvedBy: 'CISO',
        remarks: 'Budget approved for new firewall license.',
        progress: 0
    }
];
