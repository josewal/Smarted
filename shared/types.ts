// ============================================================
// Smarted — Shared Types
// These types are used by both client and server.
// They mirror the database schema but are the canonical
// TypeScript representation.
// ============================================================

// -- Users & Auth --

export interface User {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

// -- Auth Request/Response Types --

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// -- Source Materials --

export type SourceType = 'pdf' | 'markdown' | 'url';

export interface SourceMaterial {
  id: string;
  workspace_id: string;
  title: string;
  type: SourceType;
  raw_text: string | null;
  file_path: string | null;
  created_at: string;
}

// -- Cards --

export type CardType = 'basic' | 'cloze';
export type CardOrigin = 'user' | 'ai' | 'co_created';

export interface Card {
  id: string;
  workspace_id: string;
  front: string;
  back: string;
  card_type: CardType;
  origin: CardOrigin;
  source_material_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCardInput {
  workspace_id: string;
  front: string;
  back: string;
  card_type?: CardType;
  origin?: CardOrigin;
  source_material_id?: string;
}

export interface UpdateCardInput {
  front?: string;
  back?: string;
  card_type?: CardType;
}

// -- FSRS Scheduling --

export type ScheduleState = 'new' | 'learning' | 'review' | 'relearning';

export interface CardSchedule {
  id: string;
  card_id: string;
  user_id: string;
  stability: number;
  difficulty: number;
  state: ScheduleState;
  due_date: string;
  lapses: number;
  reps: number;
  last_review: string | null;
}

// -- Reviews --

export type Rating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  rating: Rating;
  response_time_ms: number | null;
  scheduled_days: number | null;
  actual_days: number | null;
  reviewed_at: string;
}

export interface ReviewInput {
  card_id: string;
  rating: Rating;
  response_time_ms?: number;
}

// -- Study Session --

export interface StudyCard {
  card: Card;
  schedule: CardSchedule;
}

export interface ReviewResult {
  card_id: string;
  updated_schedule: CardSchedule;
  is_leech: boolean;
}

// -- Dashboard --

export interface DashboardStats {
  cards_due_today: number;
  total_cards: number;
  total_reviews: number;
  accuracy_percent: number;
  leeches_count: number;
}

// -- API Responses --

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  message: string;
}
