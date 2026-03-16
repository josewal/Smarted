import { Router } from 'express';
import { getCardsByWorkspace, getCardById, createCard, updateCard, deleteCard } from '../db/queries/cards.js';
import { createSchedule } from '../db/queries/schedules.js';
import { generateCardsFromText } from '../services/ai/cards.js';
import { getSourceById } from '../db/queries/sources.js';

export const cardRoutes = Router();

// List cards in a workspace
cardRoutes.get('/', async (req, res) => {
  try {
    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) {
      res.status(400).json({ error: 'workspace_id required' });
      return;
    }
    const cards = await getCardsByWorkspace(workspaceId);
    res.json({ data: cards });
  } catch (err) {
    console.error('List cards error:', err);
    res.status(500).json({ error: 'Failed to list cards' });
  }
});

// Get single card
cardRoutes.get('/:id', async (req, res) => {
  try {
    const card = await getCardById(req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json({ data: card });
  } catch (err) {
    console.error('Get card error:', err);
    res.status(500).json({ error: 'Failed to get card' });
  }
});

// Create card manually
cardRoutes.post('/', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const card = await createCard(req.body);
    // Create initial schedule for this user
    await createSchedule(card.id, userId);
    res.status(201).json({ data: card });
  } catch (err) {
    console.error('Create card error:', err);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// Update card
cardRoutes.put('/:id', async (req, res) => {
  try {
    const card = await updateCard(req.params.id, req.body);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json({ data: card });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Delete card
cardRoutes.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteCard(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// Generate cards from a source using AI
cardRoutes.post('/generate', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { source_id, workspace_id, count } = req.body;
    if (!source_id || !workspace_id) {
      res.status(400).json({ error: 'source_id and workspace_id required' });
      return;
    }

    const source = await getSourceById(source_id);
    if (!source || !source.raw_text) {
      res.status(404).json({ error: 'Source not found or has no text' });
      return;
    }

    const generatedCards = await generateCardsFromText(source.raw_text, count || 5);

    // Save each generated card
    const savedCards = [];
    for (const gc of generatedCards) {
      const card = await createCard({
        workspace_id,
        front: gc.front,
        back: gc.back,
        card_type: gc.card_type,
        origin: 'ai',
        source_material_id: source_id,
      });
      await createSchedule(card.id, userId);
      savedCards.push(card);
    }

    res.status(201).json({ data: savedCards });
  } catch (err) {
    console.error('Generate cards error:', err);
    res.status(500).json({ error: 'Failed to generate cards' });
  }
});
