import { Router } from 'express';
import { getSourcesByWorkspace, getSourceById, createSource, deleteSource } from '../db/queries/sources.js';

export const sourceRoutes = Router();

// List sources in a workspace
sourceRoutes.get('/', async (req, res) => {
  try {
    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) {
      res.status(400).json({ error: 'workspace_id required' });
      return;
    }
    const sources = await getSourcesByWorkspace(workspaceId);
    res.json({ data: sources });
  } catch (err) {
    console.error('List sources error:', err);
    res.status(500).json({ error: 'Failed to list sources' });
  }
});

// Get single source
sourceRoutes.get('/:id', async (req, res) => {
  try {
    const source = await getSourceById(req.params.id);
    if (!source) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    res.json({ data: source });
  } catch (err) {
    console.error('Get source error:', err);
    res.status(500).json({ error: 'Failed to get source' });
  }
});

// Upload source material (markdown/text)
sourceRoutes.post('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { workspace_id, title, type, content } = req.body;
    if (!workspace_id || !title || !type || !content) {
      res.status(400).json({ error: 'workspace_id, title, type, and content required' });
      return;
    }

    const source = await createSource(workspace_id, title, type, content);
    res.status(201).json({ data: source });
  } catch (err) {
    console.error('Create source error:', err);
    res.status(500).json({ error: 'Failed to create source' });
  }
});

// Delete source
sourceRoutes.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteSource(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    console.error('Delete source error:', err);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});
