import React, { useEffect, useRef, useMemo } from 'react';
import type { AssessmentItem, ControlStatus } from '../types';

declare const Chart: any;

interface CMADomainComplianceBarChartProps {
    data: AssessmentItem[];
}

const getStatusChartColor = (status: 'Implemented' | 'Partially Implemented' | 'Not Implemented', opacity = 1) => {
    switch (status) {
        case 'Implemented': return `rgba(16, 185, 129, ${opacity})`; // green-500
        case 'Partially Implemented': return `rgba(245, 158, 11, ${opacity})`; // amber-500
        case 'Not Implemented': return `rgba(239, 68, 68, ${opacity})`; // red-500
    }
};

export const CMADomainComplianceBarChart: React.FC<CMADomainComplianceBarChartProps> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    const processedData = useMemo(() => {
        const domainStats: Record<string, {
            'Implemented': number;
            'Partially Implemented': number;
            'Not Implemented': number;
        }> = {};

        data.forEach(item => {
            if (!domainStats[item.domainName]) {
                domainStats[item.domainName] = {
                    'Implemented': 0,
                    'Partially Implemented': 0,
                    'Not Implemented': 0,
                };
            }
            if (item.controlStatus === 'Implemented' || item.controlStatus === 'Partially Implemented' || item.controlStatus === 'Not Implemented') {
                domainStats[item.domainName][item.controlStatus]++;
            }
        });

        const labels = Object.keys(domainStats);
        const implementedData = labels.map(label => domainStats[label].Implemented);
        const partiallyData = labels.map(label => domainStats[label]['Partially Implemented']);
        const notImplementedData = labels.map(label => domainStats[label]['Not Implemented']);

        return { labels, implementedData, partiallyData, notImplementedData };
    }, [data]);

    useEffect(() => {
        if (!canvasRef.current || typeof Chart === 'undefined') return;

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#E5E7EB' : '#4B5563';
        const gridColor = isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 1)';

        const chartData = {
            labels: processedData.labels,
            datasets: [
                {
                    label: 'Implemented',
                    data: processedData.implementedData,
                    backgroundColor: getStatusChartColor('Implemented', 0.7),
                },
                {
                    label: 'Partially Implemented',
                    data: processedData.partiallyData,
                    backgroundColor: getStatusChartColor('Partially Implemented', 0.7),
                },
                {
                    label: 'Not Implemented',
                    data: processedData.notImplementedData,
                    backgroundColor: getStatusChartColor('Not Implemented', 0.7),
                }
            ]
        };

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(canvasRef.current, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'CMA Compliance Status by Domain',
                        color: textColor,
                        font: {
                            size: 18
                        }
                    },
                     tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [processedData]);

    return (
        <div className="h-96">
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};