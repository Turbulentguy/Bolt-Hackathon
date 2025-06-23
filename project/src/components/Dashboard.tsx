import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  LogOut, Search, FileText, Download,
  AlertCircle, CheckCircle, Loader2,
  ExternalLink, Calendar, Users,
  Upload, File, X, Check, Eye
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
  const [allPapers, setAllPapers] = useState<PaperResult[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load all papers on component mount
  useEffect(() => {
    // In a real app, this would fetch from an API endpoint that returns all papers in the system
    // For now we're using sample data
    const allPapers: PaperResult[] = [
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
      {
        title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
        abstract: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
        pdfUrl: "https://arxiv.org/pdf/1810.04805.pdf",
        arxivUrl: "https://arxiv.org/abs/1810.04805",
        publishedDate: "2018-10-11",
        fullText: "",
        summary: "BERT is a pre-trained language representation model that uses bidirectional transformers to understand context from both directions, achieving state-of-the-art results on a wide range of NLP tasks with minimal task-specific architecture modifications."
      },
      {
        title: "Generative Adversarial Networks",
        authors: ["Ian J. Goodfellow", "Jean Pouget-Abadie", "Mehdi Mirza", "Bing Xu", "David Warde-Farley", "Sherjil Ozair", "Aaron Courville", "Yoshua Bengio"],
        abstract: "We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.",
        pdfUrl: "https://arxiv.org/pdf/1406.2661.pdf",
        arxivUrl: "https://arxiv.org/abs/1406.2661",
        publishedDate: "2014-06-10",
        fullText: "",
        summary: "This paper introduces Generative Adversarial Networks (GANs), a framework where two neural networks contest with each other, allowing for generation of new data instances that resemble the training data through an adversarial training process."
      },
      {
        title: "GPT-3: Language Models are Few-Shot Learners",
        authors: ["Tom B. Brown", "Benjamin Mann", "Nick Ryder", "Melanie Subbiah", "Jared Kaplan", "Prafulla Dhariwal", "Arvind Neelakantan", "Pranav Shyam", "Girish Sastry", "Amanda Askell"],
        abstract: "Recent work has demonstrated substantial gains on many NLP tasks and benchmarks by pre-training on a large corpus of text followed by fine-tuning on a specific task. While typically task-agnostic in architecture, this method still requires task-specific fine-tuning datasets. By contrast, humans can generally perform a new language task from only a few examples or from simple instructions...",
        pdfUrl: "https://arxiv.org/pdf/2005.14165.pdf",
        arxivUrl: "https://arxiv.org/abs/2005.14165",
        publishedDate: "2020-05-29",
        fullText: "",
        summary: "GPT-3 demonstrates that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes matching or exceeding state-of-the-art systems without any fine-tuning."
      },
      {
        title: "Deep Residual Learning for Image Recognition",
        authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
        abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions...",
        pdfUrl: "https://arxiv.org/pdf/1512.03385.pdf",
        arxivUrl: "https://arxiv.org/abs/1512.03385",
        publishedDate: "2015-12-10",
        fullText: "",
        summary: "ResNet introduces skip connections to solve the degradation problem in very deep networks, enabling training of networks with hundreds of layers that achieve state-of-the-art performance on image recognition tasks."
      },
      {
        title: "Large Language Models Can Self-Improve",
        authors: ["Jiaxin Huang", "Shixiang Shane Gu", "Le Hou", "Yuexin Wu", "Xuezhi Wang", "Hongkun Yu", "Jiawei Han"],
        abstract: "We explore whether large language models (LLMs) can self-improve. We focus on code generation and present Self-Taught Coder (STC), a method that leverages LLMs to generate more training data and use it to improve itself. STC iteratively generates synthetic training examples, filters them based on the correctness of code execution...",
        pdfUrl: "https://arxiv.org/pdf/2210.11610.pdf",
        arxivUrl: "https://arxiv.org/abs/2210.11610",
        publishedDate: "2022-10-20", 
        fullText: "",
        summary: "This paper demonstrates that large language models can improve their own performance by generating synthetic training data, evaluating it, and using the high-quality examples to further train themselves."
      }
    ];
    
    setAllPapers(allPapers);
  }, []);

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
  }, []);

  const handleUpload = useCallback(() => {
    // In a real implementation, you would send these files to your backend
    console.log('Files to upload:', uploadedFiles);
    
    // Simulating upload success for now
    setTimeout(() => {
      setUploadSuccess(`Successfully uploaded ${uploadedFiles.length} file(s)`);
      // Clear the files list after successful upload
      setUploadedFiles([]);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess(null);
      }, 5000);
    }, 1500);
  }, [uploadedFiles]);

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
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
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
                </div>
                <button
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
        </div>        {results.length > 0 && (
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
        )}        {/* File Upload Section - New Addition */}
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
          
          <div className="space-y-6">
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
                      accept=".pdf,.txt,.doc,.docx" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Accepted formats: PDF</p>
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
                <div className="flex justify-end">
                  <button
                    onClick={handleUpload}
                    className="px-6 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-xl hover:shadow-purple-glow focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </button>
                </div>
              </div>
            )}            {/* PDF Preview Modal - Reduced Height */}
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

        {/* All Papers Section - Always visible */}
        <div className="relative bg-gradient-to-br from-secondary-50/90 to-accent-50/80 rounded-3xl shadow-card p-8 mb-8 border border-white/40 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl mr-3">
                <FileText className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-800">Research Papers</h3>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Found {allPapers.length} papers</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {allPapers.map((paper, index) => (
              <div 
                key={index} 
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-5 border border-gray-100 hover:border-accent-200 relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Paper content */}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-secondary-700 group-hover:text-accent-700 transition-colors duration-300 mb-2 pr-4">
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
                      onClick={() => processQuery(paper.title)}
                      className="w-full py-2 px-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-medium rounded-xl hover:shadow-purple-glow transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Get Summary</span>
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
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-400 via-accent-500 to-secondary-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
