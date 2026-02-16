import type { PrebuiltPolicyTemplate } from '../types';

export const policyTemplates: PrebuiltPolicyTemplate[] = [
    {
        id: 'template-access-control',
        title: 'General Access Control Policy',
        description: 'A foundational policy for managing user access to company systems and data.',
        content: {
            policy: `
# Access Control Policy

## 1. Purpose
This policy establishes the requirements for controlling access to the organization's information systems and data, ensuring that access is granted on a need-to-know and least privilege basis.

## 2. Scope
This policy applies to all employees, contractors, and third-parties who require access to corporate information assets.

## 3. Policy
- All users shall be uniquely identified.
- Access rights shall be reviewed periodically.
- Privileged access shall be restricted and monitored.
- A formal user access provisioning and de-provisioning process must be followed.
`,
            procedure: `
# Access Control Procedure

## 1. User Registration
- HR notifies IT of a new employee.
- Hiring manager submits an access request form.
- IT creates a unique user account.

## 2. Access Review
- System owners must review user access lists for their systems on a quarterly basis.
- Any discrepancies must be reported to the Cybersecurity team.

## 3. De-provisioning
- HR notifies IT of an employee's termination.
- All access must be revoked within 24 hours of notification.
`,
            guideline: `
# Access Control for Employees

## Why is it important?
We control access to our systems to protect our company's and our clients' data from being seen or changed by people who shouldn't have access.

## Your Responsibilities
- Never share your password.
- Only access data that you need for your job.
- Report any suspicious activity on your account immediately.
`
        }
    },
    {
        id: 'template-data-classification',
        title: 'Data Classification Policy',
        description: 'Defines data sensitivity levels and handling requirements for each.',
        content: {
            policy: `
# Data Classification Policy

## 1. Purpose
This policy defines the framework for classifying data according to its sensitivity, value, and criticality to the organization, and to establish handling requirements for each classification level.

## 2. Scope
This policy applies to all data created, stored, or processed by the organization, regardless of its format or location.

## 3. Classification Levels
- **Public:** Information intended for public consumption.
- **Internal:** Information for internal business use, not for public disclosure.
- **Confidential:** Sensitive business information that could cause damage if disclosed.
- **Restricted:** Highly sensitive information, subject to legal or regulatory restrictions.
`,
            procedure: `
# Data Classification Procedure

## 1. Classifying Data
- Data owners are responsible for assigning a classification level to their data.
- The classification must be based on the Data Classification Policy.

## 2. Handling Data
- **Public:** No special handling required.
- **Internal:** Must not be shared outside the company without permission.
- **Confidential:** Must be encrypted when stored or transmitted. Access is restricted.
- **Restricted:** Must be encrypted. Access is strictly controlled on a need-to-know basis.
`,
            guideline: `
# Handling Company Data

## Know Your Data's Label
We label our data to know how sensitive it is. Look for labels like "Public," "Internal," or "Confidential."

## How to Handle It
- **Public:** Share freely!
- **Internal:** Keep it within the company.
- **Confidential/Restricted:** This is sensitive stuff. Make sure it's encrypted and be very careful who you share it with. If in doubt, ask your manager.
`
        }
    }
];
