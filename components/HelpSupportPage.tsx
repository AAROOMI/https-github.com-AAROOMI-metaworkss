import React, { useState } from 'react';
import { ChevronDownIcon, GraduationCapIcon } from './Icons';

interface FaqItemProps {
    question: string;
    children: React.ReactNode;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-gray-800 dark:text-gray-200"
                aria-expanded={isOpen}
            >
                <span className="font-semibold">{question}</span>
                <ChevronDownIcon className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-3 text-gray-600 dark:text-gray-400 prose dark:prose-invert max-w-none">
                    {children}
                </div>
            )}
        </div>
    );
};

interface HelpSupportPageProps {
  onStartTour: () => void;
}

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({ onStartTour }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Help & Support Center</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Find answers to your questions and get in touch with our support team.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Guided Tour</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    New to the platform? Let our AI assistant give you a quick tour of the main features to get you started.
                </p>
                <button onClick={onStartTour} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                    <GraduationCapIcon className="w-5 h-5" />
                    Start AI Guide Tour
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Frequently Asked Questions</h2>
                <div>
                    <FaqItem question="How do I start a new assessment?">
                        <p>Navigate to the desired assessment page (e.g., "NCA ECC Assessment"). If no assessment is in progress, you'll see a button to "Initiate New Assessment". Clicking this will reset any previous data for that assessment type and start a new one.</p>
                    </FaqItem>
                    <FaqItem question="What is the editable assessment sheet?">
                        <p>The editable assessment sheet provides a comprehensive, spreadsheet-like interface where you can see and edit all controls for an assessment on a single page. This is useful for bulk updates and getting a complete overview. Changes are saved automatically as you edit fields.</p>
                    </FaqItem>
                    <FaqItem question="How does the AI Voice Assessment work?">
                        <p>The AI Voice Assessment uses your microphone to have a conversation with our AI assistant, Noora. She will guide you through each control, ask you for the assessment details, and fill out the form for you based on your spoken responses. This allows for a hands-free assessment experience.</p>
                    </FaqItem>
                    <FaqItem question="Can I export my assessment data?">
                        <p>Yes. On each assessment page, you will find an "Export CSV" button. This will download a CSV file of all the controls currently visible based on your active filters (search, domain, and status).</p>
                    </FaqItem>
                </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Support</h2>
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                        <p>If you can't find the answer you're looking for, our support team is here to help.</p>
                        <p><strong>Email:</strong> <a href="mailto:support@metaworkss.com" className="text-teal-600 dark:text-teal-400 hover:underline">support@metaworkss.com</a></p>
                        <p><strong>Phone:</strong> +966 -0570992973</p>
                        <p><strong>Hours:</strong> Sunday - Thursday, 9:00 AM - 5:00 PM (AST)</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Knowledge Base</h2>
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                        <p>For in-depth guides and tutorials on using the platform, please visit our comprehensive knowledge base.</p>
                        <a href="#" className="inline-block mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                            Go to Knowledge Base
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};