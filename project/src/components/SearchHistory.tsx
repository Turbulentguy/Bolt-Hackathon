import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import {
  History, Search, Calendar, Users, FileText,
  ExternalLink, Trash2, Eye, AlertCircle, Loader2
} from 'lucide-react';

interface HistoryEntry {
  id: string;
  query: string;
  paper_title: string;
  paper_authors: string;
  paper_summary: string;
  paper_pdf_url: string;
  paper_arxiv_url: string;
  paper_published_date: string;
  created_at: string;
}

interface SearchHistoryProps {
  onBack: () => void;
}

export default function SearchHistory({ onBack }: SearchHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch search history');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!user) return;

    try {
      setIsDeleting(entryId);
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(entry => entry.id !== entryId));
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatPublishedDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (selectedEntry) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← Back to History
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Searched on {formatDate(selectedEntry.created_at)}
            </div>
          </div>
        </div>

        {/* Search Query */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Query</span>
            </h3>
          </div>
          <div className="p-6">
            <p className="text-lg font-medium text-gray-800">"{selectedEntry.query}"</p>
          </div>
        </div>

        {/* Paper Info */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Paper Information</h3>
          </div>
          <div className="p-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4">{selectedEntry.paper_title}</h4>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Authors:</strong> {selectedEntry.paper_authors || 'Not available'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Published:</strong> {formatPublishedDate(selectedEntry.paper_published_date)}
                </span>
              </div>
            </div>

            <div className="flex space-x-4">
              {selectedEntry.paper_arxiv_url && (
                <a
                  href={selectedEntry.paper_arxiv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on ArXiv</span>
                </a>
              )}
              {selectedEntry.paper_pdf_url && (
                <a
                  href={selectedEntry.paper_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">AI Summary</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedEntry.paper_summary}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-gray-600" />
            <h1 className="text-xl font-bold text-gray-800">Search History</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
            <span className="text-gray-600">Loading your search history...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-white/20">
          <div className="text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Search History</h3>
            <p className="text-gray-500">You have no search history yet. Start by searching for research papers!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Search Query:</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">"{entry.query}"</h3>
                    <p className="text-gray-600 font-medium mb-2">{entry.paper_title}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Searched on {formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Summary</span>
                  </button>
                  
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    disabled={isDeleting === entry.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting === entry.id ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}