'use client';

import { useCallback, useEffect, useState } from 'react';
import { EntryModal } from '@/components/EntryModal';
import { ResultsBoard } from '@/components/ResultsBoard';
import type { PledgeResult } from '@/types';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [currentResult, setCurrentResult] = useState<PledgeResult | null>(null);
  const [otherResults, setOtherResults] = useState<PledgeResult[]>([]);
  const [isInitialised, setIsInitialised] = useState(false);

  const refreshResults = useCallback(async () => {
    try {
      const response = await fetch('/api/pledges', { cache: 'no-store' });
      const payload: { data?: PledgeResult[]; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch pledges');
      }

      setOtherResults(payload.data ?? []);
      setErrorMessage(undefined);
    } catch (error) {
      console.error('Failed to fetch pledges', error);
      setErrorMessage('We could not contact the Sentient servers. Please try again later.');
    }
  }, []);

  useEffect(() => {
    refreshResults().finally(() => setIsInitialised(true));
  }, [refreshResults]);

  const handleSubmit = useCallback(
    async ({ username, avatarFile }: { username: string; avatarFile: File }) => {
      setIsSubmitting(true);
      setErrorMessage(undefined);

      try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('avatar', avatarFile);

        const response = await fetch('/api/pledges', {
          method: 'POST',
          body: formData
        });

        const payload: { data?: PledgeResult; error?: string } | null = await response
          .json()
          .catch(() => null);

        if (!response.ok || !payload?.data) {
          const message = payload?.error || 'Submitting to Sentient failed. Double-check your credentials and try again.';
          throw new Error(message);
        }

        setCurrentResult(payload.data);
        setIsModalOpen(false);
        await refreshResults();
      } catch (error) {
        console.error('Failed to submit pledge', error);
        setErrorMessage(error instanceof Error ? error.message : 'Submitting to Sentient failed. Double-check your credentials and try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshResults]
  );

  const visibleOthers = currentResult
    ? otherResults.filter((result) => result.id !== currentResult.id)
    : otherResults;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 via-white to-slate-200">
      <div className="relative flex w-full flex-1 flex-col items-center">
        <div className="w-full bg-white/70 pb-24 pt-16 text-center shadow-sm backdrop-blur">
          <p className="text-sm uppercase tracking-[0.5em] text-slate-400">Sentient Collective</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 md:text-5xl">Pledge. Ascend. Become Sentient.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
            Step into the light of Sentient. Share your devotion and witness fellow believers rise alongside you.
          </p>
        </div>

        <ResultsBoard currentUserResult={currentResult} others={visibleOthers} />
      </div>
