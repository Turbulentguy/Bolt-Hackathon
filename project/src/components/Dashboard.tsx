import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  LogOut, Search, FileText, Download,
  AlertCircle, CheckCircle, Loader2,
  ExternalLink, Calendar, Users
} from 'lucide-react';
import DiscordCanary from '../assets/Discord_Canary.png';

interface PaperResult {
  title: string;
  authors: string[];
  abstract: string;
  pdfUrl: string;
  arxivUrl: string;
  publishedDate: string;
  fullText: string;
  summary: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PaperResult[]>([]);

  const processQuery = async (searchQuery: string): Promise<void> => {
    setIsProcessing(true);
    setError('');
    setResults([]);

    try {
      const url = ` https://equally-lowest-wearing-muscles.trycloudflare.com/summarize?query=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to fetch paper');
      }

      const data = await response.json();

      const paper: PaperResult = {
        title: data.title || 'No title',
        authors: data.authors?.split(',').map((a: string) => a.trim()) || [],
        abstract: data.summary || 'No abstract',
        pdfUrl: data.pdf_link || '',
        arxivUrl: data.pdf_link.replace('/pdf/', '/abs/'),
        publishedDate: data.published || '',
        fullText: data.summary || '',
        summary: data.summary || ''
      };

      setResults([paper]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    processQuery(query.trim());
  };

  const handleSave = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="min-h-screen">
      <header className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-md border-2 border-white">
                <img src={DiscordCanary} alt="Discord Canary Logo" className="w-8 h-8 drop-shadow-lg" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-wide ml-2" style={{letterSpacing: '0.04em'}}>BOTCHANA</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.email}!</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Discover & Summarize Research Papers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search ArXiv for academic papers and get AI-powered summaries. Enter keywords, topics, or author names.
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>              <div className="flex space-x-4">
                <Link to="/history">
                  <button
                    type="button"
                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>History</span>
                  </button>
                </Link>
                <div className="flex-1 relative">
                  <input
                    id="query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="e.g., medical image segmentation"
                    disabled={isProcessing}
                  />
                </div>
                <button
                type="submit"
                disabled={isProcessing || !query.trim()}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {results.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-xl p-3">
              <CheckCircle className="w-5 h-5" />
              <span>Paper processed successfully! Summary available below.</span>
            </div>

            {results.map((paper, index) => (
              <div key={index} className="space-y-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white">Paper Information</h3>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{paper.title}</h4>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          <strong>Authors:</strong> {paper.authors.join(', ') || 'Not available'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          <strong>Published:</strong> {formatDate(paper.publishedDate)}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-800 mb-2">Abstract:</h5>
                      <p className="text-gray-600 leading-relaxed">{paper.abstract}</p>
                    </div>
                    <div className="flex space-x-4">
                      <a
                        href={paper.arxivUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on ArXiv</span>
                      </a>
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors duration-200"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">AI Summary</h3>
                      <button
                        onClick={() => handleSave(paper.summary, `${paper.title.replace(/[^a-zA-Z0-9]/g, '_')}_summary`)}
                        className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{paper.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
