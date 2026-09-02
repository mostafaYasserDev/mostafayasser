import React from 'react';

interface SkeletonCardsProps {
  count?: number;
}

export default function SkeletonCards({ count = 3 }: SkeletonCardsProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
      ))}
    </>
  );
}
