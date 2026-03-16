import { useEffect, useState } from 'react';
import { useCards } from '../viewmodels/useCards';
import type { Card } from 'smarted-shared';
import styles from '../styles/cards.module.css';

interface CardEditorProps {
  workspaceId: string;
}

export function CardEditor({ workspaceId }: CardEditorProps) {
  const { cards, loading, error, fetchCards, addCard, editCard, removeCard } = useCards(workspaceId);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [cardType, setCardType] = useState<'basic' | 'cloze'>('basic');

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    if (editingCard) {
      await editCard(editingCard.id, { front, back, card_type: cardType });
      setEditingCard(null);
    } else {
      await addCard({ workspace_id: workspaceId, front, back, card_type: cardType });
    }

    setFront('');
    setBack('');
    setCardType('basic');
    setShowForm(false);
  };

  const startEdit = (card: Card) => {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setCardType(card.card_type);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCard(null);
    setFront('');
    setBack('');
    setCardType('basic');
  };

  if (loading) return <div className={styles.loading}>Loading cards...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.cardEditor}>
      <div className={styles.header}>
        <h1>Cards ({cards.length})</h1>
        <button className={styles.addButton} onClick={() => setShowForm(true)}>
          + New card
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label>Front</label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Question or prompt..."
              rows={3}
            />
          </div>
          <div className={styles.formField}>
            <label>Back</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Answer or explanation..."
              rows={3}
            />
          </div>
          <div className={styles.formField}>
            <label>Type</label>
            <select value={cardType} onChange={(e) => setCardType(e.target.value as 'basic' | 'cloze')}>
              <option value="basic">Basic</option>
              <option value="cloze">Cloze</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button type="submit">{editingCard ? 'Save' : 'Create'}</button>
            <button type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className={styles.cardList}>
        {cards.map((card) => (
          <div key={card.id} className={styles.cardItem}>
            <div className={styles.cardContent}>
              <div className={styles.cardFront}>{card.front}</div>
              <div className={styles.cardBack}>{card.back}</div>
            </div>
            <div className={styles.cardMeta}>
              <span className={styles.cardOrigin}>{card.origin}</span>
              <span className={styles.cardType}>{card.card_type}</span>
            </div>
            <div className={styles.cardActions}>
              <button onClick={() => startEdit(card)}>Edit</button>
              <button onClick={() => removeCard(card.id)}>Delete</button>
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <p className={styles.empty}>No cards yet. Create one or generate from source material.</p>
        )}
      </div>
    </div>
  );
}
