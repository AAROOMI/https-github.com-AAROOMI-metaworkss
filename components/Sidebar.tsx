import React, { useState } from 'react';
import { DocumentIcon, UsersIcon, BuildingOfficeIcon, DashboardIcon, ShieldCheckIcon, GraduationCapIcon, ExclamationTriangleIcon, UserGroupIcon, ClipboardCheckIcon, SparklesIcon, LogoIcon } from './Icons';
import type { Domain, Permission, View, UserTrainingProgress, VirtualAgent } from '../types';

interface SidebarProps {
  domains: Domain[];
  selectedDomain: Domain;
  onSelectDomain: (domain: Domain) => void;
  currentView: View;
  onSetView: (view: View) => void;
  onTalkToAgent: (agent: VirtualAgent) => void;
  permissions: Set<Permission>;
  trainingProgress?: UserTrainingProgress;
  companyId?: string;
  isFirebaseConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onSetView
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const sarahImageUrl = "https://firebasestorage.googleapis.com/v0/b/metaworks-7cfc5.firebasestorage.app/o/sara.jpg?alt=media";

  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  const StepCircle = ({ num, active }: { num: number, active: boolean }) => (
    <div className={`ring-wrapper ${active ? 'active-step' : ''}`}>
      <div className="moving-ring"></div>
      {active && <div className="active-step-bg"></div>}
      <span className="step-number">{num}</span>
    </div>
  );

  const NavItem = ({ label, view, icon: Icon }: { label: string, view: View, icon: any }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onSetView(view)} 
        className={`w-full text-left p-3 pl-14 rounded-xl text-[14px] flex items-center transition-all duration-500 group relative ${
          isActive 
            ? 'sentient-nav-active text-teal-600 dark:text-teal-400' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-teal-500' : 'opacity-70 group-hover:text-teal-500'}`} /> 
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-80 bg-white dark:bg-[#0b0f1a] p-5 border-r border-gray-200 dark:border-gray-800 overflow-y-auto hidden md:flex md:flex-col h-full shadow-2xl">
      {/* Sarah Johnson Controller Section - Resized to Normal w-24 */}
      <div className="mb-10 flex flex-col items-center pt-8">
        <div className="relative mb-4">
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-teal-400 to-teal-700 shadow-xl">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-inner">
                    <img 
                        src={sarahImageUrl} 
                        alt="Sarah Johnson" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
                        }}
                    />
                </div>
            </div>
            <span className="absolute bottom-1 right-2 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-md animate-pulse"></span>
        </div>
        <div className="text-center">
            <span className="block font-normal text-gray-900 dark:text-white text-lg tracking-tight">Sarah Johnson</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-[0.25em] leading-none mt-0.5">AI Controller Engine</span>
        </div>
      </div>

      <nav className="flex-grow space-y-6">
        <button
          onClick={() => onSetView('dashboard')}
          className={`w-full text-left p-4 rounded-2xl text-[14px] flex items-center transition-all duration-300 ${
            currentView === 'dashboard'
              ? 'bg-teal-600 text-white shadow-2xl scale-[1.02]'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <DashboardIcon className={`w-5 h-5 mr-4 ${currentView === 'dashboard' ? 'text-white' : 'text-teal-600'}`} />
          <span>Postural Dashboard</span>
        </button>

        {/* Step 1: Onboarding Hub */}
        <div className="space-y-2">
          <button onClick={() => toggleStep(1)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-5">
              <StepCircle num={1} active={expandedStep === 1} />
              <span className="text-[12px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Start Here</span>
            </div>
          </button>
          {expandedStep === 1 && (
            <div className="space-y-1 animate-fade-in">
              <NavItem label="Admin Profile" view="userProfile" icon={UsersIcon} />
              <NavItem label="Organization Profile" view="companyProfile" icon={BuildingOfficeIcon} />
              <NavItem label="User Management" view="userManagement" icon={UserGroupIcon} />
              <NavItem label="Select Framework" view="navigator" icon={ShieldCheckIcon} />
              <NavItem label="Document Management" view="documents" icon={DocumentIcon} />
            </div>
          )}
        </div>

        {/* Step 2: Agentic Team */}
        <div className="space-y-2">
          <button onClick={() => toggleStep(2)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-5">
              <StepCircle num={2} active={expandedStep === 2} />
              <span className="text-[12px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Agentic Team</span>
            </div>
          </button>
          {expandedStep === 2 && (
            <div className="space-y-1 animate-fade-in">
              <NavItem label="Multi-Agent Boardroom" view="virtualDepartment" icon={UserGroupIcon} />
              <NavItem label="Autonomous Assistant" view="complianceAgent" icon={SparklesIcon} />
            </div>
          )}
        </div>

        {/* Step 3: Risk Assessment */}
        <div className="space-y-2">
          <button onClick={() => toggleStep(3)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-5">
              <StepCircle num={3} active={expandedStep === 3} />
              <span className="text-[12px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Risk Lab</span>
            </div>
          </button>
          {expandedStep === 3 && (
            <div className="space-y-1 animate-fade-in">
              <NavItem label="Risk Identification" view="riskAssessment" icon={ExclamationTriangleIcon} />
            </div>
          )}
        </div>

        {/* Step 4: Compliance */}
        <div className="space-y-2">
          <button onClick={() => toggleStep(4)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-5">
              <StepCircle num={4} active={expandedStep === 4} />
              <span className="text-[12px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Compliance</span>
            </div>
          </button>
          {expandedStep === 4 && (
            <div className="space-y-1 animate-fade-in">
              <NavItem label="NCA Framework" view="assessment" icon={ClipboardCheckIcon} />
              <NavItem label="Regulatory Shield" view="navigator" icon={ShieldCheckIcon} />
            </div>
          )}
        </div>

        {/* Step 5: Awareness */}
        <div className="space-y-2">
          <button onClick={() => toggleStep(5)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-5">
              <StepCircle num={5} active={expandedStep === 5} />
              <span className="text-[12px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Awareness</span>
            </div>
          </button>
          {expandedStep === 5 && (
            <div className="space-y-1 animate-fade-in">
              <NavItem label="Training Academy" view="training" icon={GraduationCapIcon} />
            </div>
          )}
        </div>
      </nav>

      <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => onSetView('hub')} className="w-full flex items-center gap-4 p-4 text-xs text-gray-500 hover:text-teal-600 transition-colors uppercase tracking-[0.3em] font-normal">
            <LogoIcon className="w-6 h-6" />
            <span>Mission Command</span>
          </button>
      </div>
    </aside>
  );
};