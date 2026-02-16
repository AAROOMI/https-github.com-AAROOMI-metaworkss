import type { AssessmentItem } from '../types';
import { eccData } from './controls';

// This function generates the assessment data structure from the single source of truth, eccData.
const generateAssessmentData = (): AssessmentItem[] => {
  const assessmentItems: AssessmentItem[] = [];

  eccData.forEach(domain => {
    domain.subdomains.forEach(subdomain => {
      subdomain.controls.forEach(control => {
        assessmentItems.push({
          domainCode: domain.id,
          domainName: domain.name,
          subDomainCode: subdomain.id,
          subdomainName: subdomain.title,
          controlCode: control.id,
          controlName: control.description,
          currentStatusDescription: "",
          controlStatus: "Not Implemented",
          recommendation: "",
          managementResponse: "",
          targetDate: ""
        });
      });
    });
  });

  return assessmentItems;
};

export const assessmentData: AssessmentItem[] = generateAssessmentData();