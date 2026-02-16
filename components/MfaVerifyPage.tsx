
import React, { useState } from 'react';
import type { User } from '../types';
import { LogoIcon, MoonIcon, SunIcon } from './Icons';

interface MfaVerifyPageProps {
  user: User;
  onVerify: (userId: string, verificationCode: string) => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const MfaVerifyPage: React.FC<MfaVerifyPageProps> = ({ user, onVerify, onCancel, theme, toggleTheme }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const result = await onVerify(user.id, verificationCode);
    if (!result.success) {
        setError(result.message || 'Verification failed. Please try again.');
        setIsLoading(false);
    }
    // On success, the parent component will switch views, so no need to setIsLoading(false).
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 right-0 p-6 flex items-center gap-4">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
            <button onClick={onCancel} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600">
                Sign Out
            </button>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <LogoIcon className="mx-auto h-16 w-auto text-teal-600" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                Two-Factor Authentication
            </h2>
             <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Enter the code from your authenticator app for {user.email}.
            </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                         <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                            Verification Code
                        </label>
                        <div className="mt-2">
                             <input id="code" name="code" type="text" inputMode="numeric" pattern="\\d{6}" autoComplete="one-time-code" required
                                value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-center tracking-[0.5em]" />
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
                     <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                             {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Verify"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};
