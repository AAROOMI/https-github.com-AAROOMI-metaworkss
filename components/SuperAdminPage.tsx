
import React, { useState } from 'react';
import { dbAPI } from '../db';
import type { CompanyProfile, User, License } from '../types';
import { BuildingOfficeIcon, UsersIcon, LockClosedIcon } from './Icons';

interface SuperAdminPageProps {
    currentUser: User;
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ currentUser }) => {
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [subscriptionTier, setSubscriptionTier] = useState<License['tier']>('yearly');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        // Calculate expiration
        const now = new Date();
        let months = 12;
        if (subscriptionTier === 'monthly') months = 1;
        if (subscriptionTier === 'quarterly') months = 3;
        if (subscriptionTier === 'semi-annually') months = 6;
        if (subscriptionTier === 'trial') months = 0.25; // 1 week approx

        const expiresAt = new Date(now.setMonth(now.getMonth() + months)).getTime();

        const licenseData: License = {
            key: `SA-GEN-${Date.now()}`,
            status: 'active',
            tier: subscriptionTier,
            expiresAt: expiresAt
        };

        const companyData = {
            name: companyName,
            logo: '',
            ceoName: '',
            cioName: '',
            cisoName: '',
            ctoName: '',
        };

        const adminData = {
            name: adminName,
            email: adminEmail,
            password: adminPassword
        };

        try {
            // Use the specialized system creation function to avoid session conflicts
            await dbAPI.createCompanySystem(companyData, adminData, licenseData);
            setMessage({ text: `Successfully created company "${companyName}" and admin "${adminEmail}".`, type: 'success' });
            // Reset form
            setCompanyName('');
            setAdminName('');
            setAdminEmail('');
            setAdminPassword('');
        } catch (error: any) {
            console.error(error);
            setMessage({ text: error.message || "Failed to create company system.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Console</h1>
                <p className="text-gray-500 dark:text-gray-400">System-wide provisioning for Companies, Users, and Subscriptions.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                        <BuildingOfficeIcon className="w-6 h-6 mr-2 text-teal-600" />
                        New Client Provisioning
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {message && (
                        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Company Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Company Profile</h3>
                            <p className="text-sm text-gray-500">Basic organization details.</p>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Admin User</h3>
                            <p className="text-sm text-gray-500">The initial Administrator account.</p>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Password</label>
                                <input 
                                    type="password" 
                                    required
                                    minLength={6}
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Subscription</h3>
                            <p className="text-sm text-gray-500">License tier and activation.</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan Tier</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {['trial', 'monthly', 'quarterly', 'semi-annually', 'yearly'].map((tier) => (
                                    <div key={tier} className="flex items-center">
                                        <input
                                            id={`tier-${tier}`}
                                            name="tier"
                                            type="radio"
                                            checked={subscriptionTier === tier}
                                            onChange={() => setSubscriptionTier(tier as any)}
                                            className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                                        />
                                        <label htmlFor={`tier-${tier}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                            {tier}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Provisioning System...' : 'Create Company System'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
