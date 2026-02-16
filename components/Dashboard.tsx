
import React, { useEffect, useRef, useMemo } from 'react';
import type { PolicyDocument, User, SearchResult, Domain, AssessmentItem, Task, View, Risk } from '../types';
import { ShieldCheckIcon } from './Icons';

interface DashboardPageProps {
    repository: PolicyDocument[];
    currentUser: User;
    allControls: SearchResult[];
    domains: Domain[];
    onSetView: (view: View) => void;
    eccAssessment: AssessmentItem[];
    pdplAssessment: AssessmentItem[];
    samaCsfAssessment: AssessmentItem[];
    risks: Risk[];
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-[#1e293b]/50 dark:bg-[#0f172a]/90 shadow-2xl rounded-2xl border border-teal-500/20 p-8 ${className}`}>
        {children}
    </div>
);

const GaugeMeter: React.FC<{ percentage: number; label: string; actionLabel?: string; onAction?: () => void; id: string; size?: 'small' | 'large' }> = ({ percentage, label, actionLabel = "ANALYZE", onAction, id, size = 'small' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        const ChartLib = (window as any).Chart;
        if (!canvasRef.current || !ChartLib) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new ChartLib(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage || 1, 100 - (percentage || 1)],
                    backgroundColor: ['#14b8a6', '#1e293b'],
                    borderColor: 'transparent',
                    circumference: 180,
                    rotation: -90,
                    cutout: '85%',
                    borderRadius: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { animateScale: true, animateRotate: true },
            }
        });
        
        return () => chartRef.current?.destroy();
    }, [percentage]);

    const isLarge = size === 'large';

    return (
        <Card className={`flex flex-col items-center justify-between ${isLarge ? 'h-64' : 'h-56'} bg-[#111827]/40 border-teal-500/20`}>
            <h4 className="text-[11px] font-normal text-gray-400 uppercase tracking-[0.25em] text-center">{label}</h4>
            <div className={`relative ${isLarge ? 'w-52 h-28' : 'w-36 h-20'} mt-4`}>
                <canvas ref={canvasRef}></canvas>
                <div className="absolute inset-0 flex items-end justify-center">
                    <span className={`${isLarge ? 'text-6xl' : 'text-3xl'} font-normal text-white mb-[-4px]`}>
                        {isNaN(percentage) ? 'N/A' : `${percentage.toFixed(0)}%`}
                    </span>
                </div>
            </div>
            <button 
                onClick={onAction}
                className="mt-6 w-full py-2.5 border-t border-gray-800 text-[10px] font-normal text-gray-500 tracking-[0.3em] hover:text-teal-400 transition-colors uppercase"
            >
                {actionLabel}
            </button>
        </Card>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ repository, currentUser, allControls, eccAssessment, pdplAssessment, samaCsfAssessment, risks }) => {
    const stats = useMemo(() => {
        const approvedCount = repository.filter(doc => doc.status === 'Approved').length;
        const totalControls = allControls.length || 193;
        const compliance = totalControls > 0 ? (approvedCount / totalControls) * 100 : 1;
        return { approvedCount, compliance, totalControls };
    }, [repository, allControls]);

    const calculateCompliance = (data: AssessmentItem[]) => {
        if (!data || data.length === 0) return 0;
        const applicable = data.filter(i => i.controlStatus !== 'Not Applicable').length;
        const implemented = data.filter(i => i.controlStatus === 'Implemented').length;
        return applicable > 0 ? (implemented / applicable) * 100 : 0;
    };

    return (
        <div className="space-y-12 animate-fade-in pb-12 max-w-7xl mx-auto pt-6 px-4">
            <header>
                <h1 className="text-3xl font-normal text-white tracking-tight">Compliance Dashboard</h1>
                <p className="text-sm text-gray-500 font-normal mt-1 opacity-70 italic tracking-wide">Enterprise posture overview for {currentUser?.name}.</p>
            </header>

            {/* Top 4 Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GaugeMeter 
                    id="overall-comp"
                    label="OVERALL COMPLIANCE"
                    percentage={stats.compliance || 1} 
                    size="large"
                    actionLabel="DETAILED REPORT"
                />

                <Card className="flex flex-col justify-between">
                    <h3 className="text-[11px] font-normal text-gray-400 uppercase tracking-[0.25em]">Control Coverage</h3>
                    <div className="mt-4">
                        <p className="text-6xl font-normal text-white">2%</p>
                        <p className="mt-2 text-xs text-gray-500 font-normal italic tracking-wide">4 active controls.</p>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-4 overflow-hidden border border-white/5">
                        <div className="h-full bg-teal-500 w-[2%] shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <h3 className="text-[11px] font-normal text-gray-400 uppercase tracking-[0.25em]">Audit Readiness</h3>
                    <div className="mt-4">
                        <p className="text-6xl font-normal text-white">2</p>
                        <p className="mt-2 text-xs text-gray-500 font-normal italic tracking-wide">Verified artifacts.</p>
                    </div>
                    <div className="flex gap-1.5 mt-4">
                         {[1,2,3,4,5].map(i => (
                             <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 2 ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]' : 'bg-gray-800'}`}></div>
                         ))}
                    </div>
                </Card>

                <Card className="flex flex-col justify-between relative overflow-hidden">
                    <h3 className="text-[11px] font-normal text-gray-400 uppercase tracking-[0.25em]">RISK CONCENTRATION</h3>
                    <div className="flex justify-between items-end mt-8">
                        <div>
                            <p className="text-6xl font-normal text-red-500">0</p>
                            <p className="text-[10px] font-normal text-red-500/60 uppercase tracking-[0.15em] mt-1">CRITICAL</p>
                        </div>
                        <div className="text-right">
                            <p className="text-6xl font-normal text-orange-400">1</p>
                            <p className="text-[10px] font-normal text-orange-400/60 uppercase tracking-[0.15em] mt-1">HIGH PRIORITY</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Regulatory Frameworks Section */}
            <div className="space-y-8 pt-6">
                <h2 className="text-xl font-normal text-white flex items-center gap-4 tracking-tight">
                    <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                        <ShieldCheckIcon className="w-4 h-4 text-teal-500" />
                    </div>
                    Regulatory Frameworks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    <GaugeMeter id="nca-ecc" percentage={0} label="NCA ECC" actionLabel="ANALYZE" />
                    <GaugeMeter id="pdpl" percentage={0} label="PDPL" actionLabel="ANALYZE" />
                    <GaugeMeter id="sama-csf" percentage={0} label="SAMA CSF" actionLabel="ANALYZE" />
                    <GaugeMeter id="iso-27001" percentage={0} label="ISO 27001" actionLabel="NOT STARTED" />
                    <GaugeMeter id="nist-csf" percentage={0} label="NIST CSF" actionLabel="NOT STARTED" />
                </div>
            </div>
        </div>
    );
};
