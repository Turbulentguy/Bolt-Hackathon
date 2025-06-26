import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowLeft, ExternalLink, Clipboard, Loader2, Trash2, AlertCircle, History as HistoryIcon, FileText, Upload } from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  authors: string;
  published: string;
  pdf_link: string;
  bibtex: string;
  summary: string;
  created_at: string;
}

export function History() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Toggle summary expansion
  const toggleSummary = (paperId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
  };
  
  // Function to handle paper deletion
  const handleDeletePaper = async (paperId: string) => {
    setDeletingId(paperId);
    setShowDeleteConfirm(true);
  };

  // Function to confirm and execute deletion
  const confirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;

      // Remove the deleted paper from state
      setPapers(papers.filter(paper => paper.id !== deletingId));
      
      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      setError(err.message || 'Failed to delete paper');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  // Function to handle delete all papers
  const handleDeleteAllPapers = () => {
    if (papers.length === 0) return;
    setShowDeleteAllConfirm(true);
  };

  // Function to confirm and execute delete all
  const confirmDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      const { error } = await supabase
        .from('papers')
        .delete()
        .in('id', papers.map(paper => paper.id));
      
      if (error) throw error;

      // Clear all papers from state
      setPapers([]);
      
      // Close the confirmation dialog
      setShowDeleteAllConfirm(false);
    } catch (err: any) {
      console.error('Error deleting all papers:', err);
      setError(err.message || 'Failed to delete all papers');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Cancel delete all
  const cancelDeleteAll = () => {
    setShowDeleteAllConfirm(false);
  };

  useEffect(() => {
    async function fetchPapers() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all papers from Supabase - since there's no user_id column yet
        // In a real app, you would add a user_id column to associate papers with users
        const { data, error } = await supabase
          .from('papers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPapers(data || []);
      } catch (err: any) {
        console.error('Error fetching papers:', err);
        setError(err.message || 'Failed to fetch papers');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPapers();  }, [user]);
  // Function to format date in a readable way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  // Function to format date with time in Thai timezone but English text
  const formatDateWithTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    });
  };

  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Function to format text with markdown headers and basic formatting
  const formatText = (text: string) => {
    if (!text) return text;
    
    // Handle Markdown headers
    return text
      // Handle ##### smallest subheadings
      .replace(/^##### (.+)$/gm, '<h6 class="text-sm font-semibold text-gray-800 mb-1 mt-2">$1</h6>')
      // Handle #### subheadings
      .replace(/^#### (.+)$/gm, '<h5 class="text-base font-semibold text-gray-800 mb-1 mt-2">$1</h5>')
      // Handle ### subheadings
      .replace(/^### (.+)$/gm, '<h4 class="text-lg font-semibold text-gray-800 mb-1 mt-3">$1</h4>')
      // Handle ## headings
      .replace(/^## (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-800 mb-2 mt-4">$1</h3>')
      // Handle # main headings
      .replace(/^# (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-800 mb-3 mt-5">$1</h2>')
      // Handle **bold** text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
      // Handle *italic* text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>')
      // Handle line breaks
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen">      <header className="bg-glass sticky top-0 z-10 border-b border-white/30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 bg-white/80 px-3 py-1.5 rounded-xl transition-all duration-200 hover:shadow-soft hover:bg-white">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium">Logged in as: {user?.email}</span>
            </div>
          </div>
        </div>
      </header>      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-card border border-white/50 animate-scale-up">
            <div className="flex items-center space-x-3 text-red-600 mb-6">
              <div className="p-2 rounded-full bg-red-50">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium">Confirm Deletion</h3>
            </div>
            <p className="text-gray-700 mb-8 leading-relaxed">
              Are you sure you want to delete this paper from your history? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-red-glow transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-card border border-white/50 animate-scale-up">
            <div className="flex items-center space-x-3 text-red-600 mb-6">
              <div className="p-2 rounded-full bg-red-50">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium">Delete All History</h3>
            </div>
            <p className="text-gray-700 mb-8 leading-relaxed">
              Are you sure you want to delete all papers from your search history? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDeleteAll}
                className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-red-glow transition-all duration-200"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        <div className="relative bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl shadow-card p-8 mb-8 border border-white/40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 opacity-70"></div>
          <div className="absolute -bottom-2 -right-2 w-40 h-40 bg-gradient-to-br from-primary-400/30 to-accent-500/30 rounded-full blur-2xl"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-tr from-secondary-400/30 to-primary-400/30 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center relative z-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-4 text-shadow-md bg-gradient-to-r from-primary-700 via-accent-700 to-secondary-700 inline-block text-transparent bg-clip-text">
                Search History
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                View your past searches and revisit research papers you've discovered.
              </p>
            </div>
            {papers.length > 0 && (
              <button
                onClick={handleDeleteAllPapers}
                className="mt-4 sm:mt-0 px-4 py-2 flex items-center gap-2 bg-red-50/90 backdrop-blur-sm text-red-600 hover:bg-red-100 rounded-xl border border-red-200 shadow-soft hover:shadow-red-glow transition-all duration-300"
                disabled={isLoading || isDeletingAll}
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Delete All History</span>
              </button>
            )}
          </div>
        </div>        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-white/50">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-accent-100/20 rounded-xl -z-10"></div>
              <Loader2 className="h-8 w-8 text-accent-500 animate-spin" />
              <span className="ml-2 text-gray-700 font-medium mt-2 block text-center">Loading your papers...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-soft my-4 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p>Error: {error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200 font-medium" 
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : (<div className="overflow-x-auto rounded-2xl shadow-card">
            <table className="min-w-full bg-white/90 backdrop-blur-sm overflow-hidden">
              <thead className="bg-gradient-to-r from-primary-100/80 to-secondary-100/80">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-white/50 first:rounded-tl-xl">Title</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-white/50">Authors</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-white/50">Published</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-white/50">Added</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-white/50">Actions</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 border-b border-white/50 last:rounded-tr-xl">Summary</th>
                </tr>
              </thead>              <tbody className="divide-y divide-gray-100">
                {papers.map((paper) => (
                  <React.Fragment key={paper.id}>
                    <tr
                      className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-secondary-50/50 transition-all duration-200 cursor-pointer group"
                      onClick={() => toggleSummary(paper.id)}
                    >                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-secondary-600 group-hover:text-accent-600 transition-colors duration-200">
                          <div className="flex items-center gap-2">
                            {paper.authors === 'Uploaded by you' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Upload className="w-3 h-3 mr-1" />
                                Uploaded
                              </span>
                            )}
                            <a
                              href={paper.pdf_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {truncateText(paper.title, 50)}
                            </a>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 italic">
                          {truncateText(paper.summary, 70)}
                          {paper.summary && paper.summary.length > 70 && (
                            <span className="text-accent-500 font-medium"> (click for more)</span>
                          )}
                        </div>
                      </td>                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                          {truncateText(paper.authors, 40)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700 bg-secondary-50 px-2 py-1 rounded-full inline-block font-medium group-hover:bg-secondary-100 transition-colors duration-200">
                          {paper.published ? formatDate(paper.published) : 'Unknown'}
                        </p>
                      </td>                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700 bg-primary-50 px-2 py-1 rounded-full inline-block font-medium group-hover:bg-primary-100 transition-colors duration-200">
                          {formatDateWithTime(paper.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex justify-center space-x-4">                          <button
                            className="flex items-center justify-center px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-soft"
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              // Handle different types of PDF links
                              if (paper.pdf_link === '#') {
                                alert('PDF file is not available. This file was uploaded but file storage is not configured. Please follow the setup instructions in STORAGE_SETUP.md to enable file access.');
                              } else if (paper.pdf_link.includes('supabase') && paper.pdf_link.includes('storage')) {
                                // For Supabase storage files, show helpful message if it fails
                                try {
                                  window.open(paper.pdf_link, '_blank');
                                } catch (error) {
                                  alert('Cannot open uploaded PDF. Storage bucket may not be configured as public. Check STORAGE_SETUP.md for instructions.');
                                }
                              } else {
                                // For ArXiv and other external links
                                window.open(paper.pdf_link, '_blank');
                              }
                            }}
                            title="View PDF"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            <span className="text-xs">View PDF</span>
                          </button>
                          <button
                            className="flex items-center justify-center px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:shadow-soft"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(paper.bibtex);
                              alert('BibTeX copied to clipboard!');
                            }}
                            title="Copy BibTeX"
                          >
                            <Clipboard className="w-4 h-4 mr-1" />
                            <span className="text-xs">BibTeX</span>
                          </button>
                          <button
                            className="flex items-center justify-center px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:shadow-soft"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePaper(paper.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </td>                        <td className="px-4 py-4 text-sm">
                        <div className="flex justify-center">
                          <button
                            className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                              expandedRows[paper.id]
                                ? 'bg-accent-50 text-accent-600 hover:bg-accent-100'
                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            } hover:shadow-soft gap-1.5`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSummary(paper.id);
                            }}
                          >
                            {expandedRows[paper.id] ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-xs font-medium">Hide Summary</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="text-xs font-medium">View Summary</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>                    {expandedRows[paper.id] && (
                      <tr className="bg-gradient-to-r from-accent-50/30 to-secondary-50/30 animate-fade-in">
                        <td colSpan={6} className="px-6 py-5 border-t border-b border-white/50">
                          <div className="text-sm text-gray-700">
                            <div className="flex items-center mb-3">
                              <div className="w-1 h-6 bg-gradient-to-b from-accent-400 to-accent-600 rounded-full mr-2"></div>
                              <p className="font-medium text-gray-800">Paper Summary</p>
                            </div>
                            <p 
                              className="text-gray-600 leading-relaxed bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-soft border border-white/70"
                              dangerouslySetInnerHTML={{ __html: formatText(paper.summary) }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}        {(isLoading && deletingId) || isDeletingAll ? (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-40">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-card border border-white/50 flex items-center animate-pulse-slow">
              <Loader2 className="h-6 w-6 text-accent-500 animate-spin mr-3" />
              <span className="font-medium text-gray-700">{isDeletingAll ? 'Deleting all papers...' : 'Deleting...'}</span>
            </div>
          </div>
        ) : null}{!isLoading && !error && papers.length === 0 && (
          <div className="text-center py-12">
            <div className="relative p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-secondary-100/20 rounded-2xl -z-10"></div>
              <HistoryIcon className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
              <p className="text-gray-500 text-lg">No search history found.</p>
              <Link to="/dashboard" className="mt-4 inline-block px-5 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:shadow-purple-glow transition-all duration-300">
                Search for papers
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default History;
