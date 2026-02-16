
import React from 'react';

const SubdomainAccordionSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
        <div className="w-full flex justify-between items-center p-5">
            <div className="flex items-center flex-1 min-w-0">
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                <div className="flex items-baseline flex-1 min-w-0">
                    <div className="h-7 w-3/5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="ml-3 h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
            </div>
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full ml-4"></div>
        </div>
    </div>
);

export const ContentViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-10 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="mt-3 h-6 w-1/2 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <SubdomainAccordionSkeleton />
        <SubdomainAccordionSkeleton />
        <SubdomainAccordionSkeleton />
        <SubdomainAccordionSkeleton />
      </div>
    </div>
  );
};
