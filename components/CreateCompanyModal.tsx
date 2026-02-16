import React, { useState } from 'react';
import type { CompanyProfile, User } from '../types';
import { CloseIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface CreateCompanyModalProps {
  onSetup: (
    profileData: Omit<CompanyProfile, 'id' | 'license'>,
    adminData: Omit<User, 'id' | 'isVerified' | 'role'>
  ) => void;
  onClose: () => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ onSetup, onClose }) => {
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

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminData.password !== adminData.confirmPassword) {
      alert("Administrator passwords do not match.");
      return;
    }
    
    const { confirmPassword, ...adminPayload } = adminData;
    const profilePayload = { ...companyData, logo: '' }; 

    onSetup(profilePayload, adminPayload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[150] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Company</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <CloseIcon className="w-6 h-6 text-gray-500" />
                </button>
            </header>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <main className="p-6 space-y-8 overflow-y-auto">
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Company Details</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="companyName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                                <input type="text" name="name" id="companyName-modal" value={companyData.name} onChange={handleCompanyChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="cisoName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CISO Name</label>
                                <input type="text" name="cisoName" id="cisoName-modal" value={companyData.cisoName} onChange={handleCompanyChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="ceoName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CEO Name</label>
                                <input type="text" name="ceoName" id="ceoName-modal" value={companyData.ceoName} onChange={handleCompanyChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="cioName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CIO Name</label>
                                <input type="text" name="cioName" id="cioName-modal" value={companyData.cioName} onChange={handleCompanyChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="ctoName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTO Name</label>
                                <input type="text" name="ctoName" id="ctoName-modal" value={companyData.ctoName} onChange={handleCompanyChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="cybersecurityOfficerName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cybersecurity Officer</label>
                                <input type="text" name="cybersecurityOfficerName" id="cybersecurityOfficerName-modal" value={companyData.cybersecurityOfficerName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="dpoName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Protection Officer (DPO)</label>
                                <input type="text" name="dpoName" id="dpoName-modal" value={companyData.dpoName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="complianceOfficerName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Officer</label>
                                <input type="text" name="complianceOfficerName" id="complianceOfficerName-modal" value={companyData.complianceOfficerName} onChange={handleCompanyChange} className="mt-1 block w-full input-style" />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="space-y-4">
                        <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Administrator Account</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="adminName-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <input type="text" name="name" id="adminName-modal" value={adminData.name} onChange={handleAdminChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="adminEmail-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input type="email" name="email" id="adminEmail-modal" value={adminData.email} onChange={handleAdminChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="adminPassword-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative mt-1">
                                    <input type={showPassword ? 'text' : 'password'} name="password" id="adminPassword-modal" value={adminData.password} onChange={handleAdminChange} required className="block w-full input-style pr-10" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="adminConfirmPassword-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                <div className="relative mt-1">
                                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" id="adminConfirmPassword-modal" value={adminData.confirmPassword} onChange={handleAdminChange} required className="block w-full input-style pr-10" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </main>
                <footer className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end items-center gap-4 sticky bottom-0 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">Create Company</button>
                </footer>
            </form>
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
    </div>
  );
};
