
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
    <div className={`ring-wrapper ${active ? 'active' : ''}`}>
      <div className="moving-ring"></div>
      {active && <div className="active-step-bg"></div>}
      <span className="step-number">{num}</span>
    </div>
  );

  const NavItem = ({ label, view, icon: Icon }: { label: string, view: View, icon: any }) => (
    <button 
      onClick={() => onSetView(view)} 
      className={`w-full text-left p-2 pl-12 rounded-lg text-xs flex items-center transition-colors ${currentView === view ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
    >
      <Icon className="w-3.5 h-3.5 mr-2.5 opacity-70" /> {label}
    </button>
  );

  return (
    <aside className="w-72 bg-white dark:bg-[#0f172a] p-4 border-r border-gray-200 dark:border-gray-800 overflow-y-auto hidden md:flex md:flex-col h-full">
      {/* Sarah Johnson Controller Section - Increased Size */}
      <div className="mb-10 flex flex-col items-center pt-6">
        <div className="relative mb-4">
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-teal-400 to-teal-700 shadow-xl">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white dark:border-gray-900">
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
            <span className="absolute bottom-2 right-3 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </div>
        <div className="text-center">
            <span className="block font-normal text-gray-900 dark:text-white text-base">Sarah Johnson</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] leading-none">AI Compliance Agent</span>
        </div>
      </div>

      <nav className="flex-grow space-y-4">
        <button
          onClick={() => onSetView('dashboard')}
          className={`w-full text-left p-3 rounded-xl text-xs flex items-center transition-all duration-300 ${
            currentView === 'dashboard'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <DashboardIcon className={`w-5 h-5 mr-3 ${currentView === 'dashboard' ? 'text-white' : 'text-teal-600'}`} />
          <span>Dashboard</span>
        </button>

        {/* Step 1: Start Here */}
        <div className="space-y-1">
          <button 
            onClick={() => toggleStep(1)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <StepCircle num={1} active={expandedStep === 1} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Start Here</span>
            </div>
          </button>
          {expandedStep === 1 && (
            <div className="space-y-0.5 animate-fade-in">
              <NavItem label="Organization Profile" view="companyProfile" icon={BuildingOfficeIcon} />
              <NavItem label="User Management" view="userManagement" icon={UsersIcon} />
              <NavItem label="Select Framework" view="navigator" icon={ShieldCheckIcon} />
              <NavItem label="Document Management" view="documents" icon={DocumentIcon} />
            </div>
          )}
        </div>

        {/* Step 2: Awareness */}
        <div className="space-y-1">
          <button 
            onClick={() => toggleStep(2)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <StepCircle num={2} active={expandedStep === 2} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Awareness</span>
            </div>
          </button>
          {expandedStep === 2 && (
            <div className="space-y-0.5 animate-fade-in">
              <NavItem label="Training Center" view="training" icon={GraduationCapIcon} />
            </div>
          )}
        </div>

        {/* Step 3: Risk */}
        <div className="space-y-1">
          <button 
            onClick={() => toggleStep(3)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <StepCircle num={3} active={expandedStep === 3} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Risk Lab</span>
            </div>
          </button>
          {expandedStep === 3 && (
            <div className="space-y-0.5 animate-fade-in">
              <NavItem label="Risk Assessment" view="riskAssessment" icon={ExclamationTriangleIcon} />
            </div>
          )}
        </div>

        {/* Step 4: Compliance */}
        <div className="space-y-1">
          <button 
            onClick={() => toggleStep(4)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <StepCircle num={4} active={expandedStep === 4} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Compliance</span>
            </div>
          </button>
          {expandedStep === 4 && (
            <div className="space-y-0.5 animate-fade-in">
              <NavItem label="Compliance Framework" view="navigator" icon={ClipboardCheckIcon} />
            </div>
          )}
        </div>

        {/* Step 5: Agentic Team */}
        <div className="space-y-1">
          <button 
            onClick={() => toggleStep(5)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <StepCircle num={5} active={expandedStep === 5} />
              <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Agentic Team</span>
            </div>
          </button>
          {expandedStep === 5 && (
            <div className="space-y-0.5 animate-fade-in">
              <NavItem label="Boardroom" view="virtualDepartment" icon={UserGroupIcon} />
              <NavItem label="Neural HUD" view="complianceAgent" icon={SparklesIcon} />
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
          <button onClick={() => onSetView('hub')} className="w-full flex items-center gap-3 p-2 text-xs text-gray-500 hover:text-teal-600 transition-colors">
            <LogoIcon className="w-4 h-4" />
            <span>Mission Control</span>
          </button>
      </div>
    </aside>
  );
};