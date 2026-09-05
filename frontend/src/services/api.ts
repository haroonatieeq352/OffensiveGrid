import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  ApiResponse,
  User,
  Category,
  Scenario,
  FlagSubmissionResult,
  LeaderboardEntry,
  Competition,
  Difficulty,
} from '../types';

const API_BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Access Token (per-tab sessionStorage prioritized)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automated Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 403 && (error.response?.data as any)?.error?.code === 'INSTANCE_UNAUTHORIZED') {
      const errorData = (error.response.data as any).error;
      window.dispatchEvent(new CustomEvent('offensivegrid:license_locked', { detail: errorData }));
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
      if (!refreshToken) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{ success: boolean; data: { access: string } }>(
          `${API_BASE_URL}/auth/refresh/`,
          { refresh: refreshToken }
        );
        const newAccessToken = response.data.data.access;
        sessionStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('access_token', newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API Service Endpoints
export const authService = {
  login: async (credentials: { email: string; password: string; otp?: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; tokens: { access: string; refresh: string }; requires_totp_setup?: boolean }>>(
      '/auth/login/',
      credentials
    );
    return res.data;
  },
  googleLogin: async (data: { id_token: string; otp?: string; mode?: 'login' | 'register' }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; tokens: { access: string; refresh: string }; requires_totp_setup?: boolean }>>(
      '/auth/google/',
      data
    );
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post<ApiResponse<{ user: User; tokens: { access: string; refresh: string } }>>(
      '/auth/register/',
      data
    );
    return res.data;
  },
  sendEmailOtp: async (email: string) => {
    const res = await apiClient.post<ApiResponse<{ email: string; expires_in_seconds: number; cooldown_seconds: number; debug_otp?: string }>>(
      '/auth/send-email-otp/',
      { email }
    );
    return res.data;
  },
  verifyEmailOtp: async (email: string, otpCode: string) => {
    const res = await apiClient.post<ApiResponse<{ email: string; is_verified: boolean }>>(
      '/auth/verify-email-otp/',
      { email, otp_code: otpCode }
    );
    return res.data;
  },
  requestPasswordReset: async (email: string) => {
    const res = await apiClient.post<ApiResponse<{ email: string; cooldown_seconds: number }>>(
      '/auth/password-reset/request/',
      { email }
    );
    return res.data;
  },
  verifyPasswordResetOtp: async (email: string, otpCode: string) => {
    const res = await apiClient.post<ApiResponse<{ reset_token: string; requires_2fa: boolean; email: string }>>(
      '/auth/password-reset/verify-otp/',
      { email, otp_code: otpCode }
    );
    return res.data;
  },
  confirmPasswordReset: async (data: { reset_token: string; new_password: string; confirm_password: string; totp_code?: string }) => {
    const res = await apiClient.post<ApiResponse<null>>(
      '/auth/password-reset/confirm/',
      data
    );
    return res.data;
  },
  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me/');
    return res.data;
  },
  updateProfile: async (data: Partial<User>) => {
    const res = await apiClient.patch<ApiResponse<User>>('/auth/me/', data);
    return res.data;
  },
  getUsers: async (params?: { search?: string; role?: string }) => {
    const res = await apiClient.get<ApiResponse<User[]> | { results: User[] }>('/auth/users/', { params });
    return res.data;
  },
  toggleUserStatus: async (userId: string) => {
    const res = await apiClient.post<ApiResponse<User>>(`/auth/users/${userId}/toggle-status/`);
    return res.data;
  },
  revokeInstructor: async (userId: string) => {
    const res = await apiClient.post<ApiResponse<User>>(`/auth/users/${userId}/revoke-instructor/`);
    return res.data;
  },
};

