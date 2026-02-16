
import type { Domain, Control } from '../types';

const createControl = (id: string, subdomainTitle: string, index: number): Control => ({
    id,
    description: `Specific requirement for ${subdomainTitle} (Control ${index + 1}). This control ensures organizational alignment with NCA ECC security objectives and mandates specific technical or administrative measures.`,
    relevantTools: ['Governance Portal', 'Policy Framework', 'Audit Trail'],
    implementationGuidelines: [
        `Define and document ${subdomainTitle} requirements.`,
        `Establish ownership and accountability for control ${id}.`,
        `Implement technical safeguards in alignment with the NCA mandate.`,
        `Monitor implementation status and report gaps to the CISO.`
    ],
    expectedDeliverables: [
        `Approved ${subdomainTitle} Standard Document.`,
        `Signed verification log for ${id}.`,
        `Continuous monitoring telemetry.`
    ],
    version: '1.0',
    lastUpdated: '2024-05-20'
});

const createSubdomain = (id: string, title: string, objective: string, controlCount: number) => {
    const controls: Control[] = [];
    for (let i = 0; i < controlCount; i++) {
        controls.push(createControl(`${id}-${i + 1}`, title, i));
    }
    return { id, title, objective, controls };
};

export const eccData: Domain[] = [
  {
    id: '1',
    name: 'Cybersecurity Governance',
    subdomains: [
        createSubdomain('1-1', 'Cybersecurity Strategy', 'Ensure plans contribute to compliance and resilience.', 3),
        createSubdomain('1-2', 'Cybersecurity Management', 'Ensure support in implementing programs.', 4),
        createSubdomain('1-3', 'Cybersecurity Policies and Procedures', 'Ensure requirements are documented and approved.', 5),
        createSubdomain('1-4', 'Cybersecurity Roles and Responsibilities', 'Ensure roles are defined and assigned.', 4),
        createSubdomain('1-5', 'Cybersecurity Risk Management', 'Manage risks methodologically and continuously.', 5),
        createSubdomain('1-6', 'Cybersecurity in IT Project Management', 'Include security in the project lifecycle.', 5),
        createSubdomain('1-7', 'Compliance with Standards and Laws', 'Ensure regulatory and legal compliance.', 4),
        createSubdomain('1-8', 'Periodical Cybersecurity Review', 'Ensure effective implementation via audits.', 5),
        createSubdomain('1-9', 'Cybersecurity in Human Resources', 'Manage personnel risks from hire to fire.', 8),
        createSubdomain('1-10', 'Cybersecurity Awareness and Training', 'Ensure personnel awareness and skills.', 5) 
    ]
  },
  {
    id: '2',
    name: 'Cybersecurity Defense',
    subdomains: [
        createSubdomain('2-1', 'Asset Management', 'Ensure accurate inventory and classification.', 8),
        createSubdomain('2-2', 'Identity and Access Management', 'Secure logical access control.', 10),
        createSubdomain('2-3', 'Information System Protection', 'Protect systems from unauthorized changes.', 10),
        createSubdomain('2-4', 'Email Protection', 'Protect email services from threats.', 5),
        createSubdomain('2-5', 'Networks Security Management', 'Protect network infrastructure and traffic.', 8),
        createSubdomain('2-6', 'Mobile Devices Security', 'Protect mobile and BYOD endpoints.', 5),
        createSubdomain('2-7', 'Data and Information Protection', 'Ensure data confidentiality and integrity.', 8),
        createSubdomain('2-8', 'Cryptography', 'Ensure proper use of encryption.', 6),
        createSubdomain('2-9', 'Backup and Recovery Management', 'Ensure data recovery capabilities.', 5),
        createSubdomain('2-10', 'Vulnerabilities Management', 'Detect and remediate software flaws.', 6),
        createSubdomain('2-11', 'Penetration Testing', 'Simulate attacks to find weaknesses.', 5),
        createSubdomain('2-12', 'Event Logs and Monitoring', 'Collect and analyze security events.', 8),
        createSubdomain('2-13', 'Incident and Threat Management', 'Handle incidents and threats effectively.', 8),
        createSubdomain('2-14', 'Physical Security', 'Protect assets from physical threats.', 8),
        createSubdomain('2-15', 'Web Application Security', 'Protect web-facing applications.', 10)
    ]
  },
  {
      id: '3',
      name: 'Cybersecurity Resilience',
      subdomains: [
          createSubdomain('3-1', 'Business Continuity Management', 'Integrate security into BC plans.', 7),
          createSubdomain('3-2', 'Disaster Recovery Management', 'Ensure technical recovery capabilities.', 6)
      ]
  },
  {
      id: '4',
      name: 'Third-Party and Cloud Cybersecurity',
      subdomains: [
          createSubdomain('4-1', 'Third-Party Cybersecurity', 'Manage supply chain risks.', 3),
          createSubdomain('4-2', 'Cloud Computing and Hosting', 'Secure cloud environments.', 3)
      ]
  },
  {
      id: '5',
      name: 'ICS Cybersecurity',
      subdomains: [
          createSubdomain('5-1', 'Industrial Control Systems Protection', 'Protect OT/ICS environments.', 13)
      ]
  }
];
