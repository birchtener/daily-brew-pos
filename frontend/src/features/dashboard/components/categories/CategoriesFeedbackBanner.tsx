import { AlertCircle, Check } from 'lucide-react';

import type { FeedbackState } from './types';

export default function CategoriesFeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;

  const isError = feedback.type === 'error';

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
        isError
          ? 'border border-destructive/20 bg-destructive/10 text-destructive'
          : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      {isError ? <AlertCircle className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
      {feedback.message}
    </div>
  );
}