import { useEffect, useState } from 'react';

export default function AiThinkingIndicator({ message = 'Thinking...', duration = 1500, onComplete }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    const timer = setTimeout(() => {
      clearInterval(dotInterval);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [duration, onComplete]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 24,
      justifyContent: 'center', color: '#6b7280',
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#6366f1',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 14 }}>{message}{dots}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
