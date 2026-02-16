import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [styles, setStyles] = useState<{ highlight: React.CSSProperties, popover: React.CSSProperties }>({
    highlight: { display: 'none' },
    popover: { display: 'none' },
  });
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const step = steps[currentStep];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0); // Reset on close
      return;
    };

    const targetElement = document.querySelector(step.target);

    // For centered steps (like intro/outro)
    if (step.target === 'body' || !targetElement) {
      setStyles({
        highlight: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '0',
          height: '0',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
        },
        popover: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
        },
      });
      return;
    }

    // Ensure element is visible
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const calculateStyles = () => {
        const targetRect = targetElement.getBoundingClientRect();
        
        const highlightStyle: React.CSSProperties = {
            position: 'fixed',
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            borderRadius: '4px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            transition: 'all 0.3s ease-in-out',
        };

        const popoverStyle: React.CSSProperties = {
            position: 'fixed',
        };
        
        const popoverRect = popoverRef.current?.getBoundingClientRect();
        const popoverWidth = popoverRect?.width || 300;
        const popoverHeight = popoverRect?.height || 150;
        const margin = 12;

        switch (step.position) {
            case 'top':
                popoverStyle.top = `${targetRect.top - popoverHeight - margin}px`;
                popoverStyle.left = `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`;
                break;
            case 'left':
                popoverStyle.top = `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`;
                popoverStyle.left = `${targetRect.left - popoverWidth - margin}px`;
                break;
            case 'right':
                popoverStyle.top = `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`;
                popoverStyle.left = `${targetRect.right + margin}px`;
                break;
            case 'bottom':
            default:
                popoverStyle.top = `${targetRect.bottom + margin}px`;
                popoverStyle.left = `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`;
                break;
        }

        // Adjust if off-screen
        if (parseInt(String(popoverStyle.left), 10) < margin) popoverStyle.left = `${margin}px`;
        if (parseInt(String(popoverStyle.top), 10) < margin) popoverStyle.top = `${margin}px`;
        
        setStyles({ highlight: highlightStyle, popover: popoverStyle });
    };
    
    // Calculate initial position, then recalculate after a short delay for smooth scroll
    calculateStyles();
    const timer = setTimeout(calculateStyles, 300);

    return () => clearTimeout(timer);

  }, [isOpen, currentStep, step]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200]">
      <div style={styles.highlight} />
      <div
        ref={popoverRef}
        style={styles.popover}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out"
      >
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
            <button onClick={onClose} className="-mt-2 -mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{step.content}</p>
        <div className="mt-6 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                Step {currentStep + 1} of {steps.length}
            </span>
            <div className="space-x-2">
                {currentStep > 0 && (
                    <button onClick={handlePrev} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        Previous
                    </button>
                )}
                <button onClick={handleNext} className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};