// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    // Existing endpoints
    summarize: '/summarize',
    uploadPdf: '/upload-pdf',
    
    // New endpoints for fetching all papers
    allPapers: '/papers/all',
    categoriesPapers: '/papers/categories',
    recentPapers: '/papers/recent'
  }
};

// API Service Functions
export class ArxivApiService {
  private static baseUrl = apiConfig.baseUrl;  // Fetch all papers
  static async getAllPapers(params: {
    category: string;
    maxResults?: number;
    start?: number;
  }) {
    const { category, maxResults = 20, start = 0 } = params;
    const url = new URL(`${this.baseUrl}${apiConfig.endpoints.allPapers}`);
    
    url.searchParams.append('category', category);
    url.searchParams.append('max_results', maxResults.toString());
    url.searchParams.append('start', start.toString());

    console.log('Fetching papers from:', url.toString());

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || `HTTP error! status: ${response.status}` };
        }
        
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Success Response:', data);
      
      return data;
    } catch (error: any) {
      console.error('Fetch error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      
      throw error;
    }
  }// Fetch papers by categories
  static async getPapersByCategories(categories: string[], maxPerCategory = 10) {
    const url = new URL(`${this.baseUrl}${apiConfig.endpoints.categoriesPapers}`);
    
    url.searchParams.append('categories', categories.join(','));
    url.searchParams.append('max_per_category', maxPerCategory.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  // Fetch recent papers
  static async getRecentPapers(days = 7) {
    const url = new URL(`${this.baseUrl}${apiConfig.endpoints.recentPapers}`);
    
    url.searchParams.append('days', days.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
  // Existing summarize function
  static async summarizePaper(query: string) {
    const url = new URL(`${this.baseUrl}${apiConfig.endpoints.summarize}`);
    url.searchParams.append('query', query);

    console.log('Summarizing paper with query:', query);
    console.log('API URL:', url.toString());

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Summarize API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || `HTTP error! status: ${response.status}` };
        }
        
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Summarize API Success Response:', data);
      
      return data;
    } catch (error: any) {
      console.error('Summarize fetch error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      
      throw error;
    }
  }

  // Existing upload PDF function
  static async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}${apiConfig.endpoints.uploadPdf}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}

export default ArxivApiService;
