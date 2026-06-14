import React from 'react';
import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  rows?: number;
  variant?: 'card' | 'table' | 'form';
}

export default function LoadingSkeleton({ rows = 3, variant = 'table' }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={styles.cardGrid}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.card}`} />
        ))}
      </div>
    );
  }
  if (variant === 'form') {
    return (
      <div className={styles.formSkeleton}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.formField}>
            <div className={`${styles.skeleton} ${styles.label}`} />
            <div className={`${styles.skeleton} ${styles.input}`} />
          </div>
        ))}
      </div>
    );
  }
  // table variant
  return (
    <div className={styles.tableSkeleton}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles.row}`} />
      ))}
    </div>
  );
}
