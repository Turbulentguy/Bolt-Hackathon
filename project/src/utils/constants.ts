// Application constants and configuration

export const APP_CONFIG = {
  name: 'AI Paper Assistant',
  description: 'Discover, analyze, and chat with research papers using AI',
  version: '1.0.0',
  author: 'Your Team'
};

export const API_ENDPOINTS = {
  // Backend API endpoints
  SUMMARIZE: '/summarize',
  UPLOAD_PDF: '/upload-pdf',
  ALL_PAPERS: '/papers/all',
  CATEGORIES_PAPERS: '/papers/categories',
  RECENT_PAPERS: '/papers/recent',
  
  // RAG Chat endpoints
  CREATE_RAG_SESSION: '/api/create_rag_session',
  CREATE_RAG_SESSION_FROM_URL: '/api/create_rag_session_from_url',
  CHAT_WITH_RAG: '/api/chat_with_rag',
  RAG_PROGRESS: '/api/rag_progress'
};

export const ARXIV_CATEGORIES = [
  { value: 'cs.AI', label: 'Artificial Intelligence', description: 'AI and machine learning research' },
  { value: 'cs.CV', label: 'Computer Vision', description: 'Image processing and computer vision' },
  { value: 'cs.LG', label: 'Machine Learning', description: 'Learning algorithms and theory' },
  { value: 'cs.CL', label: 'Computation and Language', description: 'Natural language processing' },
  { value: 'cs.RO', label: 'Robotics', description: 'Robotics and autonomous systems' },
  { value: 'cs.CR', label: 'Cryptography and Security', description: 'Security and cryptography' },
  { value: 'cs.DB', label: 'Databases', description: 'Database systems and theory' },
  { value: 'cs.DC', label: 'Distributed Computing', description: 'Parallel and distributed systems' },
  { value: 'cs.DS', label: 'Data Structures and Algorithms', description: 'Algorithms and data structures' },
  { value: 'cs.HC', label: 'Human-Computer Interaction', description: 'HCI and user interfaces' },
  { value: 'cs.IR', label: 'Information Retrieval', description: 'Search and information systems' },
  { value: 'cs.IT', label: 'Information Theory', description: 'Information theory and coding' },
  { value: 'cs.NE', label: 'Neural and Evolutionary Computing', description: 'Neural networks and evolutionary algorithms' },
  { value: 'cs.SE', label: 'Software Engineering', description: 'Software development and engineering' },
  { value: 'stat.ML', label: 'Machine Learning (Statistics)', description: 'Statistical machine learning' },
  { value: 'math.ST', label: 'Statistics Theory', description: 'Statistical theory and methods' },
  { value: 'physics.data-an', label: 'Data Analysis (Physics)', description: 'Physics data analysis methods' }
];

export const UI_CONSTANTS = {
  MAX_SEARCH_RESULTS: 20,
  MAX_FEATURED_PAPERS: 6,
  MAX_TITLE_LENGTH: 80,
  MAX_ABSTRACT_LENGTH: 150,
  MAX_AUTHORS_DISPLAY: 3,
  
  // Animation durations
  TRANSITION_DURATION: 200,
  HOVER_DELAY: 100,
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.pdf'],
  
  // Chat settings
  MAX_MESSAGE_LENGTH: 1000,
  CHAT_HISTORY_LIMIT: 50
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  FILE_TOO_LARGE: `File size exceeds ${UI_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
  INVALID_FILE_TYPE: 'Only PDF files are supported.',
  SEARCH_FAILED: 'Failed to search papers. Please try again.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  CHAT_FAILED: 'Failed to send message. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

export const SUCCESS_MESSAGES = {
  SEARCH_COMPLETE: 'Paper found and summarized successfully!',
  UPLOAD_COMPLETE: 'PDF uploaded and analyzed successfully!',
  CHAT_SESSION_CREATED: 'Chat session created successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  PAPER_SAVED: 'Paper saved to your history!'
};

// Theme colors for consistent styling
export const THEME_COLORS = {
  primary: {
    50: '#fff9ec',
    500: '#ffb114',
    600: '#f68e09',
    700: '#ca6a0a'
  },
  secondary: {
    50: '#eefaff',
    500: '#32a6ea',
    600: '#1f85ca',
    700: '#1c6aa4'
  },
  accent: {
    50: '#f5f3ff',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9'
  }
};