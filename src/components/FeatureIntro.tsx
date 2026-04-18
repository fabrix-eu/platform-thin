import { useState, useCallback } from 'react';

// ── Hook ─────────────────────────────────────────────────────────────────────

interface FeatureInfoState {
  visible: boolean;
  show: () => void;
  dismiss: () => void;
}

export function useFeatureInfo(id: string): FeatureInfoState {
  const key = `feature-info:${id}`;
  const [visible, setVisible] = useState(() => localStorage.getItem(key) !== 'dismissed');

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(key, 'dismissed');
  }, [key]);

  const show = useCallback(() => {
    setVisible(true);
    localStorage.removeItem(key);
  }, [key]);

  return { visible, show, dismiss };
}

// ── Trigger (? button) ───────────────────────────────────────────────────────

export function FeatureInfoTrigger({ info }: { info: FeatureInfoState }) {
  if (info.visible) return null;

  return (
    <button
      type="button"
      onClick={info.show}
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
      title="Show info"
    >
      ?
    </button>
  );
}

// ── Banner ───────────────────────────────────────────────────────────────────

interface FeatureIntroProps {
  info: FeatureInfoState;
  title: string;
  description: string;
}

export function FeatureIntro({ info, title, description }: FeatureIntroProps) {
  if (!info.visible) return null;

  return (
    <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-primary/60 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        </div>
        <button
          type="button"
          onClick={info.dismiss}
          className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
