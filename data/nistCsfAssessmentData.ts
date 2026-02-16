
import type { AssessmentItem } from '../types';

export const nistCsfAssessmentData: AssessmentItem[] = [
    {
        domainCode: "ID",
        domainName: "Identify",
        subDomainCode: "ID.AM",
        subdomainName: "Asset Management",
        controlCode: "ID.AM-1",
        controlName: "Physical devices and systems within the organization are inventoried",
        currentStatusDescription: "",
        controlStatus: "Not Implemented",
        recommendation: "",
        managementResponse: "",
        targetDate: ""
    },
    {
        domainCode: "PR",
        domainName: "Protect",
        subDomainCode: "PR.AC",
        subdomainName: "Access Control",
        controlCode: "PR.AC-1",
        controlName: "Identities and credentials are managed for authorized devices and users",
        currentStatusDescription: "",
        controlStatus: "Not Implemented",
        recommendation: "",
        managementResponse: "",
        targetDate: ""
    },
    {
        domainCode: "DE",
        domainName: "Detect",
        subDomainCode: "DE.AE",
        subdomainName: "Anomalies and Events",
        controlCode: "DE.AE-1",
        controlName: "A baseline of network operations and expected data flows for users and systems is established and managed",
        currentStatusDescription: "",
        controlStatus: "Not Implemented",
        recommendation: "",
        managementResponse: "",
        targetDate: ""
    },
    {
        domainCode: "RS",
        domainName: "Respond",
        subDomainCode: "RS.RP",
        subdomainName: "Response Planning",
        controlCode: "RS.RP-1",
        controlName: "Response plan is executed during or after an incident",
        currentStatusDescription: "",
        controlStatus: "Not Implemented",
        recommendation: "",
        managementResponse: "",
        targetDate: ""
    },
    {
        domainCode: "RC",
        domainName: "Recover",
        subDomainCode: "RC.RP",
        subdomainName: "Recovery Planning",
        controlCode: "RC.RP-1",
        controlName: "Recovery plan is executed during or after a cybersecurity incident",
        currentStatusDescription: "",
        controlStatus: "Not Implemented",
        recommendation: "",
        managementResponse: "",
        targetDate: ""
    }
];
