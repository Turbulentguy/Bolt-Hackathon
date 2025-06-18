import fetch from 'node-fetch';
import feedparser from 'feedparser';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const headers = {
  "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://yourdomain.com)"
};

async function fetchWithRetry(url, options = {}, retries = 3, delay = 2000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.log(`Error: ${error.message}, Retrying ${attempt + 1} / ${retries}`);
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function searchArxiv(query, maxResults = 1) {
  const baseUrl = 'https://export.arxiv.org/api/query?';
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: 0,
    max_results: maxResults
  });

  const url = baseUrl + params.toString();
  console.log(`Searching ArXiv with URL: ${url}`);
  
  const response = await fetchWithRetry(url);
  const data = await response.text();

  return new Promise((resolve, reject) => {
    const results = [];
    const feedParser = new feedparser();
    
    feedParser.on('error', reject);
    feedParser.on('readable', function() {
      let item;
      while (item = this.read()) {
        results.push(item);
      }
    });
    
    feedParser.on('end', () => resolve(results));
    
    const stream = new Readable();
    stream.push(data);
    stream.push(null);
    stream.pipe(feedParser);
  });
}

async function downloadAndExtractPdf(pdfUrl) {
  // Convert HTTP to HTTPS
  if (pdfUrl.startsWith('http://')) {
    pdfUrl = pdfUrl.replace('http://', 'https://');
  }

  console.log(`Downloading PDF from: ${pdfUrl}`);
  
  const response = await fetchWithRetry(pdfUrl);
  const pdfBuffer = await response.buffer();
  
  // Extract text from PDF
  const pdfData = await pdfParse(pdfBuffer);
  return pdfData.text;
}

async function summarizeText(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a helpful assistant that specializes in summarizing academic papers. Provide clear, concise summaries that capture the main findings, methodology, and conclusions."
        },
        {
          role: "user", 
          content: `Please summarize the following academic paper text:\n\n${text}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content.strip();
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    throw new Error('Failed to generate summary using OpenAI');
  }
}

export async function searchAndSummarize(query, maxResults = 1) {
  try {
    // Search ArXiv
    const entries = await searchArxiv(query, maxResults);
    
    if (entries.length === 0) {
      throw new Error('No papers found for the given query');
    }

    const results = [];

    for (const entry of entries) {
      // Find PDF link
      let pdfLink = null;
      if (entry.links) {
        for (const link of entry.links) {
          if (link.type === 'application/pdf' || link.href.includes('.pdf')) {
            pdfLink = link.href;
            break;
          }
        }
      }

      if (!pdfLink) {
        console.log(`No PDF link found for entry: ${entry.title}`);
        continue;
      }

      try {
        // Download and extract PDF text
        const fullText = await downloadAndExtractPdf(pdfLink);
        
        // Generate summary
        const summary = await summarizeText(fullText);

        results.push({
          title: entry.title,
          authors: entry.author ? entry.author.split(', ') : [],
          abstract: entry.summary,
          pdfUrl: pdfLink,
          arxivUrl: entry.link,
          publishedDate: entry.pubdate,
          fullText: fullText,
          summary: summary
        });

      } catch (pdfError) {
        console.error(`Error processing PDF for ${entry.title}:`, pdfError);
        // Continue with next entry instead of failing completely
        continue;
      }
    }

    if (results.length === 0) {
      throw new Error('No papers could be processed successfully');
    }

    return results;

  } catch (error) {
    console.error('Error in searchAndSummarize:', error);
    throw error;
  }
}