
import React, { useState } from 'react';
import { LogoIcon, ShieldCheckIcon, UserGroupIcon, ChartPieIcon, SunIcon, MoonIcon, CheckIcon, ClipboardIcon, ChatBotIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{error: string, code?: string} | null>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onSetupCompany: () => void;
  onVerify: (email: string) => boolean;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string; token?: string }>;
  onResetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex flex-col items-center p-6 text-center bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-full text-teal-600 dark:text-teal-300">
            {icon}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{children}</p>
    </div>
);

const SignInView: React.FC<Omit<LoginPageProps, 'theme' | 'toggleTheme' | 'onSetupCompany' | 'onForgotPassword' | 'onResetPassword'> & { setView: (view: 'forgotPassword') => void; }> = ({ onLogin, onVerify, setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<{message: string, code?: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const loginResult = await onLogin(email, password);
        if (loginResult) {
            setError({ message: loginResult.error, code: loginResult.code });
        }
        setIsLoading(false);
    };

    const handleVerificationClick = () => {
        if (onVerify(email)) {
            setError(null);
        } else {
            setError({ message: "An error occurred during verification. Please contact an administrator." });
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                </label>
                <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                </label>
                <div className="mt-1 relative">
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
             <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => setView('forgotPassword')} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300">
                        Forgot your password?
                    </button>
                </div>
            </div>
            {error && (
                <div className={`p-4 rounded-md border ${error.code === 'unverified' ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-500/50' : 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-500/50'}`}>
                    <p className={`text-sm text-center ${error.code === 'unverified' ? 'text-yellow-800 dark:text-yellow-200' : 'text-red-700 dark:text-red-200'}`}>{error.message}</p>
                    {error.code === 'unverified' && (
                        <>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 text-center">Click the button below to simulate verifying your email address.</p>
                            <button type="button" onClick={handleVerificationClick} className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                                Verify My Email
                            </button>
                        </>
                    )}
                </div>
            )}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                    {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Sign in"}
                </button>
            </div>
        </form>
    );
};

const ForgotPasswordView: React.FC<{ onForgotPassword: LoginPageProps['onForgotPassword']; setView: (view: 'signIn' | 'resetPassword') => void }> = ({ onForgotPassword, setView }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setToken(null);
        const result = await onForgotPassword(email);
        setMessage(result.message);
        if (result.success && result.token) {
            setToken(result.token);
        }
        setIsLoading(false);
    };
    
    const handleCopy = () => {
        if (token) {
            navigator.clipboard.writeText(token).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                <div className="mt-1">
                    <input id="email-forgot" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </div>
            </div>
            {message && (
                <div className="p-4 rounded-md border bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-500/50">
                    <p className="text-sm text-center text-blue-800 dark:text-blue-200">{message}</p>
                    {token && (
                        <div className="mt-3">
                            <div className="flex items-center space-x-2 p-2 rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600">
                                <input type="text" readOnly value={token} className="flex-grow bg-transparent text-xs font-mono text-gray-600 dark:text-gray-300 focus:outline-none" />
                                <button type="button" onClick={handleCopy} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5 text-gray-500" />}
                                </button>
                            </div>
                            <button type="button" onClick={() => setView('resetPassword')} className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 w-full text-center">
                                I have my token, proceed to reset &rarr;
                            </button>
                        </div>
                    )}
                </div>
            )}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                    {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Send Reset Link"}
                </button>
            </div>
            <div className="text-center text-sm">
                <button type="button" onClick={() => setView('signIn')} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300">
                    &larr; Back to Sign In
                </button>
            </div>
        </form>
    );
};

const ResetPasswordView: React.FC<{ onResetPassword: LoginPageProps['onResetPassword']; setView: (view: 'signIn') => void }> = ({ onResetPassword, setView }) => {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');
        const result = await onResetPassword(token, password);
        if (result.success) {
            setMessage(result.message);
            setTimeout(() => setView('signIn'), 3000);
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reset Token</label>
                <input id="token" name="token" type="text" required value={token} onChange={(e) => setToken(e.target.value)}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div>
                <label htmlFor="new-password">New Password</label>
                <div className="mt-1 relative">
                    <input id="new-password" name="newPassword" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="confirm-password">Confirm New Password</label>
                <div className="mt-1 relative">
                    <input id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            {message && <p className="text-sm text-center p-4 rounded-md border bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-500/50 text-green-800 dark:text-green-200">{message}</p>}
            {error && <p className="text-sm text-center p-4 rounded-md border bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200">{error}</p>}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                    {isLoading ? "Resetting..." : "Set New Password"}
                </button>
            </div>
            <div className="text-center text-sm">
                <button type="button" onClick={() => setView('signIn')} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300">
                    &larr; Back to Sign In
                </button>
            </div>
        </form>
    );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, theme, toggleTheme, onSetupCompany, onVerify, onForgotPassword, onResetPassword }) => {
    const [view, setView] = useState<'signIn' | 'forgotPassword' | 'resetPassword'>('signIn');

    const viewTitles = {
        signIn: 'Sign in to Metaworks',
        forgotPassword: 'Reset your password',
        resetPassword: 'Set a new password',
    };
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
            <div className="absolute top-0 right-0 p-6">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-900"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <LogoIcon className="mx-auto h-20 w-auto text-teal-600" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-tighter">
                    {viewTitles[view]}
                </h2>
                <p className="mt-2 text-center text-sm font-bold text-teal-600 dark:text-teal-400">
                    Metaworks GRC Platform
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                    {view === 'signIn' && <SignInView onLogin={onLogin} onVerify={onVerify} setView={setView} />}
                    {view === 'forgotPassword' && <ForgotPasswordView onForgotPassword={onForgotPassword} setView={setView} />}
                    {view === 'resetPassword' && <ResetPasswordView onResetPassword={onResetPassword} setView={setView} />}
                    
                    {view === 'signIn' && (
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">New to the platform?</span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <button type="button" onClick={onSetupCompany} className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                                    Create New Company Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center">
                    <h2 className="text-base font-semibold text-teal-600 tracking-wide uppercase">Features</h2>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight sm:text-4xl">
                        Intelligent Compliance Orchestration
                    </p>
                    <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        An interactive platform to manage, implement, and track international security standards under the Metaworks umbrella.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                     <FeatureCard title="Interactive Controls" icon={<ShieldCheckIcon className="w-8 h-8"/>}>
                        Easily browse, search, and understand complete frameworks with AI-driven implementation guidelines.
                    </FeatureCard>
                    <FeatureCard title="AI-Powered Assistance" icon={<ChatBotIcon className="w-8 h-8"/>}>
                        Engage with specialized AI agents for automated documentation, live voice assessments, and expert guidance.
                    </FeatureCard>
                    <FeatureCard title="Role-Based Access" icon={<UserGroupIcon className="w-8 h-8"/>}>
                        Manage user permissions with a robust RBAC system, ensuring secure collaboration across the organization.
                    </FeatureCard>
                    <FeatureCard title="Postural Awareness" icon={<ChartPieIcon className="w-8 h-8"/>}>
                        Visualize your organization's compliance and risk posture at a glance with interactive reports.
                    </FeatureCard>
                </div>
            </div>
        </div>
    );
};
