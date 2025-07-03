import { firebaseAuth } from './firebase-auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = import.meta.env.PUBLIC_API_BASE_URL || 'https://backend.jmnt34deg.workers.dev';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      const idToken = await firebaseAuth.getIdToken();
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.warn('Failed to get ID token:', error);
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 403) {
          throw new Error('アクセス権限がありません。');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error.message || 'APIリクエストでエラーが発生しました'
      };
    }
  }

  // 既存のフォルダベースのAPIエンドポイントを使用
  async getWorlds(folderId: string = "default"): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}/items`);
  }

  async getWorld(worldId: string): Promise<ApiResponse> {
    return this.makeRequest(`/v2/worlds/${worldId}`);
  }

  async createWorld(worldData: any): Promise<ApiResponse> {
    // まずマスターにワールドを追加
    return this.makeRequest('/v2/worlds', {
      method: 'POST',
      body: JSON.stringify(worldData),
    });
  }

  async updateWorld(worldId: string, worldData: any): Promise<ApiResponse> {
    return this.makeRequest(`/v2/worlds/${worldId}`, {
      method: 'PUT',
      body: JSON.stringify(worldData),
    });
  }

  async deleteWorld(worldId: string): Promise<ApiResponse> {
    return this.makeRequest(`/v2/worlds/${worldId}`, {
      method: 'DELETE',
    });
  }

  async searchWorlds(query: string, page: number = 1, limit: number = 18): Promise<ApiResponse> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.makeRequest(`/v2/worlds/search?${params}`);
  }

  async addWorldTag(worldId: string, tag: string): Promise<ApiResponse> {
    return this.makeRequest(`/v2/worlds/${worldId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    });
  }

  async removeWorldTag(worldId: string, tag: string): Promise<ApiResponse> {
    return this.makeRequest(`/v2/worlds/${worldId}/tags/${encodeURIComponent(tag)}`, {
      method: 'DELETE',
    });
  }

  // フォルダ関連のAPI (v2)
  async getFolders(): Promise<ApiResponse> {
    return this.makeRequest('/v2/folders');
  }

  async createFolder(folderData: any): Promise<ApiResponse> {
    return this.makeRequest('/v2/folders', {
      method: 'POST',
      body: JSON.stringify(folderData),
    });
  }

  async updateFolder(folderId: string, folderData: any): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}`, {
      method: 'PUT',
      body: JSON.stringify(folderData),
    });
  }

  async deleteFolder(folderId: string): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}`, {
      method: 'DELETE',
    });
  }

  async getFolderItems(folderId: string): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}/items`);
  }

  async addWorldToFolder(folderId: string, worldData: any): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}/items`, {
      method: 'POST',
      body: JSON.stringify(worldData),
    });
  }

  async removeWorldFromFolder(folderId: string, worldId: string): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}/items/${worldId}`, {
      method: 'DELETE',
    });
  }

  async updateWorldComment(folderId: string, worldId: string, comment: string): Promise<ApiResponse> {
    const formattedId = String(folderId).padStart(8, "0");
    return this.makeRequest(`/v2/folders/${formattedId}/items/${worldId}`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    });
  }

  async getUserProfile(): Promise<ApiResponse> {
    return this.makeRequest('/api/v2/user/profile');
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse> {
    return this.makeRequest('/api/v2/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  isAuthenticated(): boolean {
    return firebaseAuth.isAuthenticated();
  }

  async getCurrentUser() {
    return firebaseAuth.getCurrentUser();
  }

  getUserInfo() {
    return firebaseAuth.getUserInfo();
  }
}

export const apiService = new ApiService();