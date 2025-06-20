import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowLeft, FileText, ExternalLink, Clipboard, Loader2 } from 'lucide-react';

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

  // Toggle summary expansion
  const toggleSummary = (paperId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
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
    
    fetchPapers();
  }, [user]);

  // Function to format date in a readable way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">Logged in as: {user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="text-center">            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-orange-500" />
              Search History
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View your past searches and revisit research papers you've discovered.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading your papers...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
            <p>Error: {error}</p>
            <button 
              className="text-red-700 underline mt-2" 
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">              <thead className="bg-gray-100">                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Authors</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Published</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Added</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {papers.map((paper) => (
                  <React.Fragment key={paper.id}>                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleSummary(paper.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          <a 
                            href={paper.pdf_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateText(paper.title, 60)}
                          </a>
                        </div>                        <div className="mt-1 text-xs text-gray-500 italic">
                          {truncateText(paper.summary, 70)} 
                          {paper.summary && paper.summary.length > 70 && (
                            <span className="text-blue-500"> (click for more)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {truncateText(paper.authors, 40)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {paper.published ? formatDate(paper.published) : 'Unknown'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(paper.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-900"
                            onClick={() => window.open(paper.pdf_link, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View PDF</span>
                          </button>
                          <button
                            className="flex items-center gap-1 text-green-600 hover:text-green-900"
                            onClick={() => {
                              navigator.clipboard.writeText(paper.bibtex);
                              alert('BibTeX copied to clipboard!');
                            }}
                          >                            <Clipboard className="w-4 h-4" />
                            <span>Copy BibTeX</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <button
                          className={`flex items-center gap-1 ml-auto ${expandedRows[paper.id] ? 'text-orange-600 hover:text-orange-800' : 'text-purple-600 hover:text-purple-800'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSummary(paper.id);
                          }}
                        >
                          <span>{expandedRows[paper.id] ? 'Hide Summary' : 'View Summary'}</span>
                        </button>
                      </td>
                    </tr>{expandedRows[paper.id] && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4 border-t border-b border-gray-200">
                          <div className="text-sm text-gray-700">
                            <p className="font-medium text-gray-800 mb-2">Summary:</p>
                            <p className="text-gray-600 leading-relaxed bg-white p-4 rounded-md shadow-sm border border-gray-100">
                              {paper.summary}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && papers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No search history found.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default History;
