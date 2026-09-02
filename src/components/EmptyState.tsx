import React from 'react';

const EMPTY_STATES: Record<string, { emoji: string; title: string; text: string }> = {
  services: { emoji: '🌿', title: 'الخدمات تنمو', text: 'لم أضف خدمات بعد، لكن الجذور تستعد للنمو قريباً.' },
  projects: { emoji: '🌳', title: 'أغصان جديدة قادمة', text: 'المشاريع قيد الإعداد. عد قريباً لاستكشاف حكايات جديدة.' },
  articles: { emoji: '📜', title: 'صفحات فارغة مؤقتاً', text: 'المقالات في الطريق. ستجد هنا قصصاً تقنية قريباً.' },
  reviews: { emoji: '💬', title: 'بانتظار أصواتكم', text: 'كن أول من يشارك تجربته مع جذع.' },
  items: { emoji: '🍂', title: 'لا شيء هنا بعد', text: 'المحتوى في طريقه إليك.' }
};

interface EmptyStateProps {
  type?: 'services' | 'projects' | 'articles' | 'reviews' | 'items';
  title?: string;
  text?: string;
  emoji?: string;
}

export default function EmptyState({ type = 'items', title, text, emoji }: EmptyStateProps) {
  const state = EMPTY_STATES[type] || EMPTY_STATES.items;
  const displayEmoji = emoji || state.emoji;
  const displayTitle = title || state.title;
  const displayText = text || state.text;

  return (
    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
      <div className="empty-state-emoji">{displayEmoji}</div>
      <h3>{displayTitle}</h3>
      <p>{displayText}</p>
    </div>
  );
}
