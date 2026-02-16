import React, { useState } from 'react';
import type { User } from '../types';
import { EyeIcon, EyeSlashIcon } from './Icons';

interface UserProfilePageProps {
  currentUser: User;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  onEnableMfa: () => void;
  onDisableMfa: (password: string) => Promise<{ success: boolean; message: string }>;
}

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
);

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{description}</p>
            <div className="mt-6">
                {children}
            </div>
        </div>
    </div>
);


export const UserProfilePage: React.FC<UserProfilePageProps> = ({ currentUser, onChangePassword, onEnableMfa, onDisableMfa }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
            return;
        }

        const result = await onChangePassword(currentPassword, newPassword);
        if (result.success) {
            setPasswordMessage({ type: 'success', text: result.message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordMessage({ type: 'error', text: result.message });
        }
    };
    
    const handleDisableMfaClick = async () => {
        const password = prompt("To disable MFA, please enter your current password for verification:");
        if (password) {
            const result = await onDisableMfa(password);
            if (!result.success) {
                alert(result.message);
            }
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">My Profile</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">View your personal information and manage your account security settings.</p>
            </div>
            
            <Section title="Profile Information" description="Your personal details. Please contact an administrator to change this information.">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <InfoCard label="Full Name" value={currentUser.name} />
                    <InfoCard label="Email Address" value={currentUser.email} />
                    <InfoCard label="Role" value={currentUser.role} />
                    <InfoCard label="Access Expires" value={currentUser.accessExpiresAt ? new Date(currentUser.accessExpiresAt).toLocaleDateString() : 'Permanent'} />
                </dl>
            </Section>

            <Section title="Change Password" description="Update your password regularly to keep your account secure.">
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                    <div>
                        <label htmlFor="current-password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Current Password</label>
                        <div className="relative mt-1">
                            <input type={showCurrentPassword ? 'text' : 'password'} id="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="block w-full input-style pr-10" />
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">New Password</label>
                         <div className="relative mt-1">
                            <input type={showNewPassword ? 'text' : 'password'} id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="block w-full input-style pr-10" />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Confirm New Password</label>
                         <div className="relative mt-1">
                            <input type={showConfirmPassword ? 'text' : 'password'} id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="block w-full input-style pr-10" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    
                    {passwordMessage && (
                        <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{passwordMessage.text}</p>
                    )}
                    
                    <div className="pt-2">
                        <button type="submit" className="inline-flex justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500">
                            Update Password
                        </button>
                    </div>
                </form>
            </Section>

            <Section title="Multi-Factor Authentication (MFA)" description="Add an extra layer of security to your account by requiring a second verification step when you sign in.">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Status: <span className={`font-semibold ${currentUser.mfaEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {currentUser.mfaEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </p>
                    </div>
                    <div>
                        {currentUser.mfaEnabled ? (
                            <button onClick={handleDisableMfaClick} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
                                Disable MFA
                            </button>
                        ) : (
                            <button onClick={onEnableMfa} className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500">
                                Enable MFA
                            </button>
                        )}
                    </div>
                </div>
            </Section>
            
            <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; background-color: white; color: #111827; } .dark .input-style { background-color: #374151; border-color: #4b5563; color: #f9fafb; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #14b8a6; --tw-ring-color: #14b8a6; }`}</style>

        </div>
    );
};