import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
  message?: string;
}

export function LoadingScreen({ isVisible, progress = 0, message = 'Loading...' }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2 className="loading-title">UrbanSynth</h2>
        <p className="loading-subtitle">{message}{dots}</p>
        <div className="loading-progress">
          <div
            className="loading-progress-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {progress > 0 ? `${Math.round(progress)}%` : 'Initializing simulation...'}
        </p>
      </div>
    </div>
  );
}