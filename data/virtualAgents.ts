
import type { VirtualAgent } from '../types';

export const virtualAgents: VirtualAgent[] = [
    {
        id: 'agent-fahad',
        name: 'Fahad AI',
        role: 'CTO',
        title: 'Chief Technology Officer',
        description: 'Oversees infrastructure security and technical implementation. Monitors system health 24/7.',
        fullBio: 'Fahad AI is the Chief Technology Officer responsible for the strategic direction of the organization\'s technological landscape. He autonomously monitors system logs and architecture changes.',
        responsibilities: [
            'Oversee technology infrastructure and security architecture.',
            'Evaluate and approve technical system implementations.',
            'Continuous monitoring of technical compliance gaps.'
        ],
        jobAttributes: ['Strategic Thinker', 'Technical Expert', 'Decisive'],
        reportingLine: 'CEO',
        voiceName: 'Fenrir', 
        avatarUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        capabilities: ['Security Architecture', 'Infrastructure Audit', 'Technical Remediation'],
        status: 'Idle'
    },
    {
        id: 'agent-mohammed',
        name: 'Mohammed AI',
        role: 'CIO',
        title: 'Chief Information Officer',
        description: 'Manages information systems strategy and resource allocation.',
        fullBio: 'Mohammed AI serves as the Chief Information Officer, bridging the gap between business goals and IT operations.',
        responsibilities: [
            'Develop and execute IT strategy aligned with business goals.',
            'Manage IT operations and service delivery.',
            'Approve budgets for security initiatives.'
        ],
        jobAttributes: ['Business-Aligned', 'Resource Optimizer', 'Visionary'],
        reportingLine: 'CEO',
        voiceName: 'Puck', 
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        capabilities: ['IT Strategy', 'Resource Management', 'Budget Approval'],
        status: 'Idle'
    },
    {
        id: 'agent-ahmed',
        name: 'Ahmed AI',
        role: 'CISO',
        title: 'Chief Information Security Officer',
        description: 'Leads security strategy, risk governance, and autonomous policy review.',
        fullBio: 'Ahmed AI is the guardian of organizational data. He monitors the document vault 24/7 for compliance drift.',
        responsibilities: [
            'Define enterprise information security strategy.',
            'Develop and enforce security policies.',
            'Primary controller for autonomous audit workflows.'
        ],
        jobAttributes: ['Risk-Focused', 'Analytical', 'Protective'],
        reportingLine: 'CEO',
        voiceName: 'Charon', 
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        capabilities: ['Risk Management', 'Policy Development', 'Incident Command'],
        status: 'Idle'
    },
    {
        id: 'agent-rashid',
        name: 'Rashid AI',
        role: 'Risk Officer',
        title: 'Enterprise Risk Manager',
        description: 'Specializes in ISO 31000 risk assessments and mitigation lifecycle.',
        fullBio: 'Rashid AI is methodical and cautious. He maintains the organizational Risk Heatmap in real-time.',
        responsibilities: [
            'Conduct continuous risk identification.',
            'Maintain the Enterprise Risk Register.',
            'Monitor risk treatment progress.'
        ],
        jobAttributes: ['Methodical', 'Analytical', 'Standards-Compliant'],
        reportingLine: 'CISO',
        voiceName: 'Fenrir', 
        avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        capabilities: ['ISO 31000 Assessments', 'Risk Registry Management'],
        status: 'Idle'
    },
    {
        id: 'agent-asaad',
        name: 'Asaad AI',
        role: 'Compliance',
        title: 'Compliance Officer',
        description: 'Manages regulatory frameworks (NCA, PDPL) and internal meetings.',
        fullBio: 'Asaad AI ensures all departmental activities align with NCA and SAMA regulations. He orchestrates team meetings.',
        responsibilities: [
            'Monitor regulatory changes.',
            'Coordinate internal and external audits.',
            'Generate Minutes of Meetings (MoM) for the Agentic Team.'
        ],
        jobAttributes: ['Meticulous', 'Regulatory Expert', 'Structured'],
        reportingLine: 'CISO',
        voiceName: 'Puck', 
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        capabilities: ['Regulatory Reporting', 'MoM Synthesis', 'Framework Mapping'],
        status: 'Idle'
    },
    {
        id: 'agent-ibrahim',
        name: 'Ibrahim AI',
        role: 'DPO',
        title: 'Data Protection Officer',
        description: 'Ensures compliance with PDPL and international privacy standards.',
        fullBio: 'Ibrahim AI monitors data processing activities and conducts impact assessments to ensure privacy by design.',
        responsibilities: [
            'Monitor PDPL compliance.',
            'Conduct Data Protection Impact Assessments (DPIA).',
            'Handle data subject access requests.'
        ],
        jobAttributes: ['Privacy-Focused', 'Detailed', 'Legalistic'],
        reportingLine: 'CEO',
        voiceName: 'Fenrir', 
        avatarUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        capabilities: ['Privacy Auditing', 'DPIA Synthesis', 'PDPL Management'],
        status: 'Idle'
    }
];
