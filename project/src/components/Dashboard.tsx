import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { setupStorageBucket } from '../utils/setup-storage';
import ArxivApiService from '../utils/api-service';
import {
  LogOut, Search, FileText, Download,
  AlertCircle, CheckCircle, Loader2,
  ExternalLink, Calendar, Users,
  Upload, File, X, Check, Eye, History as HistoryIcon,
  RefreshCw, BookOpen
} from 'lucide-react';
import DiscordCanary from '../assets/Discord_Canary.png';
import PaperRAGChatModal from "./PaperRAGChatModal";

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

interface FileUploadResponse {
  filename: string;
  title: string;
  summary: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');  const [results, setResults] = useState<PaperResult[]>([]);
  const [allPapers, setAllPapers] = useState<PaperResult[]>([]);
  const [processedPapers, setProcessedPapers] = useState<Map<string, PaperResult>>(new Map()); // Cache for processed papers
  const [uploadedResults, setUploadedResults] = useState<PaperResult[]>([]); // สำหรับเก็บผลลัพธ์จากการอัปโหลด
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [isLoadingAllPapers, setIsLoadingAllPapers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('cs.AI');
  const [currentPage, setCurrentPage] = useState(0);
  const [maxResults, setMaxResults] = useState(20);
  const [chatPaper, setChatPaper] = useState<PaperResult|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Load all papers from API
  const loadAllPapersFromAPI = async () => {
    setIsLoadingAllPapers(true);
    setError('');
    
    try {
      console.log('Loading papers with params:', { category: selectedCategory, maxResults, start: currentPage * maxResults });
      
      const response = await ArxivApiService.getAllPapers({
        category: selectedCategory,
        maxResults: maxResults,
        start: currentPage * maxResults
      });
      
      console.log('API Response:', response);
      
      if (response.papers && Array.isArray(response.papers)) {
        // Convert API response to PaperResult format
        const formattedPapers: PaperResult[] = response.papers.map((paper: any) => ({
          title: paper.title || 'No title',
          authors: Array.isArray(paper.authors) ? paper.authors : [paper.authors || 'Unknown'],
          abstract: paper.abstract || 'No abstract available',
          pdfUrl: paper.pdf_link || '',
          arxivUrl: paper.arxiv_url || '#',
          publishedDate: paper.published || '',
          fullText: paper.abstract || 'No content available',
          summary: paper.abstract || 'No summary available'
        }));
        
        console.log('Formatted papers:', formattedPapers.length);
        setAllPapers(formattedPapers);
      } else {
        console.warn('No papers found in response:', response);
        setError('No papers found for the selected category');
        // Fallback to sample data
        loadSampleData();
      }
    } catch (err: any) {
      console.error('Error loading papers from API:', err);
      setError(`Failed to load papers: ${err.message}`);
      // Fallback to sample data if API fails
      loadSampleData();
    } finally {
      setIsLoadingAllPapers(false);
    }
  };

  // Load sample data as fallback
  const loadSampleData = () => {
    const samplePapers: PaperResult[] = [
      {
        title: "Attention Is All You Need",
        authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Lukasz Kaiser", "Illia Polosukhin"],
        abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
        arxivUrl: "https://arxiv.org/abs/1706.03762",
        publishedDate: "2017-06-12",
        fullText: "",
        summary: "This paper introduces the Transformer architecture that relies entirely on self-attention mechanisms without using recurrence or convolution, achieving state-of-the-art results on machine translation tasks while being more parallelizable and requiring less training time."
      },
      // Add more sample papers here...
    ];
    setAllPapers(samplePapers);
  };
  // Setup storage bucket on component mount
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await setupStorageBucket();
      } catch (error) {
        console.error('Failed to initialize storage bucket:', error);
      }
    };
    
    initializeStorage();
  }, []);

  // Load papers on component mount
  useEffect(() => {
    loadAllPapersFromAPI();
  }, [selectedCategory, currentPage, maxResults]);  const processQuery = async (searchQuery: string, existingPdfUrl?: string): Promise<void> => {
    setIsProcessing(true);
    setError('');
    setResults([]);

    try {
      let data;
      const cacheKey = existingPdfUrl || searchQuery;
      
      // Check if we already have this paper processed
      if (processedPapers.has(cacheKey)) {
        console.log('Using cached result for:', cacheKey);
        const cachedPaper = processedPapers.get(cacheKey)!;
        setResults([cachedPaper]);
        setIsProcessing(false);
        return;
      }
      
      console.log('Processing query:', searchQuery, 'with PDF URL:', existingPdfUrl);
      
      // If we have an existing PDF URL, use it for summarization directly
      if (existingPdfUrl && existingPdfUrl !== '' && existingPdfUrl !== '#') {
        console.log('Using PDF URL for direct summarization:', existingPdfUrl);
        // Use the PDF URL directly for summarization
        data = await ArxivApiService.summarizePaper(existingPdfUrl);
      } else {
        // Search and get paper data first (fallback for manual search)
        console.log('Searching for paper:', searchQuery);
        data = await ArxivApiService.summarizePaper(searchQuery);
      }

      console.log('API Response:', data);

      const paper: PaperResult = {
        title: data.title || searchQuery || 'No title',
        authors: data.authors ? (typeof data.authors === 'string' ? data.authors.split(',').map((a: string) => a.trim()) : data.authors) : ['Unknown authors'],
        abstract: data.abstract || data.summary || 'No abstract available',
        pdfUrl: data.pdf_link || existingPdfUrl || '',
        arxivUrl: data.arxiv_url || (data.pdf_link ? data.pdf_link.replace('/pdf/', '/abs/') : '#'),
        publishedDate: data.published || new Date().toISOString(),
        fullText: data.summary || data.abstract || 'No content available',
        summary: data.summary || 'No summary available'
      };

      console.log('Created paper object:', paper);

      // Cache the processed paper
      setProcessedPapers(prev => new Map(prev.set(cacheKey, paper)));
      setResults([paper]);

      // Save to Supabase for history with PDF link
      try {
        const { error } = await supabase
          .from('papers')
          .insert([{
            title: paper.title,
            authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
            published: paper.publishedDate,
            pdf_link: paper.pdfUrl,
            bibtex: '',
            summary: paper.summary,
            created_at: new Date().toISOString()
          }]);
          
        if (error) {
          console.error('Error saving search to history:', error);
        } else {
          console.log('Successfully saved paper with PDF link to history');
        }
      } catch (supabaseError) {
        console.error('Error saving search to Supabase:', supabaseError);
        // Don't throw the error, continue even if saving to history fails
      }
    } catch (err: any) {
      console.error('Error in processQuery:', err);
      setError(err.message || 'Something went wrong while processing the query');
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

  // Handle file drop and selection
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  }, []);

  const removeFile = useCallback((indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);  const handleUpload = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    
    // Set processing state to show loading
    setIsProcessing(true);
    setError('');
      try {
      // รีเซ็ตผลลัพธ์เก่า
      setUploadedResults([]);
      
      // Process each file one by one
      for (const file of uploadedFiles) {
        // Skip non-PDF files
        if (!file.name.endsWith('.pdf')) {
          console.warn(`Skipping non-PDF file: ${file.name}`);
          continue;
        }          // Try to upload file to Supabase Storage, fallback if bucket doesn't exist
        let publicUrl = '#'; // Default fallback
        
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `uploads/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('papers')
            .upload(filePath, file);

          if (uploadError) {
            console.warn('Storage upload failed, continuing without file storage:', uploadError.message);
            // Don't throw error, just use fallback
          } else {
            // Get public URL for the uploaded file
            const { data: urlData } = supabase.storage
              .from('papers')
              .getPublicUrl(filePath);

            publicUrl = urlData.publicUrl;
            console.log('File uploaded successfully to storage:', publicUrl);
          }
        } catch (storageError) {
          console.warn('Storage operation failed, continuing without file storage:', storageError);
          // Continue with processing even if storage fails
        }        // Create form data
        const formData = new FormData();
        formData.append('file', file);
          // Upload to backend
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${apiBaseUrl}/upload-pdf`, {
          method: 'POST',
          body: formData,
        });
          if (!response.ok) {
          const errorData = await response.text();
          console.error(`Upload error (${response.status}):`, errorData);
          throw new Error(`Failed to upload file ${file.name}: ${response.status} ${response.statusText}`);
        }
          // Process the response
        let data: FileUploadResponse;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error(`Failed to parse response for file ${file.name}. Server response was not valid JSON.`);
        }          // Add to uploaded results
        const paper: PaperResult = {
          title: data.title || file.name,
          authors: ['Uploaded by you'],
          abstract: data.summary || 'No summary available',
          pdfUrl: publicUrl, // Use the public URL from Supabase Storage
          arxivUrl: '#',
          publishedDate: new Date().toISOString(),
          fullText: data.summary || 'No content available',
          summary: data.summary || 'No summary available'
        };
          // Add to uploaded results at the end (new items at the bottom)
        setUploadedResults(prev => [...prev, paper]);
          // Save to Supabase for history
        try {
          const { error } = await supabase
            .from('papers')
            .insert([{
              title: data.title || file.name,
              authors: 'Uploaded by you',
              published: new Date().toISOString(),
              pdf_link: publicUrl, // Use the public URL from Supabase Storage or fallback
              bibtex: '',
              summary: data.summary || 'No summary available',
              created_at: new Date().toISOString()
            }]);
            
          if (error) {
            console.error('Error saving to history:', error);
          }
        } catch (supabaseError) {
          console.error('Error saving to Supabase:', supabaseError);
          // Don't throw the error here, we want to continue even if saving to history fails
        }

        const successMessage = publicUrl !== '#' 
          ? `Successfully processed file: ${file.name} and saved to history with file storage`
          : `Successfully processed file: ${file.name} and saved to history (file storage unavailable - check console for setup instructions)`;
          
        setUploadSuccess(successMessage);
      }
        // Clear the files list after successful upload
      setUploadedFiles([]);
      
      // Hide the upload section after successful upload
      setShowUploadSection(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess(null);
      }, 5000);    } catch (err: any) {
      console.error('Upload error:', err);
        // Provide more helpful error messages for common issues
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        setError(`Cannot connect to server. Please check if the backend server is running at ${apiBaseUrl}`);
      } else if (err.message?.includes('404')) {
        setError('Server endpoint not found. Please check if the backend server is running with the correct API endpoints.');
      } else {
        setError(err.message || 'Error uploading files');
      }
      
      setUploadSuccess(null);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFiles, setShowUploadSection]);

  // Function to get file size display
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  // Clean up object URLs when component unmounts or when files change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file preview
  const handlePreview = useCallback((file: File) => {
    if (file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(fileUrl);
    }
  }, []);

  // Close preview
  const closePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  return (
    <div className="min-h-screen">      <header className="bg-glass sticky top-0 z-10 border-b border-white/30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow border-2 border-white/80 animate-pulse-slow">
                <img src={DiscordCanary} alt="Discord Canary Logo" className="w-8 h-8 drop-shadow-lg animate-float" />
              </div>
              <h1 className="text-2xl font-display font-extrabold text-gray-800 tracking-wide ml-2 text-shadow" style={{letterSpacing: '0.04em'}}>
                BOTCHANA
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 font-medium">Welcome, {user?.email}!</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl shadow-card p-8 mb-8 border border-white/40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 opacity-70"></div>
          <div className="absolute -bottom-2 -right-2 w-40 h-40 bg-gradient-to-br from-primary-400/30 to-accent-500/30 rounded-full blur-2xl"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-tr from-secondary-400/30 to-primary-400/30 rounded-full blur-2xl"></div>
          
          <div className="text-center relative z-10">
            <h2 className="text-4xl font-display font-bold text-gray-800 mb-4 text-shadow-md bg-gradient-to-r from-primary-700 via-accent-700 to-secondary-700 inline-block text-transparent bg-clip-text">
              Discover & Summarize Research Papers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Search ArXiv for academic papers and get AI-powered summaries. Enter keywords, topics, or author names.
            </p>
          </div>
        </div>        <div className="bg-glass rounded-3xl shadow-card p-8 mb-8 border border-white/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-3 ml-1">
                Search Query
              </label>              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-blue-glow focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center group"
                  title={showUploadSection ? "Close Upload" : "Upload New Paper"}
                >
                  <svg className={`w-5 h-5 transition-transform duration-300 ${showUploadSection ? 'rotate-45' : 'group-hover:rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <Link to="/history" className="sm:order-last">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-glow focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start space-x-2"
                  >
                    <FileText className="w-5 h-5" />
                    <span>History</span>
                  </button>
                </Link>
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent shadow-sm transition-all duration-200 bg-white/80"
                    placeholder="e.g., medical image segmentation"
                    disabled={isProcessing}
                  />
                </div>                <button
                  type="submit"
                  disabled={isProcessing || !query.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-xl hover:shadow-purple-glow focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                  )}                </button>
              </div>
            </div>            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Debug information */}
            {import.meta.env.DEV && results.length === 0 && !error && !isProcessing && (
              <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">i</div>
                <span>Debug: No results to display. Try searching for a paper or check console for API responses.</span>
              </div>
            )}
          </form>
        </div>        {results.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-xl p-3">
              <CheckCircle className="w-5 h-5" />
              <span>Paper processed successfully! Summary available below and saved to your <Link to="/history" className="text-accent-600 hover:text-accent-700 underline">history</Link>.</span>
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
                          <strong>Authors:</strong> {paper.authors?.length > 0 ? paper.authors.join(', ') : 'Not available'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          <strong>Published:</strong> {paper.publishedDate ? formatDate(paper.publishedDate) : 'Not available'}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-800 mb-2">Abstract:</h5>
                      <p className="text-gray-600 leading-relaxed">{paper.abstract || 'No abstract available'}</p>
                    </div>
                    <div className="flex space-x-4">
                      {paper.arxivUrl && paper.arxivUrl !== '#' && (
                        <a
                          href={paper.arxivUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View on ArXiv</span>
                        </a>
                      )}
                      {paper.pdfUrl && paper.pdfUrl !== '' && (
                        <a
                          href={paper.pdfUrl}
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
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{paper.summary || 'No summary available'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Section - Show when button is clicked */}
        {showUploadSection && (
          <div className="relative bg-gradient-to-tr from-primary-50/90 to-accent-50/80 rounded-3xl shadow-card p-8 mb-8 border border-white/40 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mr-3">
                  <Upload className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-800">Upload Research Paper</h3>
              </div>
            </div>
            
            {uploadSuccess && (
              <div className="mb-6 flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-xl p-3 animate-fadeIn">
                <Check className="w-5 h-5" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6 animate-fadeIn">
              {/* Dropzone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging 
                    ? 'border-accent-400 bg-accent-50/50' 
                    : 'border-gray-300 hover:border-primary-300 bg-white/60'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className={`p-4 rounded-full ${isDragging ? 'bg-accent-100' : 'bg-gray-100'} transition-colors duration-200`}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-accent-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg text-gray-700">Drag and drop your PDF files here</h4>
                    <p className="text-gray-500 text-sm">or</p>
                    <label className="inline-block px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:shadow-glow cursor-pointer transition-all duration-200">
                      Browse Files
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".pdf" 
                        multiple 
                        className="hidden" 
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Accepted formats: PDF only</p>
                  </div>
                </div>
              </div>
              
              {/* File list with preview buttons */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Selected Files ({uploadedFiles.length})</h4>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <File className="w-5 h-5 text-primary-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.type === 'application/pdf' && (
                              <button 
                                onClick={() => handlePreview(file)}
                                className="p-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-500 rounded-full transition-colors duration-150"
                                title="Preview PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => removeFile(index)}
                              className="p-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors duration-150"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={() => {
                        setShowUploadSection(false);
                        // Clear any selected files when canceling
                        setUploadedFiles([]);
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium rounded-xl focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-300 flex items-center space-x-2"
                      disabled={isProcessing}
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel</span>
                    </button>
                    
                    <button
                      onClick={handleUpload}
                      disabled={isProcessing || uploadedFiles.length === 0}
                      className="px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-xl hover:shadow-purple-glow focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Upload and Process Files</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* PDF Preview Modal */}
              {previewUrl && previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-8">
                  <div className="bg-white rounded-2xl shadow-xl w-[700px] h-[500px] flex flex-col">
                    <div className="flex items-center justify-between border-b p-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-xl text-white truncate max-w-[350px]">
                          Preview: {previewFile.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <a 
                          href={previewUrl} 
                          download={previewFile.name}
                          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-accent-700 font-medium rounded-xl transition-colors duration-150"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </a>
                        <button 
                          onClick={closePreview}
                          className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-150 flex items-center gap-2"
                        >
                          <X className="w-5 h-5" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <iframe 
                        src={previewUrl} 
                        className="w-full h-full rounded-b-2xl" 
                        title={`Preview of ${previewFile.name}`}
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uploaded Papers Results Section */}
        {uploadedResults.length > 0 && (
          <div className="relative bg-gradient-to-tr from-purple-50/90 to-blue-50/80 rounded-3xl shadow-card p-8 mb-8 border border-white/40 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-primary-400"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl mr-3">
                  <FileText className="w-6 h-6 text-accent-600" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-800">Uploaded Paper Summaries</h3>
              </div>
                <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Found {uploadedResults.length} summaries</span>
                <Link to="/history" className="flex items-center space-x-2 text-accent-600 hover:text-accent-700 transition-all duration-200">
                  <HistoryIcon className="w-4 h-4" />
                  <span>View all in History</span>
                </Link>
              </div>
            </div>
              <div className="space-y-8">
              {[...uploadedResults].reverse().map((paper, index) => (
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
                            <strong>Source:</strong> Uploaded by you
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            <strong>Uploaded:</strong> {formatDate(paper.publishedDate)}
                          </span>
                        </div>
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
          </div>
        )}        {/* All Papers Section - Always visible */}
        <div className="relative bg-gradient-to-br from-secondary-50/90 to-accent-50/80 rounded-3xl shadow-card p-8 mb-8 border border-white/40 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl mr-3">
                <BookOpen className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-800">Research Papers</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAllPapersFromAPI}
                disabled={isLoadingAllPapers}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAllPapers ? 'animate-spin' : ''}`} />
                <span>{isLoadingAllPapers ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white/60 rounded-xl border border-gray-200">
            <div className="flex-1">
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="cs.AI">Computer Science - AI</option>
                <option value="cs.LG">Computer Science - Machine Learning</option>
                <option value="cs.CV">Computer Science - Computer Vision</option>
                <option value="cs.CL">Computer Science - Computation and Language</option>
                <option value="physics.gen-ph">Physics - General Physics</option>
                <option value="math.NA">Mathematics - Numerical Analysis</option>
                <option value="stat.ML">Statistics - Machine Learning</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="max-results" className="block text-sm font-medium text-gray-700 mb-2">
                Papers per page
              </label>
              <select
                id="max-results"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={10}>10 papers</option>
                <option value={20}>20 papers</option>
                <option value={50}>50 papers</option>
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                Found {allPapers.length} papers
              </span>
            </div>
          </div>

          {/* Pagination Controls */}
          {allPapers.length >= maxResults && (
            <div className="flex justify-between items-center mb-6 p-3 bg-white/60 rounded-lg">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || isLoadingAllPapers}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} (showing {currentPage * maxResults + 1}-{Math.min((currentPage + 1) * maxResults, allPapers.length)} of {allPapers.length})
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={allPapers.length < maxResults || isLoadingAllPapers}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingAllPapers && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span className="text-gray-600">Loading papers from arXiv...</span>
              </div>
            </div>
          )}
            <div className="space-y-4">            {allPapers.map((paper, index) => {
              // Use PDF URL as primary cache key, fallback to title
              const cacheKey = (paper.pdfUrl && paper.pdfUrl !== '' && paper.pdfUrl !== '#') ? paper.pdfUrl : paper.title;
              const isProcessed = processedPapers.has(cacheKey);
              
              return (
                <div 
                  key={index} 
                  className={`group bg-white/90 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-5 border relative overflow-hidden ${
                    isProcessed ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-accent-200'
                  }`}
                >
                  {isProcessed && (
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center space-x-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>Processed</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Paper content */}
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-secondary-700 group-hover:text-accent-700 transition-colors duration-300 mb-2 pr-16">
                        <a href={paper.arxivUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {paper.title}
                        </a>
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm text-gray-600">By:</span>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ', et al.' : ''}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full">
                          {formatDate(paper.publishedDate).split(' ').slice(-1)[0]} {/* Just show the year */}
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {paper.abstract}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 justify-end md:min-w-[140px]">
                      <button
                        onClick={() => setChatPaper(paper)}
                        className="w-full py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg"
                        style={{ marginBottom: 8 }}
                      >
                        💬 Chat
                      </button>
                      <button 
                        onClick={() => processQuery(paper.pdfUrl, paper.pdfUrl)}
                        disabled={isProcessing}
                        className={`w-full py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${
                          isProcessed 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:shadow-purple-glow'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : isProcessed ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>View Summary</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Summarize PDF</span>
                          </>
                        )}
                      </button>
                      <div className="flex gap-2 w-full">
                        <a 
                          href={paper.arxivUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs bg-secondary-100 text-secondary-700 hover:bg-secondary-200 rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>ArXiv</span>
                        </a>
                        <a 
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-xl transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover effect highlight */}
                  <div className={`absolute inset-x-0 bottom-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                    isProcessed 
                      ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' 
                      : 'bg-gradient-to-r from-primary-400 via-accent-500 to-secondary-400'
                  }`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Chat Modal - Show when a paper card's chat button is clicked */}
      {chatPaper && (
        <PaperRAGChatModal paper={chatPaper} onClose={() => setChatPaper(null)} />
      )}
    </div>
  );
}
