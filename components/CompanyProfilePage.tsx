
import React, { useState, useEffect, useRef } from 'react';
import type { CompanyProfile, License, User } from '../types';
import { SunIcon, MoonIcon, ClipboardIcon, CheckIcon, CloseIcon } from './Icons';
import { CreateCompanyModal } from './CreateCompanyModal';

interface CompanyProfilePageProps {
  company: CompanyProfile | null | undefined;
  onSave: (profile: CompanyProfile) => void;
  canEdit: boolean;
  addNotification: (message: string, type?: 'success' | 'info') => void;
  currentUser: User;
  onSetupCompany: (
    profileData: Omit<CompanyProfile, 'id' | 'license'>,
    adminData: Omit<User, 'id' | 'isVerified' | 'role'>
  ) => void;
}

const LicenseStatus: React.FC<{ license?: License }> = ({ license }) => {
    if (!license || license.status === 'inactive') {
        return (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-500/50 rounded-md">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">No Active License</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Please activate a license key to enable the application.</p>
            </div>
        );
    }

    const isExpired = license.expiresAt < Date.now() || license.status === 'expired';
    const statusText = isExpired ? 'Expired' : 'Active';
    const statusColor = isExpired ? 'text-red-500' : 'text-green-500';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                <span className={`font-bold text-lg ${statusColor}`}>{statusText}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{license.tier}</span>
            </div>
             <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires On</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(license.expiresAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
};


interface GeneratedKeyModalProps {
    generatedKey: { key: string; tier: License['tier']; expiresAt: number };
    onClose: () => void;
    onActivate: (license: License) => void;
}

const GeneratedKeyModal: React.FC<GeneratedKeyModalProps> = ({ generatedKey, onClose, onActivate }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedKey.key).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleActivate = () => {
        onActivate({
            key: generatedKey.key,
            tier: generatedKey.tier,
            expiresAt: generatedKey.expiresAt,
            status: 'active'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">License Key Generated</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your new license key has been created. You can copy it to share or activate it immediately for this company.
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Generated Key</label>
                        <div className="mt-1 flex items-center space-x-2 p-2 rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600">
                            <input type="text" readOnly value={generatedKey.key} className="flex-grow bg-transparent text-xs font-mono text-gray-600 dark:text-gray-300 focus:outline-none" />
                            <button type="button" onClick={handleCopy} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5 text-gray-500" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Tier</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{generatedKey.tier}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires On</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(generatedKey.expiresAt).toLocaleDateString()}</span>
                    </div>
                </main>
                <footer className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3 rounded-b-lg">
                    <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-50">Close</button>
                    <button type="button" onClick={handleActivate} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">Activate Now</button>
                </footer>
            </div>
        </div>
    );
};


interface LicenseGeneratorProps {
    company: CompanyProfile;
    onKeyGenerated: (keyDetails: { key: string; tier: License['tier']; expiresAt: number }) => void;
}

const LicenseGenerator: React.FC<LicenseGeneratorProps> = ({ company, onKeyGenerated }) => {
    const generateKey = (tier: License['tier'], months: number) => {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        const key = btoa(`${company.id}:${tier}:${expiresAt.getTime()}`);
        onKeyGenerated({ key, tier, expiresAt: expiresAt.getTime() });
    };

    const tiers: { label: string; tier: License['tier']; months: number }[] = [
        { label: '1 Month', tier: 'monthly', months: 1 },
        { label: '3 Months', tier: 'quarterly', months: 3 },
        { label: '6 Months', tier: 'semi-annually', months: 6 },
        { label: '1 Year', tier: 'yearly', months: 12 },
        { label: '2 Years', tier: 'yearly', months: 24 },
    ];
    
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">License Key Generator</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Create a new license key for this company. The generated key can then be activated below.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tiers.map(({label, tier, months}) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => generateKey(tier, months)}
                        className="w-full text-center py-2 px-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Generate {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ company, onSave, canEdit, addNotification, currentUser, onSetupCompany }) => {
  const [formData, setFormData] = useState<Omit<CompanyProfile, 'id' | 'license'>>({
    name: '',
    logo: '',
    ceoName: '',
    cioName: '',
    cisoName: '',
    ctoName: '',
    cybersecurityOfficerName: '',
    dpoName: '',
    complianceOfficerName: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [generatedKey, setGeneratedKey] = useState<{ key: string; tier: License['tier']; expiresAt: number } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        logo: company.logo,
        ceoName: company.ceoName,
        cioName: company.cioName,
        cisoName: company.cisoName,
        ctoName: company.ctoName,
        cybersecurityOfficerName: company.cybersecurityOfficerName || '',
        dpoName: company.dpoName || '',
        complianceOfficerName: company.complianceOfficerName || '',
      });
      setIsEditing(false); 
    } else {
      setIsEditing(true);
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          addNotification('Logo image cannot exceed 2MB.', 'info');
          return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFormData(prev => ({ ...prev, logo: loadEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profileToSave: CompanyProfile = {
      id: company?.id || `company-${Date.now()}`,
      ...formData,
      license: company?.license, // Preserve existing license when just editing profile
    };
    onSave(profileToSave);
    setIsEditing(false);
  };
  
  const handleActivateLicense = (license: License | string) => {
    if (!company) return;

    let newLicense: License;
    
    if (typeof license === 'string') {
        if (!license) {
            addNotification('Please enter a license key.', 'info');
            return;
        }
        try {
            const decoded = atob(license);
            const [companyId, tier, expiresAtStr] = decoded.split(':');
            const expiresAt = parseInt(expiresAtStr, 10);

            if (companyId !== company.id || !['monthly', 'quarterly', 'semi-annually', 'yearly', 'trial'].includes(tier) || isNaN(expiresAt)) {
                throw new Error("Invalid license key format or mismatched company.");
            }

            if (expiresAt < Date.now()) {
                throw new Error("This license key has already expired.");
            }
            
            newLicense = {
                key: license,
                status: 'active',
                tier: tier as License['tier'],
                expiresAt: expiresAt,
            };

        } catch (error: any) {
            addNotification(error.message || 'Invalid or malformed license key.', 'info');
            return;
        }
    } else {
        newLicense = license;
    }

    const updatedProfile: CompanyProfile = { ...company, ...formData, license: newLicense };
    onSave(updatedProfile);
    addNotification('License activated successfully!', 'success');
    setNewLicenseKey('');
    if (generatedKey) setGeneratedKey(null);
  };

  const handleSetupNewCompany = (
    profileData: Omit<CompanyProfile, 'id' | 'license'>,
    adminData: Omit<User, 'id' | 'isVerified' | 'role'>
  ) => {
    onSetupCompany(profileData, adminData);
    setIsCreateModalOpen(false);
  };
  
  const pageContent = (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Company Profile</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Manage your company information, logo, and subscription.</p>
            </div>
             {currentUser.role === 'Administrator' && (
                <button onClick={() => setIsCreateModalOpen(true)} className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Create New Company
                </button>
             )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
                    <div className="p-6 flex-grow">
                         <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="cisoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CISO Name</label>
                                    <input type="text" name="cisoName" id="cisoName" value={formData.cisoName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="ceoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CEO Name</label>
                                    <input type="text" name="ceoName" id="ceoName" value={formData.ceoName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="cioName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CIO Name</label>
                                    <input type="text" name="cioName" id="cioName" value={formData.cioName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="ctoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTO Name</label>
                                    <input type="text" name="ctoName" id="ctoName" value={formData.ctoName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="cybersecurityOfficerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cybersecurity Officer</label>
                                    <input type="text" name="cybersecurityOfficerName" id="cybersecurityOfficerName" value={formData.cybersecurityOfficerName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="dpoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Protection Officer (DPO)</label>
                                    <input type="text" name="dpoName" id="dpoName" value={formData.dpoName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                                <div>
                                    <label htmlFor="complianceOfficerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Officer</label>
                                    <input type="text" name="complianceOfficerName" id="complianceOfficerName" value={formData.complianceOfficerName} onChange={handleChange} required disabled={!isEditing} className="mt-1 block w-full input-style" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end items-center">
                            {isEditing ? (
                                <>
                                   {company && <button type="button" onClick={() => { setIsEditing(false); if(company) setFormData(company); }} className="mr-2 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-gray-500">Cancel</button>}
                                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">Save Profile</button>
                                </>
                            ) : (
                                <button type="button" onClick={() => setIsEditing(true)} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    )}
                </form>
            </div>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Company Logo</label>
                    <div className="flex flex-col items-center">
                        <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                        {formData.logo ? (
                            <img src={formData.logo} alt="Company Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-500 text-sm">No Logo</span>
                        )}
                        </div>
                        {isEditing && (
                            <>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500">
                                    Upload Logo
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                            </>
                        )}
                    </div>
                </div>
                 {company && (
                    <>
                        {canEdit && (
                            <LicenseGenerator company={company} onKeyGenerated={setGeneratedKey} />
                        )}

                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">License Management</h3>
                            <LicenseStatus license={company?.license} />
                            {canEdit && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                     <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activate New License</label>
                                     <input 
                                        type="text" 
                                        name="licenseKey" 
                                        id="licenseKey" 
                                        value={newLicenseKey}
                                        onChange={(e) => setNewLicenseKey(e.target.value)}
                                        placeholder="Enter license key..." 
                                        className="mt-1 block w-full input-style" 
                                     />
                                     <button 
                                        type="button" 
                                        onClick={() => handleActivateLicense(newLicenseKey)}
                                        disabled={!newLicenseKey}
                                        className="mt-3 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400"
                                    >
                                        Activate License
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                 )}
            </div>
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
            .input-style:disabled {
                background-color: #f3f4f6;
                color: #6b7280;
                cursor: not-allowed;
            }
            .dark .input-style {
                background-color: #374151;
                border-color: #4b5563;
                color: #f9fafb;
            }
            .dark .input-style:disabled {
                 background-color: #4b5563;
                color: #9ca3af;
            }
        `}</style>
    </div>
  );

  return (
    <>
        {pageContent}
        {generatedKey && (
            <GeneratedKeyModal 
                generatedKey={generatedKey}
                onClose={() => setGeneratedKey(null)}
                onActivate={handleActivateLicense}
            />
        )}
        {isCreateModalOpen && (
            <CreateCompanyModal 
                onSetup={handleSetupNewCompany}
                onClose={() => setIsCreateModalOpen(false)}
            />
        )}
    </>
  );
};
