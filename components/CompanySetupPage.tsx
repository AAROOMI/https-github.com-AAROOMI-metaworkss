
import React, { useState, useEffect } from 'react';
import type { CompanyProfile, User } from '../types';
import { LogoIcon, MoonIcon, SunIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface CompanySetupPageProps {
  onSetup: (
    profileData: Omit<CompanyProfile, 'id' | 'license'>,
    adminData: Omit<User, 'id' | 'isVerified' | 'role'>
  ) => Promise<void>;
  onCancel: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  initialUser?: User | null; // Allow linking an existing user
}

export const CompanySetupPage: React.FC<CompanySetupPageProps> = ({ onSetup, onCancel, theme, toggleTheme, initialUser }) => {
  const [companyData, setCompanyData] = useState({
    name: '',
    ceoName: '',
    cioName: '',
    cisoName: '',
    ctoName: '',
    cybersecurityOfficerName: '',
    dpoName: '',
    complianceOfficerName: '',
  });

  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setAdminData(prev => ({
        ...prev,
        name: initialUser.name || '',
        email: initialUser.email || '',
      }));
    }
  }, [initialUser]);

  const isExistingUser = !!initialUser;

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip password validation if user already exists
    if (!isExistingUser && adminData.password !== adminData.confirmPassword) {
      alert("Administrator passwords do not match.");
      return;
    }
    if (!isExistingUser && adminData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    const { confirmPassword, ...adminPayload } = adminData;
    const profilePayload = { ...companyData, logo: '' }; // Logo can be added later

    setIsSubmitting(true);
    try {
        await onSetup(profilePayload, adminPayload);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-0 right-0 p-6 flex items-center gap-4">
          <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle theme"
          >
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
      </div>

      <div className="w-full max-w-2xl">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
            <LogoIcon className="mx-auto h-20 w-auto text-teal-600" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {isExistingUser ? 'Complete Your Setup' : 'Create Your Company Account'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {isExistingUser 
                    ? 'Your account is active. Please set up your company profile to continue.' 
                    : 'Start by setting up your company profile and the first administrator account.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 space-y-8">
                 <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Company Details</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></label>
                            <input type="text" name="name" id="companyName" value={companyData.name} onChange={handleCompanyChange} required className="mt-1 block w-full input-style" />
                        </div>
                         <div>
                            <label htmlFor="cisoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CISO Name</label>
                            <input type="text" name="cisoName" id="cisoName" value={companyData.cisoName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="ceoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CEO Name</label>
                            <input type="text" name="ceoName" id="ceoName" value={companyData.ceoName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="cioName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CIO Name</label>
                            <input type="text" name="cioName" id="cioName" value={companyData.cioName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                         <div>
                            <label htmlFor="ctoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTO Name</label>
                            <input type="text" name="ctoName" id="ctoName" value={companyData.ctoName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="cybersecurityOfficerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cybersecurity Officer</label>
                            <input type="text" name="cybersecurityOfficerName" id="cybersecurityOfficerName" value={companyData.cybersecurityOfficerName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="dpoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Protection Officer (DPO)</label>
                            <input type="text" name="dpoName" id="dpoName" value={companyData.dpoName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="complianceOfficerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Officer</label>
                            <input type="text" name="complianceOfficerName" id="complianceOfficerName" value={companyData.complianceOfficerName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                 </fieldset>

                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Administrator Account</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                            <input type="text" name="name" id="adminName" value={adminData.name} onChange={handleAdminChange} required className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></label>
                            <input 
                                type="email" 
                                name="email" 
                                id="adminEmail" 
                                value={adminData.email} 
                                onChange={handleAdminChange} 
                                required 
                                disabled={isExistingUser} 
                                className="mt-1 block w-full input-style disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700" 
                            />
                        </div>
                        {!isExistingUser && (
                            <>
                                <div>
                                    <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></label>
                                    <div className="relative mt-1">
                                        <input type={showPassword ? 'text' : 'password'} name="password" id="adminPassword" value={adminData.password} onChange={handleAdminChange} required className="block w-full input-style pr-10" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="adminConfirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password <span className="text-red-500">*</span></label>
                                    <div className="relative mt-1">
                                        <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" id="adminConfirmPassword" value={adminData.confirmPassword} onChange={handleAdminChange} required className="block w-full input-style pr-10" />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </fieldset>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end items-center gap-4">
                 <button type="button" onClick={onCancel} disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400">
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isExistingUser ? 'Completing Setup...' : 'Creating Account...'}
                        </>
                    ) : (isExistingUser ? 'Complete Setup' : 'Create Account')}
                 </button>
            </div>
        </form>
      </div>
      <style>{`
            .input-style {
                background-color: white;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                padding: 0.5rem 0.75rem;
                color: #111827;
            }
            .input-style:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                --tw-ring-color: #14b8a6;
                border-color: #14b8a6;
            }
            .dark .input-style {
                background-color: #374151;
                border-color: #4b5563;
                color: #f9fafb;
            }
        `}</style>
    </div>
  );
};
