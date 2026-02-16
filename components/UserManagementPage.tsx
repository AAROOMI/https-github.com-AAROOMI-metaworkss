
import React, { useState, useEffect } from 'react';
import type { User, UserRole, AuditAction } from '../types';
import { rolePermissions } from '../types';
import { CloseIcon, EyeIcon, EyeSlashIcon } from './Icons';

const allRoles: UserRole[] = ['Administrator', 'CISO', 'CTO', 'CIO', 'CEO', 'Security Analyst', 'Employee'];

interface UserFormModalProps {
    user: User | null;
    onClose: () => void;
    onSave: (user: User) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<User, 'id' | 'accessExpiresAt' | 'password' | 'isVerified' | 'passwordResetToken' | 'passwordResetExpires'>>({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'Employee',
    });
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [expirationOption, setExpirationOption] = useState('permanent');
    const [customDate, setCustomDate] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user?.accessExpiresAt) {
            const date = new Date(user.accessExpiresAt);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            setCustomDate(`${yyyy}-${mm}-${dd}`);
            setExpirationOption('custom');
        } else {
            setExpirationOption('permanent');
            setCustomDate('');
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!user && !password) {
            alert("Password is required for new users.");
            return;
        }

        if ((password && password.length < 6) || (!user && password.length < 6)) {
             alert("Password must be at least 6 characters.");
             return;
        }

        if (user && user.role !== formData.role) {
            const confirmationMessage = `You are about to change this user's role from "${user.role}" to "${formData.role}".\n\nThis will significantly change their permissions. Are you sure you want to continue?`;
            if (!window.confirm(confirmationMessage)) {
                return;
            }
        }
        
        let accessExpiresAt: number | undefined = undefined;
        const now = new Date();
        switch (expirationOption) {
            case 'week':
                accessExpiresAt = new Date(now.setDate(now.getDate() + 7)).getTime();
                break;
            case 'month':
                accessExpiresAt = new Date(now.setMonth(now.getMonth() + 1)).getTime();
                break;
            case 'custom':
                 if (customDate) {
                    // Set to end of the selected day
                    const date = new Date(customDate);
                    date.setHours(23, 59, 59, 999);
                    accessExpiresAt = date.getTime();
                }
                break;
            case 'permanent':
            default:
                accessExpiresAt = undefined;
                break;
        }

        const finalUser: User = {
            id: user?.id || `user-${Date.now()}`,
            ...formData,
            accessExpiresAt,
            password: password || undefined,
            isVerified: user?.isVerified ?? false,
        };
        onSave(finalUser);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user ? 'Edit User' : 'Create New User'}</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <CloseIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </header>
                    <main className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                         <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <div className="relative mt-1">
                                <input type={showPassword ? 'text' : 'password'} name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? "Leave blank to keep current password" : ""} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-gray-200 pr-10" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                             <div className="relative mt-1">
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-gray-200 pr-10" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300">Access Duration</legend>
                            <div className="mt-2 space-y-2">
                                {['permanent', 'week', 'month', 'custom'].map(option => (
                                    <div key={option} className="flex items-center">
                                        <input
                                            id={`expiration-${option}`}
                                            name="expiration"
                                            type="radio"
                                            value={option}
                                            checked={expirationOption === option}
                                            onChange={(e) => setExpirationOption(e.target.value)}
                                            className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:checked:bg-teal-500"
                                        />
                                        <label htmlFor={`expiration-${option}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {option === 'permanent' && 'Permanent'}
                                            {option === 'week' && 'Expires in 1 Week'}
                                            {option === 'month' && 'Expires in 1 Month'}
                                            {option === 'custom' && 'Set Expiration Date'}
                                        </label>
                                    </div>
                                ))}
                                {expirationOption === 'custom' && (
                                     <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        required
                                        className="mt-2 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-900 dark:text-gray-200"
                                    />
                                )}
                            </div>
                        </fieldset>
                    </main>
                    <footer className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right rounded-b-lg">
                        <button type="button" onClick={onClose} className="mr-2 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">Cancel</button>
                        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none">Save User</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

interface UserManagementPageProps {
    users: User[];
    setUsers: (updater: React.SetStateAction<User[]>) => void;
    currentUser: User;
    addNotification: (message: string, type?: 'success' | 'info') => void;
    addAuditLog: (action: AuditAction, details: string, targetId?: string) => void;
    onUserCreate: (user: User) => Promise<void>;
    onUserUpdate: (user: User) => Promise<void>;
    onUserDelete: (userId: string) => Promise<void>;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ 
    users, 
    setUsers, 
    currentUser, 
    addNotification, 
    addAuditLog,
    onUserCreate,
    onUserUpdate,
    onUserDelete
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const currentUserPermissions = new Set(rolePermissions[currentUser.role] || []);
    const canCreate = currentUserPermissions.has('users:create');
    const canUpdate = currentUserPermissions.has('users:update');
    const canDelete = currentUserPermissions.has('users:delete');
    const canPerformActions = canUpdate || canDelete;

    const handleCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: string) => {
        const userToDelete = users.find(u => u.id === userId);
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await onUserDelete(userId);
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
                if (userToDelete) {
                    addAuditLog('USER_DELETED', `Deleted user: ${userToDelete.name} (${userToDelete.email}).`, userId);
                }
            } catch (e) {
                console.error(e);
                addNotification("Failed to delete user.", "info");
            }
        }
    };

    const handleSaveUser = async (user: User) => {
        if (editingUser) {
            // Update
            const changes: string[] = [];
            if (editingUser.name !== user.name) {
                changes.push(`Name changed from "${editingUser.name}" to "${user.name}"`);
            }
            if (editingUser.email !== user.email) {
                changes.push(`Email changed from "${editingUser.email}" to "${user.email}"`);
            }
            if (editingUser.role !== user.role) {
                changes.push(`Role changed from "${editingUser.role}" to "${user.role}"`);
            }
            if (user.password) {
                changes.push("Password was changed");
            }
            const oldExpires = editingUser.accessExpiresAt ? new Date(editingUser.accessExpiresAt).toLocaleDateString() : 'Permanent';
            const newExpires = user.accessExpiresAt ? new Date(user.accessExpiresAt).toLocaleDateString() : 'Permanent';
            if (oldExpires !== newExpires) {
                changes.push(`Access expiration changed from ${oldExpires} to ${newExpires}`);
            }
    
            const details = changes.length > 0 ? changes.join('; ') : 'No changes were made.';
            
            try {
                await onUserUpdate(user);
                addAuditLog('USER_UPDATED', `Updated user ${user.name}: ${details}`, user.id);
                setUsers(prevUsers => prevUsers.map(u => {
                    if (u.id === user.id) {
                        return {
                            ...u,
                            ...user,
                            password: user.password ? user.password : u.password,
                        };
                    }
                    return u;
                }));
            } catch (e) {
                console.error(e);
                addNotification("Failed to update user in database.", "info");
            }
    
        } else {
            // Create a new user
            const newUser: User = { ...user };
            try {
                await onUserCreate(newUser);
                
                // Update UI - Note: if onUserCreate changed the ID (to sync with Auth UID), 
                // the ID in the list might be stale until refresh, but this keeps the UI responsive.
                setUsers(prevUsers => [...prevUsers, newUser]);
                
                const expires = newUser.accessExpiresAt ? ` until ${new Date(newUser.accessExpiresAt).toLocaleDateString()}` : '';
                addAuditLog('USER_CREATED', `Created new user: ${newUser.name} (${newUser.email}) with role ${newUser.role}. Access is ${newUser.accessExpiresAt ? 'temporary' : 'permanent'}${expires}.`, newUser.id);
        
                if (!newUser.isVerified) {
                    addNotification(`Verification email sent to ${newUser.email}. User must verify account before logging in.`, 'info');
                }
                setIsModalOpen(false);
                setEditingUser(null);
            } catch (e: any) {
                console.error(e);
                const errMsg = e.code === 'auth/email-already-in-use' 
                    ? 'This email is already registered.' 
                    : `Failed to create user: ${e.message || "Unknown error"}`;
                addNotification(errMsg, "info");
                // Don't close modal on error so user can fix input
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">User Management</h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Create, edit, and manage user roles and time-based permissions.</p>
                </div>
                {canCreate && (
                    <button onClick={handleCreate} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                        Create New User
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <div className="align-middle inline-block min-w-full">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Access Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expires On</th>
                                    {canPerformActions && (
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => {
                                    const isExpired = user.accessExpiresAt && user.accessExpiresAt < Date.now();
                                    return (
                                    <tr key={user.id} className={isExpired ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                                {!user.isVerified && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Unverified</span>}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isExpired ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                                {isExpired ? 'Expired' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {user.accessExpiresAt ? new Date(user.accessExpiresAt).toLocaleDateString() : 'Permanent'}
                                        </td>
                                        {canPerformActions && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {canUpdate && <button onClick={() => handleEdit(user)} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200">{isExpired ? 'Re-activate' : 'Edit'}</button>}
                                                {canDelete && user.id !== currentUser.id && <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Delete</button>}
                                            </td>
                                        )}
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && <UserFormModal user={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />}
        </div>
    );
};
