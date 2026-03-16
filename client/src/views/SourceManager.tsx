import { useEffect, useState } from 'react';
import { useSources } from '../viewmodels/useSources';
import { api } from '../api/client';
import styles from '../styles/cards.module.css';

interface SourceManagerProps {
  workspaceId: string;
}

export function SourceManager({ workspaceId }: SourceManagerProps) {
  const { sources, loading, error, fetchSources, addSource, removeSource } = useSources(workspaceId);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await addSource(title, 'markdown', content);
    setTitle('');
    setContent('');
    setShowForm(false);
  };

  const handleGenerate = async (sourceId: string) => {
    setGenerating(sourceId);
    try {
      const cards = await api.generateCards(sourceId, workspaceId, 5);
      alert(`Generated ${cards.length} cards from this source!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate cards');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading sources...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.cardEditor}>
      <div className={styles.header}>
        <h1>Sources ({sources.length})</h1>
        <button className={styles.addButton} onClick={() => setShowForm(true)}>
          + Add source
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Source title..."
            />
          </div>
          <div className={styles.formField}>
            <label>Content (markdown or plain text)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your notes or source material here..."
              rows={10}
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit">Add source</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className={styles.cardList}>
        {sources.map((source) => (
          <div key={source.id} className={styles.cardItem}>
            <div className={styles.cardContent}>
              <div className={styles.cardFront}>{source.title}</div>
              <div className={styles.cardBack}>
                {source.raw_text?.slice(0, 200)}
                {(source.raw_text?.length ?? 0) > 200 ? '...' : ''}
              </div>
            </div>
            <div className={styles.cardMeta}>
              <span className={styles.cardOrigin}>{source.type}</span>
            </div>
            <div className={styles.cardActions}>
              <button
                onClick={() => handleGenerate(source.id)}
                disabled={generating === source.id}
              >
                {generating === source.id ? 'Generating...' : 'Generate cards'}
              </button>
              <button onClick={() => removeSource(source.id)}>Delete</button>
            </div>
          </div>
        ))}

        {sources.length === 0 && (
          <p className={styles.empty}>No sources yet. Add your study materials to generate flashcards.</p>
        )}
      </div>
    </div>
  );
}
