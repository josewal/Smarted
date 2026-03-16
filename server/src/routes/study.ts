import { Router } from 'express';
import { getDueCards, getScheduleForCard, updateSchedule } from '../db/queries/schedules.js';
import { getCardById } from '../db/queries/cards.js';
import { createReviewLog, getReviewStats } from '../db/queries/reviews.js';
import { computeNextSchedule } from '../services/scheduler/fsrs.js';
import { isLeech } from '../services/scheduler/leech.js';
import type { Rating, StudyCard } from 'smarted-shared';

export const studyRoutes = Router();

// Get cards due for study in a workspace
studyRoutes.get('/due', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) {
      res.status(400).json({ error: 'workspace_id required' });
      return;
    }

    const schedules = await getDueCards(userId, workspaceId);

    // Fetch full card data for each due schedule
    const studyCards: StudyCard[] = [];
    for (const schedule of schedules) {
      const card = await getCardById(schedule.card_id);
      if (card) {
        studyCards.push({ card, schedule });
      }
    }

    res.json({ data: studyCards });
  } catch (err) {
    console.error('Get due cards error:', err);
    res.status(500).json({ error: 'Failed to get due cards' });
  }
});

// Submit a review
studyRoutes.post('/review', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { card_id, rating, response_time_ms } = req.body as {
      card_id: string;
      rating: Rating;
      response_time_ms?: number;
    };

    if (!card_id || !rating || rating < 1 || rating > 4) {
      res.status(400).json({ error: 'card_id and rating (1-4) required' });
      return;
    }

    // Get current schedule
    const schedule = await getScheduleForCard(card_id, userId);
    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found for this card' });
      return;
    }

    // Compute next schedule using FSRS
    const nextSchedule = computeNextSchedule(schedule, rating);

    // Update the schedule in DB
    const updatedSchedule = await updateSchedule(card_id, userId, nextSchedule);

    // Log the review
    await createReviewLog(card_id, userId, rating, response_time_ms);

    res.json({
      data: {
        card_id,
        updated_schedule: updatedSchedule,
        is_leech: isLeech(updatedSchedule.lapses),
      },
    });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get study stats for dashboard
studyRoutes.get('/stats', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) {
      res.status(400).json({ error: 'workspace_id required' });
      return;
    }

    const [dueCards, reviewStats, leechResult] = await Promise.all([
      getDueCards(userId, workspaceId),
      getReviewStats(userId, workspaceId),
      (async () => {
        const { pool } = await import('../db/pool.js');
        const r = await pool.query(
          `SELECT COUNT(*) as count FROM card_schedules cs
           JOIN cards c ON c.id = cs.card_id
           WHERE cs.user_id = $1 AND c.workspace_id = $2 AND cs.lapses >= 5`,
          [userId, workspaceId]
        );
        return r.rows[0];
      })(),
    ]);

    const totalCards = await (async () => {
      const { pool } = await import('../db/pool.js');
      const r = await pool.query(
        'SELECT COUNT(*) as count FROM cards WHERE workspace_id = $1',
        [workspaceId]
      );
      return r.rows[0];
    })();

    const totalReviews = parseInt(reviewStats.total_reviews) || 0;
    const correctReviews = parseInt(reviewStats.correct_reviews) || 0;

    res.json({
      data: {
        cards_due_today: dueCards.length,
        total_cards: parseInt(totalCards.count) || 0,
        total_reviews: totalReviews,
        accuracy_percent: totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0,
        leeches_count: parseInt(leechResult.count) || 0,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});
