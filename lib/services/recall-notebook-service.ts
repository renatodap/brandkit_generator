/**
 * Recall Notebook Service
 *
 * Handles all communication with the recall-notebook API.
 * Uses API key authentication and implements caching.
 */

import type {
  RecallCollection,
  RecallSource,
  RecallContentChunk,
  RecallApiResponse,
  KnowledgeSearchResult,
} from '@/types';

/**
 * Configuration for recall-notebook API
 */
const RECALL_API_BASE_URL = 'https://notebook-recall.vercel.app/api';
const DEFAULT_CACHE_HOURS = 6;

/**
 * Recall-notebook API client
 */
export class RecallNotebookService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = RECALL_API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Test if API key is valid by fetching user collections
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/collections`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to verify recall-notebook API key:', error);
      return false;
    }
  }

  /**
   * Get all collections for the authenticated user
   */
  async getCollections(): Promise<RecallCollection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }

      const data = await response.json() as RecallApiResponse<RecallCollection[]>;

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch collections');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw new Error('Failed to fetch collections from recall-notebook');
    }
  }

  /**
   * Get a specific collection by ID
   */
  async getCollection(collectionId: string): Promise<RecallCollection> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collectionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
      }

      const data = await response.json() as RecallApiResponse<RecallCollection>;

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch collection');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw new Error('Failed to fetch collection from recall-notebook');
    }
  }

  /**
   * Get all sources in a collection
   */
  async getCollectionSources(collectionId: string): Promise<RecallSource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collectionId}/sources`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.statusText}`);
      }

      const data = await response.json() as RecallApiResponse<RecallSource[]>;

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch sources');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching collection sources:', error);
      throw new Error('Failed to fetch sources from recall-notebook');
    }
  }

  /**
   * Search for relevant content chunks using semantic search
   */
  async semanticSearch(
    collectionId: string,
    query: string,
    maxResults: number = 10
  ): Promise<RecallContentChunk[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collectionId}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          max_results: maxResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search: ${response.statusText}`);
      }

      const data = await response.json() as RecallApiResponse<RecallContentChunk[]>;

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to search');
      }

      return data.data;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw new Error('Failed to search recall-notebook');
    }
  }

  /**
   * Get a source by ID with full content and summary
   */
  async getSource(sourceId: string): Promise<RecallSource> {
    try {
      const response = await fetch(`${this.baseUrl}/sources/${sourceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch source: ${response.statusText}`);
      }

      const data = await response.json() as RecallApiResponse<RecallSource>;

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch source');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching source:', error);
      throw new Error('Failed to fetch source from recall-notebook');
    }
  }

  /**
   * Build knowledge context for brand generation
   * Fetches all sources in a collection and formats for AI consumption
   */
  async buildKnowledgeContext(collectionId: string): Promise<string> {
    try {
      const sources = await this.getCollectionSources(collectionId);

      if (sources.length === 0) {
        return '';
      }

      // Format sources into a structured context string
      const contextParts = sources.map((source, index) => {
        const summary = source.summary || source.original_content.substring(0, 500);
        const tags = source.tags && source.tags.length > 0 ? `\nTags: ${source.tags.join(', ')}` : '';

        return `
[Source ${index + 1}: ${source.title}]
Type: ${source.source_type}${tags}
Content: ${summary}
---
`;
      });

      return `# Company Knowledge Base (${sources.length} sources)\n\n${contextParts.join('\n')}`;
    } catch (error) {
      console.error('Error building knowledge context:', error);
      return ''; // Return empty context on error (fallback)
    }
  }

  /**
   * Build targeted knowledge context using semantic search
   * More efficient than fetching all sources
   */
  async buildTargetedKnowledgeContext(
    collectionId: string,
    query: string,
    maxResults: number = 10
  ): Promise<string> {
    try {
      const chunks = await this.semanticSearch(collectionId, query, maxResults);

      if (chunks.length === 0) {
        return '';
      }

      // Format relevant chunks into context
      const contextParts = chunks.map((chunk, index) => {
        return `
[Relevant Insight ${index + 1}] (Relevance: ${(chunk.relevance_score || 0).toFixed(2)})
${chunk.content}
---
`;
      });

      return `# Relevant Company Knowledge (${chunks.length} insights)\n\n${contextParts.join('\n')}`;
    } catch (error) {
      console.error('Error building targeted knowledge context:', error);
      return ''; // Return empty context on error (fallback)
    }
  }
}

/**
 * Create a recall-notebook service instance
 */
export function createRecallService(apiKey: string): RecallNotebookService {
  return new RecallNotebookService(apiKey);
}

/**
 * Helper function to validate recall API response
 */
export function isValidRecallResponse<T>(response: any): response is RecallApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof response.success === 'boolean'
  );
}
