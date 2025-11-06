import type { HealthLog } from './health';
import type { Cat } from './cat';

export type AIMessageRole = 'user' | 'assistant';

export interface AIReferenceSource {
  type: string;
  content: string;
  date?: string;
}

export interface AIChatMessage {
  role: AIMessageRole;
  content: string;
  timestamp: Date;
  followUpQuestions?: string[];
  sources?: AIReferenceSource[];
}

export interface AIConversationTurn {
  role: AIMessageRole;
  content: string;
}

export interface AIChatResponse {
  answer: string;
  followUpQuestions: string[];
  sources: AIReferenceSource[];
}

export type AIRecentLog = Pick<
  HealthLog,
  | 'date'
  | 'foodAmount'
  | 'waterAmount'
  | 'litterCount'
  | 'activityLevel'
  | 'mood'
  | 'notes'
>;

export type AICatProfile = Pick<
  Cat,
  'id' | 'name' | 'breed' | 'weight' | 'neutered' | 'chronicConditions'
>;
