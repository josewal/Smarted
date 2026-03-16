import { createEmptyCard, fsrs, generatorParameters, type Card as FSRSCard, type Grade, Rating as FSRSRating } from 'ts-fsrs';
import type { CardSchedule, Rating } from 'smarted-shared';

// Initialize FSRS with default parameters
// These can be auto-tuned per-user in Phase 2
const params = generatorParameters();
const scheduler = fsrs(params);

// Map our 1-4 rating to ts-fsrs Grade
function toFSRSGrade(rating: Rating): Grade {
  switch (rating) {
    case 1: return FSRSRating.Again;
    case 2: return FSRSRating.Hard;
    case 3: return FSRSRating.Good;
    case 4: return FSRSRating.Easy;
  }
}

// Convert our DB schedule to ts-fsrs Card format
function toFSRSCard(schedule: CardSchedule): FSRSCard {
  const card = createEmptyCard();
  card.stability = schedule.stability;
  card.difficulty = schedule.difficulty;
  card.reps = schedule.reps;
  card.lapses = schedule.lapses;
  card.last_review = schedule.last_review ? new Date(schedule.last_review) : undefined as unknown as Date;
  card.due = new Date(schedule.due_date);

  // Map state string to ts-fsrs State enum
  const stateMap: Record<string, number> = {
    'new': 0,
    'learning': 1,
    'review': 2,
    'relearning': 3,
  };
  card.state = stateMap[schedule.state] ?? 0;

  return card;
}

// Map ts-fsrs State number back to our string
const stateNames = ['new', 'learning', 'review', 'relearning'] as const;

export interface ScheduleUpdate {
  stability: number;
  difficulty: number;
  state: string;
  due_date: string;
  lapses: number;
  reps: number;
  last_review: string;
}

export function computeNextSchedule(schedule: CardSchedule, rating: Rating): ScheduleUpdate {
  const fsrsCard = toFSRSCard(schedule);
  const grade = toFSRSGrade(rating);
  const now = new Date();

  const result = scheduler.repeat(fsrsCard, now);
  const nextCard = result[grade].card;

  return {
    stability: nextCard.stability,
    difficulty: nextCard.difficulty,
    state: stateNames[nextCard.state] || 'new',
    due_date: nextCard.due.toISOString(),
    lapses: nextCard.lapses,
    reps: nextCard.reps,
    last_review: now.toISOString(),
  };
}
