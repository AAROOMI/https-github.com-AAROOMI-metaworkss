
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { LogoIcon, MoonIcon, SunIcon, ClipboardIcon, CheckIcon } from './Icons';

declare const QRCode: any;

interface MfaSetupPageProps {
  user: User;
  companyName: string;
  onVerified: (userId: string, verificationCode: string) => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const MfaSetupPage: React.FC<MfaSetupPageProps> = ({ user, companyName, onVerified, onCancel, theme, toggleTheme }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (user.mfaSecret && typeof QRCode !== 'undefined') {
        const issuer = encodeURIComponent(companyName);
        const account = encodeURIComponent(user.email);
        const secret = user.mfaSecret;
        const otpAuthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;

        QRCode.toDataURL(otpAuthUrl, { width: 224, margin: 1 }, (err: any, url: string) => {
            if (err) {
                console.error('Failed to generate QR code', err);
            } else {
                setQrCodeUrl(url);
            }
            setIsLoadingQr(false);
        });
    } else if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded.');
        setIsLoadingQr(false);
    }
  }, [user.mfaSecret, user.email, companyName]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    const result = await onVerified(user.id, verificationCode);
    if (!result.success) {
        setError(result.message || 'Verification failed. Please try again.');
        setIsVerifying(false);
    }
  };

  const handleCopy = () => {
    if (user.mfaSecret) {
        navigator.clipboard.writeText(user.mfaSecret).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }
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
                Cancel Setup
            </button>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <LogoIcon className="mx-auto h-16 w-auto text-teal-600" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                Set Up Multi-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Enhance your account security.
            </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Step 1: Scan QR Code</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Open your authenticator app (e.g., Google Authenticator, Authy) and scan the image below.
                        </p>
                        <div className="mt-4 inline-block p-2 bg-white rounded-lg">
                            {isLoadingQr ? (
                                <div className="w-56 h-56 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
                                    <p className="text-sm text-gray-500">Generating QR...</p>
                                </div>
                            ) : qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="QR Code for MFA setup" className="w-56 h-56" />
                            ) : (
                                <div className="w-56 h-56 bg-red-100 dark:bg-red-900/50 rounded-md flex items-center justify-center p-4">
                                    <p className="text-sm text-red-700 dark:text-red-200 text-center">Could not generate QR code. Please use the manual entry key.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-6">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Step 2: Manual Entry</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                           If you can't scan the code, manually enter this setup key into your app.
                        </p>
                        <div className="mt-2">
                            <div className="flex items-center space-x-2 p-2 rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600">
                                <input type="text" readOnly value={user.mfaSecret || ''} className="flex-grow bg-transparent text-sm font-mono text-gray-600 dark:text-gray-300 focus:outline-none tracking-wider" />
                                <button type="button" onClick={handleCopy} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5 text-gray-500" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <div>
                        <label htmlFor="code" className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-base text-gray-800 dark:text-gray-200 block mb-1">Step 3: Verify Code</span>
                            <span className="text-gray-600 dark:text-gray-400 font-normal">Enter the 6-digit code from your authenticator app to complete setup.</span>
                        </label>
                        <div className="mt-2">
                            <input id="code" name="code" type="text" inputMode="numeric" pattern="\\d{6}" autoComplete="one-time-code" required
                                value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 text-center tracking-[0.5em]" />
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>}
                    <div>
                        <button type="submit" disabled={isVerifying} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400">
                            {isVerifying ? 'Verifying...' : 'Verify & Enable MFA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};
