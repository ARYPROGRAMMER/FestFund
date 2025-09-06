/**
 * API utilities for consistent backend communication
 * Centralizes all API calls to ensure consistent error handling and URL management
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// API request headers with proper content type
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Generic API request handler
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith('/api/') 
      ? endpoint  // Use proxy route
      : `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred',
    };
  }
}

/**
 * Auth API calls
 */
export const authApi = {
  connect: (walletAddress: string, chainId: number, metadata?: any) =>
    apiRequest('/api/auth/connect', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, chainId, metadata }),
    }),

  verify: (sessionToken: string, walletAddress: string) =>
    apiRequest('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, walletAddress }),
    }),

  register: (data: {
    walletAddress: string;
    username: string;
    email: string;
    role: string;
    message: string;
    signature: string;
  }) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (walletAddress: string, message: string, signature: string) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, message, signature }),
    }),

  getMe: (token: string) =>
    apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  logout: (sessionToken: string) =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    }),
};

/**
 * Events/Campaigns API calls
 */
export const eventsApi = {
  getAll: (params?: {
    category?: string;
    status?: string;
    sortBy?: string;
    limit?: number;
    search?: string;
  }) => {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return apiRequest(`/api/proof/events${queryString}`);
  },

  getById: (eventId: string) =>
    apiRequest(`/api/proof/events/${eventId}`),

  getByOrganizer: (organizerAddress: string) =>
    apiRequest(`/api/proof/events/organizer/${organizerAddress}`),

  create: (eventData: {
    name: string;
    description: string;
    organizer: string;
    milestones: number[];
    targetAmount: number;
    deadline?: string;
    metadata?: any;
  }) =>
    apiRequest('/api/proof/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),

  getCommitments: (eventId: string) =>
    apiRequest(`/api/proof/events/${eventId}/commitments`),
};

/**
 * Commitments API calls
 */
export const commitmentsApi = {
  getByDonor: (donorAddress: string) =>
    apiRequest(`/api/proof/commitments/donor/${donorAddress}`),

  submit: (data: {
    eventId: string;
    commitmentHash: string;
    donorAddress: string;
  }) =>
    apiRequest('/api/proof/submit-commitment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

/**
 * User API calls
 */
export const userApi = {
  getRole: (address: string) =>
    apiRequest(`/api/proof/user/${address}/role`),
};

/**
 * Stats API calls
 */
export const statsApi = {
  getPlatform: () =>
    apiRequest('/api/proof/stats'),

  getMidnight: () =>
    apiRequest('/api/proof/midnight/status'),
};

/**
 * Achievements API calls
 */
export const achievementsApi = {
  getForCampaign: (eventId: string, unlockedOnly = false) => {
    const params = unlockedOnly ? '?unlocked_only=true' : '';
    return apiRequest(`/api/achievements/${eventId}${params}`);
  },

  checkAndUnlock: (eventId: string) =>
    apiRequest(`/api/achievements/${eventId}/check`, {
      method: 'POST',
    }),

  generate: (eventId: string) =>
    apiRequest(`/api/achievements/${eventId}/generate`, {
      method: 'POST',
    }),
};

/**
 * ZK Proof API calls
 */
export const zkApi = {
  verifyProof: (proof: any, publicSignals: any) =>
    apiRequest('/api/proof/verify-proof', {
      method: 'POST',
      body: JSON.stringify({ proof, publicSignals }),
    }),

  generateCommitment: (amount: number, nonce: string) =>
    apiRequest('/api/proof/generate-commitment', {
      method: 'POST',
      body: JSON.stringify({ amount, nonce }),
    }),
};

export default {
  authApi,
  eventsApi,
  commitmentsApi,
  userApi,
  statsApi,
  achievementsApi,
  zkApi,
};
