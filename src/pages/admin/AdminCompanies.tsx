import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Plus, Trash, Search, X, Edit, Check, Upload } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Alert } from '../../components/Alert';
import { FormInput } from '../../components/Form/FormInput';
import { LoadingState, LoadingSpinner } from '../../components/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useAdminStatus } from '../../hooks/useAdminStatus';
import { useCompanies, Company } from '../../hooks/useCompanies';
import { Modal } from '../../components/Modal';
import { CSVCompanyUploader } from '../../components/CSVCompanyUploader';

export default function AdminCompanies() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  
  const { companies, loading, error, addCompany, deleteCompany, fetchCompanies } = useCompanies();
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editedName, setEditedName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle adding a new company
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompanyName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await addCompany(newCompanyName.trim());
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setNewCompanyName('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add company');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle bulk upload of companies
  const handleBulkUpload = async (companies: string[]) => {
    if (companies.length === 0) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const companyName of companies) {
        const result = await addCompany(companyName.trim());
        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
      }
      
      // Close the modal
      setShowUploadModal(false);
      
      // Show success message
      if (errorCount > 0) {
        setSubmitError(`Added ${successCount} companies. Failed to add ${errorCount} companies.`);
      }
      
      // Refresh the list
      fetchCompanies();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to upload companies');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a company
  const handleDeleteCompany = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const result = await deleteCompany(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete company');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete company');
    }
  };
  
  // Handle editing a company
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditedName(company.name);
  };
  
  // Handle saving edited company
  const handleSaveEdit = async () => {
    if (!editingCompany || !editedName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Delete the old company
      await deleteCompany(editingCompany.id);
      
      // Add the new company with the edited name
      await addCompany(editedName.trim());
      
      setEditingCompany(null);
      setEditedName('');
      
      // Refresh the companies list
      fetchCompanies();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update company');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCompany(null);
    setEditedName('');
  };

  if (authLoading || adminLoading) {
    return <LoadingState />;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  if (!isAdmin) {
    navigate('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button 
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6 transition-colors duration-200"
        >
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <Building className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-4xl font-bold text-white">Manage Companies</h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mt-2">
              Add, edit, and delete companies for the Truth Wall dropdown selection.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={Upload}
              onClick={() => setShowUploadModal(true)}
            >
              Bulk Upload
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <Card className="border border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Building className="h-6 w-6 mr-3 text-[#FF8A00]" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {submitError && (
              <Alert
                variant="error"
                message={submitError}
                className="mb-4"
                onClose={() => setSubmitError(null)}
              />
            )}
            
            {/* Add new company form */}
            <form onSubmit={handleAddCompany} className="mb-8">
              <div className="flex gap-3">
                <FormInput
                  name="newCompanyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  label=""
                  placeholder="Enter company name"
                  icon={Building}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  leftIcon={Plus}
                  isLoading={isSubmitting}
                  disabled={!newCompanyName.trim() || isSubmitting}
                  className="self-end"
                  size="lg"
                >
                  Add Company
                </Button>
              </div>
            </form>
            
            {/* Search and filter */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent text-base"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Companies list */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
                <Building className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-white mb-3">No companies found</h3>
                <p className="text-gray-400 mb-6 text-lg">
                  {companies.length === 0 
                    ? "There are no companies in the system yet." 
                    : "No companies match your search criteria."}
                </p>
                {companies.length > 0 && searchTerm && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700 text-base">
                  <thead className="bg-gray-800 text-base">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {filteredCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-750">
                        <td className="px-6 py-5 whitespace-nowrap">
                          {editingCompany?.id === company.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00] text-base"
                            />
                          ) : (
                            <div className="text-white text-lg">{company.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-base font-medium">
                          {editingCompany?.id === company.id ? (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={Check}
                                onClick={handleSaveEdit}
                                isLoading={isSubmitting}
                                disabled={!editedName.trim() || isSubmitting}
                                className="text-green-400 border-green-500/30 hover:bg-green-900/20"
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={X}
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                                className="text-gray-400"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={Edit}
                                onClick={() => handleEditCompany(company)}
                                className="text-blue-400 hover:bg-blue-900/20"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={Trash}
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* CSV Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Bulk Upload Companies"
        size="lg"
      >
        <CSVCompanyUploader
          onUpload={handleBulkUpload}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>
    </div>
  );
}