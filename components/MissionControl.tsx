
import React, { useState } from 'react';
import type { View, VirtualAgent } from '../types';
import { 
    UsersIcon, 
    BuildingOfficeIcon, 
    DocumentIcon, 
    ShieldCheckIcon, 
    GraduationCapIcon, 
    ExclamationTriangleIcon, 
    UserGroupIcon, 
    LinkIcon, 
    SparklesIcon, 
    ClipboardListIcon 
} from './Icons';
import { virtualAgents } from '../data/virtualAgents';

interface MissionControlProps {
    onNavigate: (view: View) => void;
    onTalkToAgent: (agent: VirtualAgent) => void;
}

const HubColumn: React.FC<{ title: string; children: React.ReactNode; isStartHere?: boolean; onTitleClick?: () => void }> = ({ title, children, isStartHere, onTitleClick }) => (
    <div className="flex flex-col gap-4 relative">
        <button
            onClick={onTitleClick}
            className={`${isStartHere ? 'bg-teal-600 animate-pulse cursor-pointer hover:bg-teal-500' : 'bg-teal-700'} text-white text-xs font-semibold px-3 py-2.5 rounded-lg text-center shadow-sm transition-colors`}
        >
            {title}
            {isStartHere && <span className="block text-[8px] font-normal lowercase opacity-80 mt-0.5">Click for flow</span>}
        </button>
        <div className="flex flex-col gap-3">
            {children}
        </div>
    </div>
);

const HubCard: React.FC<{ 
    label: string; 
    onClick: () => void; 
    icon?: React.ReactNode; 
    isEmpty?: boolean;
    active?: boolean;
    step?: number;
    showStep?: boolean;
}> = ({ label, onClick, icon, isEmpty = false, active = false, step, showStep }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 min-h-[70px] flex flex-col justify-center items-center text-center group relative ${
            isEmpty 
            ? 'border-gray-200 dark:border-gray-700 bg-transparent' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5'
        } ${active ? 'ring-2 ring-teal-500' : ''}`}
    >
        {showStep && step && (
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10">
                {step}
            </div>
        )}
        {icon && <div className="mb-2 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">{icon}</div>}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 tracking-tight leading-tight">
            {label}
        </span>
    </button>
);

const ConnectionArrow: React.FC = () => (
    <div className="flex justify-center -my-1.5 opacity-40">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-500 animate-bounce">
            <path d="M12 4V20M12 20L18 14M12 20L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </div>
);

export const MissionControl: React.FC<MissionControlProps> = ({ onNavigate, onTalkToAgent }) => {
    const [showFlow, setShowFlow] = useState(false);

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Mission control</h1>
                <p className="text-gray-500 text-xs font-normal">Global orchestration hub for Metaworks GRC operations.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-start">
                {/* Column 1: Start Here */}
                <HubColumn title="Onboarding" isStartHere onTitleClick={() => setShowFlow(!showFlow)}>
                    <HubCard label="Admin profile" icon={<UsersIcon className="w-4 h-4"/>} onClick={() => onNavigate('userProfile')} step={1} showStep={showFlow} />
                    {showFlow && <ConnectionArrow />}
                    <HubCard label="Organization profile" icon={<BuildingOfficeIcon className="w-4 h-4"/>} onClick={() => onNavigate('companyProfile')} step={2} showStep={showFlow} />
                    {showFlow && <ConnectionArrow />}
                    <HubCard label="User management" icon={<UsersIcon className="w-4 h-4"/>} onClick={() => onNavigate('userManagement')} step={3} showStep={showFlow} />
                    {showFlow && <ConnectionArrow />}
                    <div className="relative">
                        <HubCard label="NCA ECC framework" icon={<ShieldCheckIcon className="w-4 h-4"/>} onClick={() => onNavigate('navigator')} step={4} showStep={showFlow} />
                    </div>
                    {showFlow && <ConnectionArrow />}
                    <HubCard label="Document vault" icon={<ClipboardListIcon className="w-4 h-4"/>} onClick={() => onNavigate('documents')} step={5} showStep={showFlow} />
                </HubColumn>

                {/* Column 2: Security Awareness */}
                <HubColumn title="Awareness">
                    <HubCard label="General fundamentals" icon={<GraduationCapIcon className="w-4 h-4"/>} onClick={() => onNavigate('training')} />
                    <HubCard label="Phishing defense" icon={<GraduationCapIcon className="w-4 h-4"/>} onClick={() => onNavigate('training')} />
                    <HubCard label="" onClick={() => {}} isEmpty />
                    <HubCard label="" onClick={() => {}} isEmpty />
                </HubColumn>

                {/* Column 3: Risk Assessment */}
                <HubColumn title="Risk lab">
                    <HubCard label="Identification" icon={<ExclamationTriangleIcon className="w-4 h-4"/>} onClick={() => onNavigate('riskAssessment')} />
                    <HubCard label="Analysis" icon={<ExclamationTriangleIcon className="w-4 h-4"/>} onClick={() => onNavigate('riskAssessment')} />
                    <HubCard label="Treatment" icon={<ExclamationTriangleIcon className="w-4 h-4"/>} onClick={() => onNavigate('riskAssessment')} />
                    <HubCard label="Mitigation" icon={<ExclamationTriangleIcon className="w-4 h-4"/>} onClick={() => onNavigate('riskAssessment')} />
                </HubColumn>

                {/* Column 4: Frameworks */}
                <HubColumn title="Compliance">
                    <HubCard label="NCA ECC audit" icon={<ShieldCheckIcon className="w-4 h-4"/>} onClick={() => onNavigate('assessment')} />
                    <HubCard label="PDPL privacy" icon={<ShieldCheckIcon className="w-4 h-4"/>} onClick={() => onNavigate('pdplAssessment')} />
                    <HubCard label="ISO 27001 readiness" icon={<ShieldCheckIcon className="w-4 h-4"/>} onClick={() => onNavigate('iso27001Assessment')} />
                    <HubCard label="SAMA CSF audit" icon={<ShieldCheckIcon className="w-4 h-4"/>} onClick={() => onNavigate('samaCsfAssessment')} />
                </HubColumn>

                {/* Column 5: Virtual Team */}
                <HubColumn title="Boardroom">
                    {virtualAgents.slice(0, 4).map(agent => (
                        <HubCard 
                            key={agent.id}
                            label={`${agent.name}`} 
                            icon={<img src={agent.avatarUrl} className="w-7 h-7 rounded-full border border-teal-500/20" alt={agent.name} />}
                            onClick={() => onTalkToAgent(agent)} 
                        />
                    ))}
                </HubColumn>

                {/* Column 6: Operations */}
                <HubColumn title="Operations">
                    <HubCard label="Connectors" icon={<LinkIcon className="w-4 h-4"/>} onClick={() => onNavigate('integrations')} />
                    <HubCard label="Smart policy AI" icon={<SparklesIcon className="w-4 h-4"/>} onClick={() => onNavigate('complianceAgent')} />
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <HubCard label="Artifact vault" icon={<DocumentIcon className="w-4 h-4"/>} onClick={() => onNavigate('documents')} />
                    </div>
                </HubColumn>
            </div>
        </div>
    );
};
