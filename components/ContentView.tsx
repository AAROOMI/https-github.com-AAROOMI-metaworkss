
import React, { useMemo } from 'react';
import { SubdomainAccordion } from './SubdomainAccordion';
import { SparklesIcon, ShieldCheckIcon } from './Icons';
import type { Domain, Control, Subdomain, GeneratedContent, PolicyDocument, Permission, View, PolicyTone, PolicyLength } from '../types';

interface ContentViewProps {
  domains: Domain[]; // Changed from single domain to array of domains
  activeControlId: string | null;
  setActiveControlId: (id: string | null) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => void;
  onGeneratePolicyWithAI?: (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => Promise<void>;
  onBatchGenerate?: (domain: Domain) => void;
  documentRepository: PolicyDocument[];
  permissions: Set<Permission>;
  onSetView: (view: View) => void;
}

export const ContentView: React.FC<ContentViewProps> = ({ domains, activeControlId, setActiveControlId, onAddDocument, onGeneratePolicyWithAI, onBatchGenerate, documentRepository, permissions, onSetView }) => {
  const activeHierarchy = useMemo(() => {
    if (!activeControlId) return null;
    for (const domain of domains) {
      for (const subdomain of domain.subdomains) {
        const control = subdomain.controls.find(c => c.id === activeControlId);
        if (control) {
          return { domain, subdomain, control };
        }
      }
    }
    return null;
  }, [domains, activeControlId]);

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <button
              onClick={() => onSetView('hub')}
              className="inline-flex items-center text-xs font-normal text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-white"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5" />
              Mission Control
            </button>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
              <span className="ml-1 text-xs font-medium text-gray-700 md:ml-2 dark:text-gray-200 uppercase tracking-widest">NCA ECC Framework</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">NCA Essential Cybersecurity Controls</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-normal">Complete framework view containing 193 controls across 5 domains.</p>
        </div>
      </div>

      <div className="space-y-12">
        {domains.map((domain) => (
          <section key={domain.id} className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <h2 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em]">
                Domain {domain.id}: {domain.name}
              </h2>
              {permissions.has('documents:generate') && onBatchGenerate && (
                <button
                    onClick={() => onBatchGenerate(domain)}
                    className="inline-flex items-center px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold rounded border border-teal-100 dark:border-teal-800 uppercase tracking-widest hover:bg-teal-100 transition-all"
                >
                    <SparklesIcon className="w-3 h-3 mr-1.5" />
                    Auto-Draft Domain
                </button>
              )}
            </div>
            <div className="space-y-3">
              {domain.subdomains.map((subdomain) => (
                <SubdomainAccordion 
                  key={subdomain.id} 
                  domain={domain}
                  subdomain={subdomain} 
                  activeControlId={activeControlId} 
                  setActiveControlId={setActiveControlId} 
                  onAddDocument={onAddDocument}
                  onGeneratePolicyWithAI={onGeneratePolicyWithAI}
                  documentRepository={documentRepository}
                  permissions={permissions}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
