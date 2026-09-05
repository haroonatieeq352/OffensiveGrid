export type RoleType = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  has_paid_access?: boolean;
  roles: RoleType[];
  primary_role: RoleType;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type InstructorRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface InstructorUpgradeRequest {
  id: string;
  user?: User; // included in admin view
  experience_summary: string;
  status: InstructorRequestStatus;
  is_seen?: boolean;
  created_at: string;
  reviewed_by?: User;
  reviewed_at?: string;
  user_performance?: {
    score: number;
    solved: number;
    failed: number;
    percentage: number;
    precision: number;
    total_available: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  scenario_count?: number;
}

export interface Difficulty {
  id: string;
  name: string;
  level_value: number;
  color_code: string;
  scenario_count?: number;
}

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';
export type ScenarioStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ScenarioFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  file_type: string;
  is_public: boolean;
  uploaded_at: string;
}

export interface Scenario {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions?: string;
  category: Category;
  category_id?: string;
  difficulty?: Difficulty;
  difficulty_id?: string;
  points: number;
  target_url?: string | null;
  max_attempts: number;
  time_limit_minutes: number;
  is_paid: boolean;
  status: ScenarioStatus;
  files?: ScenarioFile[];
  is_solved?: boolean;
  attempts_used?: number;
  created_at: string;
}

export interface FlagSubmissionResult {
  is_correct: boolean;
  awarded_points: number;
  total_score?: number;
  attempt_number: number;
  remaining_attempts?: number | null;
  message: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  total_score: number;
  solved_count: number;
  last_solve_time: string | null;
}

export interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'UPCOMING' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  is_public: boolean;
  is_active: boolean;
  remaining_seconds: number;
  scenario_count?: number;
}

export interface Submission {
  id: string;
  scenario_id?: string;
  scenario_title?: string;
  scenario_difficulty?: DifficultyLevel;
  submitted_flag: string;
  is_correct: boolean;
  awarded_points: number;
  attempt_number: number;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
