import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  FileText, 
  History as HistoryIcon, 
  LogOut, 
  Loader2, 
  AlertCircle,
  BookOpen,
  Brain,
  Sparkles,
  Download,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { ArxivApiService } from '../utils/api-service';
import { supabase } from '../supabase';
import PaperRAGChat from '../../PaperRAGChat';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  pdf_link: string;
  arxiv_url: string;
  categories: string[];
  summary?: string;
}

interface SearchResult {
  title: string;
  authors: string;
  published: string;
  pdf_link: string;
  bibtex: string;
  summary: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [featuredPapers, setFeaturedPapers] = useState<Paper[]>([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('cs.AI');
  const [showRAGChat, setShowRAGChat] = useState(false);
  const [ragPapers, setRagPapers] = useState<any[]>([]);

  const categories = [
    { value: 'cs.AI', label: 'Artificial Intelligence' },
    { value: 'cs.CV', label: 'Computer Vision' },
    { value: 'cs.LG', label: 'Machine Learning' },
    { value: 'cs.CL', label: 'Natural Language Processing' },
    { value: 'cs.RO', label: 'Robotics' },
    { value: 'stat.ML', label: 'Machine Learning (Stats)' },
  ];

  useEffect(() => {
    loadFeaturedPapers();
  }, [selectedCategory]);

  const loadFeaturedPapers = async () => {
    setIsLoadingPapers(true);
    try {
      const response = await ArxivApiService.getAllPapers({
        category: selectedCategory,
        maxResults: 6,
        start: 0
      });
      
      if (response.papers) {
        setFeaturedPapers(response.papers);
      }
    } catch (error: any) {
      console.error('Error loading featured papers:', error);
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const result = await ArxivApiService.summarizePaper(searchQuery);
      setSearchResult(result);
      
      // Save to Supabase
      try {
        await supabase.table('papers').insert({
          title: result.title,
          authors: result.authors,
          published: result.published,
          pdf_link: result.pdf_link,
          bibtex: result.bibtex,
          summary: result.summary
        });
      } catch (dbError) {
        console.warn('Failed to save to database:', dbError);
      }
    } catch (error: any) {
      setSearchError(error.message || 'Failed to search and summarize paper');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await ArxivApiService.uploadPdf(uploadedFile);
      setUploadResult(result);
      
      // Save to Supabase
      try {
        await supabase.table('papers').insert({
          title: result.title,
          authors: 'Uploaded by you',
          published: new Date().toISOString(),
          pdf_link: '#',
          bibtex: '',
          summary: result.summary
        });
      } catch (dbError) {
        console.warn('Failed to save to database:', dbError);
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload and process PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChatWithPaper = (paper: Paper) => {
    const ragPaper = {
      id: paper.id,
      title: paper.title,
      authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
      summary: paper.abstract,
      pdfUrl: paper.pdf_link,
      arxivUrl: paper.arxiv_url,
      year: new Date(paper.published).getFullYear().toString(),
      category: paper.categories[0] || 'Unknown'
    };
    
    setRagPapers([ragPaper]);
    setShowRAGChat(true);
  };

  const formatAuthors = (authors: string[] | string) => {
    if (Array.isArray(authors)) {
      return authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '');
    }
    return authors;
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (showRAGChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => setShowRAGChat(false)}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-card transition-all duration-200"
          >
            ← Back to Dashboard
          </button>
          <PaperRAGChat papers={ragPapers} paperTitle={ragPapers[0]?.title} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-glass sticky top-0 z-10 border-b border-white/30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-700 to-accent-700 bg-clip-text text-transparent">
                  AI Paper Assistant
                </h1>
                <p className="text-sm text-gray-600">Discover, analyze, and chat with research papers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/history"
                className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-card transition-all duration-200"
              >
                <HistoryIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">History</span>
              </Link>
              <div className="flex items-center space-x-2 text-gray-600">
                <span className="font-medium">{user?.email}</span>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4">
              Unlock the Power of
              <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-600 bg-clip-text text-transparent block">
                Research Papers
              </span>
            </h2>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-accent-400 animate-pulse" />
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Search, summarize, and chat with academic papers using advanced AI technology
          </p>
        </div>

        {/* Search and Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Search Papers */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Search Papers</h3>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter keywords, topics, or paper titles..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={isSearching}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search & Summarize
                  </>
                )}
              </button>
            </form>

            {searchError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">Search Failed</p>
                  <p className="text-red-600 text-sm mt-1">{searchError}</p>
                </div>
              </div>
            )}

            {searchResult && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-800 mb-2">{searchResult.title}</h4>
                <p className="text-gray-600 text-sm mb-2">By: {searchResult.authors}</p>
                <p className="text-gray-600 text-sm mb-4">Published: {searchResult.published}</p>
                <div className="bg-white/80 rounded-lg p-4 mb-4">
                  <h5 className="font-semibold text-gray-800 mb-2">AI Summary:</h5>
                  <p className="text-gray-700 text-sm leading-relaxed">{searchResult.summary}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={searchResult.pdf_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View PDF
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Upload PDF */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Upload PDF</h3>
            </div>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  disabled={isUploading}
                />
              </div>
              <button
                type="submit"
                disabled={isUploading || !uploadedFile}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </button>
            </form>

            {uploadError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">Upload Failed</p>
                  <p className="text-red-600 text-sm mt-1">{uploadError}</p>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-800 mb-2">{uploadResult.title}</h4>
                <div className="bg-white/80 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">AI Summary:</h5>
                  <p className="text-gray-700 text-sm leading-relaxed">{uploadResult.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Papers Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Featured Papers</h3>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {isLoadingPapers ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-accent-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading papers...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPapers.map((paper, index) => (
                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-soft hover:shadow-card transition-all duration-300 p-6 border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">
                    {truncateText(paper.title, 80)}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">
                    By: {formatAuthors(paper.authors)}
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    {new Date(paper.published).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {truncateText(paper.abstract, 150)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChatWithPaper(paper)}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all duration-200 text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </button>
                    <a
                      href={paper.pdf_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}