export const taxonomyService = {
  // Categories
  getCategories: async () => {
    const res = await apiClient.get<any>('/scenarios/categories/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  adminGetCategories: async () => {
    const res = await apiClient.get<any>('/scenarios/admin/categories/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  createCategory: async (data: Partial<Category>) => {
    const res = await apiClient.post<Category>('/scenarios/admin/categories/', data);
    return res.data;
  },
  updateCategory: async (id: string, data: Partial<Category>) => {
    const res = await apiClient.patch<Category>(`/scenarios/admin/categories/${id}/`, data);
    return res.data;
  },
  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/scenarios/admin/categories/${id}/`);
    return res.data;
  },

  // Difficulties
  getDifficulties: async () => {
    const res = await apiClient.get<any>('/scenarios/difficulties/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  adminGetDifficulties: async () => {
    const res = await apiClient.get<any>('/scenarios/admin/difficulties/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  createDifficulty: async (data: Partial<Difficulty>) => {
    const res = await apiClient.post<Difficulty>('/scenarios/admin/difficulties/', data);
    return res.data;
  },
  updateDifficulty: async (id: string, data: Partial<Difficulty>) => {
    const res = await apiClient.patch<Difficulty>(`/scenarios/admin/difficulties/${id}/`, data);
    return res.data;
  },
  deleteDifficulty: async (id: string) => {
    const res = await apiClient.delete(`/scenarios/admin/difficulties/${id}/`);
    return res.data;
  },
};

export const scenarioService = {
  getCategories: async () => {
    const res = await apiClient.get<any>('/scenarios/categories/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  getScenarios: async (params?: { category?: string; difficulty?: string; search?: string }) => {
    const res = await apiClient.get<ApiResponse<Scenario[]> | { results: Scenario[] }>('/scenarios/', { params });
    return (res.data as any).data || (res.data as any).results || (Array.isArray(res.data) ? res.data : []);
  },
  getScenarioDetail: async (slug: string) => {
    const res = await apiClient.get<ApiResponse<Scenario>>(`/scenarios/${slug}/`);
    return (res.data as any).data || res.data;
  },
  getAdminScenarios: async () => {
    const res = await apiClient.get<any>('/scenarios/admin/scenarios/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  createScenario: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<Scenario>>('/scenarios/admin/scenarios/', payload);
    return (res.data as any).data || res.data;
  },
  updateScenario: async (id: string, payload: any) => {
    const res = await apiClient.patch<ApiResponse<Scenario>>(`/scenarios/admin/scenarios/${id}/`, payload);
    return (res.data as any).data || res.data;
  },
  deleteScenario: async (id: string) => {
    const res = await apiClient.delete(`/scenarios/admin/scenarios/${id}/`);
    return res.data;
  },
};

export const submissionService = {
  submitFlag: async (payload: { scenario_id: string; flag: string; competition_id?: string }) => {
    const res = await apiClient.post<ApiResponse<FlagSubmissionResult>>('/submissions/submit/', payload);
    return res.data;
  },
  getMySubmissions: async () => {
    const res = await apiClient.get<any>('/submissions/my/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
};

export const leaderboardService = {
  getGlobalLeaderboard: async () => {
    const res = await apiClient.get<any>('/leaderboard/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  getCompetitionLeaderboard: async (slug: string) => {
    const res = await apiClient.get<any>(`/leaderboard/${slug}/`);
    return (res.data as any).data || res.data;
  },
  getStudentTelemetry: async (competitionSlug?: string) => {
    const res = await apiClient.get<ApiResponse<{
      students: any[];
      top_3_podium: any[];
      race_timeline: any[];
      top_student_usernames: string[];
      global_stats: {
        total_students: number;
        active_trainees: number;
        total_solves: number;
        total_fails: number;
        total_attempts: number;
        global_accuracy_rate: number;
      };
    }>>('/leaderboard/admin/student-telemetry/', {
      params: competitionSlug ? { competition: competitionSlug } : {},
    });
    return (res.data as any).data || res.data;
  },
};

export const competitionService = {
  getCompetitions: async () => {
    const res = await apiClient.get<ApiResponse<Competition[]> | { results: Competition[] }>('/competitions/');
    return (res.data as any).data || (res.data as any).results || res.data;
  },
  getCompetitionDetail: async (slug: string) => {
    const res = await apiClient.get<ApiResponse<Competition>>(`/competitions/${slug}/`);
    return (res.data as any).data || res.data;
  },
};

export const fileService = {
  uploadFile: async (formData: FormData) => {
    const res = await apiClient.post<ApiResponse<any>>('/files/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getDownloadToken: async (fileId: string) => {
    const res = await apiClient.get<ApiResponse<{ token: string; download_url: string; file_name: string }>>(
      `/files/${fileId}/token/`
    );
    return res.data;
  },
};

export const auditService = {
  getLogs: async (params?: { search?: string }) => {
    const res = await apiClient.get<ApiResponse<any[]> | { results: any[] }>('/audit/logs/', { params });
    return (res.data as any).data || (res.data as any).results || res.data;
  },
};

export const paymentService = {
  submitRequest: async (payload: FormData | Record<string, any>) => {
    const isFormData = payload instanceof FormData;
    const res = await apiClient.post<ApiResponse<any>>('/payments/request/', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  },
  getMyRequests: async () => {
    const res = await apiClient.get<any>('/payments/request/');
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  },
  getAdminRequests: async (params?: { search?: string }) => {
    const res = await apiClient.get<any>('/payments/admin/requests/', { params });
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && res.data.results && Array.isArray(res.data.results)) return res.data.results;
    return [];
  },
  getPendingStats: async () => {
    const res = await apiClient.get<any>('/payments/admin/stats/');
    return (res.data as any).data || res.data;
  },
  markSeen: async (requestId: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/payments/admin/requests/${requestId}/mark-seen/`);
    return res.data;
  },
  sendInvoice: async (requestId: string, adminNotes?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/payments/admin/requests/${requestId}/send-invoice/`, {
      admin_notes: adminNotes || 'Bank details & invoice sent to trainee.',
    });
    return res.data;
  },
  approveRequest: async (requestId: string, adminNotes?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/payments/admin/requests/${requestId}/approve/`, {
      admin_notes: adminNotes || 'Payment verified and approved.',
    });
    return res.data;
  },
  revokeRequest: async (requestId: string, adminNotes?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/payments/admin/requests/${requestId}/revoke/`, {
      admin_notes: adminNotes || 'Pro membership subscription revoked / expired.',
    });
    return res.data;
  },
    rejectRequest: async (requestId: string, adminNotes?: string) => {
      const res = await apiClient.post<ApiResponse<any>>(`/payments/admin/requests/${requestId}/reject/`, {
        admin_notes: adminNotes || 'Payment verification failed.',
      });
      return res.data;
    },
    getSettings: async () => {
      const res = await apiClient.get<ApiResponse<any>>('/payments/settings/');
      return res.data.data;
    },
    updateSettings: async (amount: number) => {
      const res = await apiClient.post<ApiResponse<any>>('/payments/settings/', {
        pro_plan_amount: amount
      });
      return res.data.data;
    },
};

export const tournamentService = {
  getConfig: async () => {
    const res = await apiClient.get<any>('/competitions/tournament-config/');
    return res.data; // { duration_minutes: 240 }
  },
  updateConfig: async (durationMinutes: number, isActive: boolean = true) => {
    const res = await apiClient.post<any>('/competitions/tournament-config/', { duration_minutes: durationMinutes, is_active: isActive });
    return res.data;
  },
  resetTournament: async () => {
    const res = await apiClient.post<any>('/competitions/tournament-config/reset-sessions/');
    return res.data;
  },
  getMySession: async () => {
    const res = await apiClient.get<any>('/competitions/my-session/');
    return res.data; // { start_time, duration_minutes, remaining_seconds }
  },
  startSession: async () => {
    const res = await apiClient.post<any>('/competitions/start-session/');
    return res.data;
  },
};

export const instructorRequestService = {
  submitRequest: async (data: { experience_summary: string; portfolio_url?: string }) => {
    const res = await apiClient.post<any>('/auth/instructor-requests/submit/', data);
    return res.data;
  },
  getAdminRequests: async () => {
    const res = await apiClient.get<any>('/auth/admin/instructor-requests/');
    const list = res.data?.results || res.data?.data || res.data;
    return Array.isArray(list) ? list : [];
  },
  processRequest: async (id: string, action: 'approve' | 'reject') => {
    const res = await apiClient.post<any>(`/auth/admin/instructor-requests/${id}/process/`, { action });
    return res.data;
  },
  getPendingStats: async () => {
    const res = await apiClient.get<any>('/auth/admin/instructor-requests/stats/');
    return (res.data as any).data || res.data;
  },
  markSeen: async (id: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/auth/admin/instructor-requests/${id}/mark-seen/`);
    return res.data;
  }
};

// ==========================================
// Admin Submission Management Service
// ==========================================

export const adminSubmissionService = {
  getFailedAttempts: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/submissions/admin/failed/');
    return response.data.data;
  },
  resetAttempts: async (userId: string, scenarioId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/submissions/admin/reset/', {
      user_id: userId,
      scenario_id: scenarioId
    });
    return response.data;
  }
};

// ==========================================
// Instance Licensing & Hardware Gate Service
// ==========================================

export const licenseService = {
  getStatus: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/license/status/');
    return res.data;
  },
  activate: async (licenseKey: string): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/license/activate/', {
      license_key: licenseKey
    });
    return res.data;
  }
};

