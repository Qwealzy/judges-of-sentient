'use client';

import { useCallback, useEffect, useState } from 'react';
import { EntryModal, getRandomDescription } from '@/components/EntryModal';
import { ResultsBoard } from '@/components/ResultsBoard';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { PledgeResult } from '@/types';

const TABLE_NAME = 'pledges';
const STORAGE_BUCKET = 'pledge-avatars';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [currentResult, setCurrentResult] = useState<PledgeResult | null>(null);
  const [otherResults, setOtherResults] = useState<PledgeResult[]>([]);
  const [isInitialised, setIsInitialised] = useState(false);

  const refreshResults = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setOtherResults(data ?? []);
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
        const supabase = getSupabaseClient();
        const extension = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'png';
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl }
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

        const description = getRandomDescription();

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert({
            username,
            profile_image_url: publicUrl,
            description
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        const newResult: PledgeResult = {
          id: data.id,
          username: data.username,
          profile_image_url: data.profile_image_url,
          description: data.description,
          created_at: data.created_at
        };

        setCurrentResult(newResult);
        setIsModalOpen(false);
        await refreshResults();
      } catch (error) {
        console.error('Failed to submit pledge', error);
        setErrorMessage('Submitting to Sentient failed. Double-check your credentials and try again.');
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

      <EntryModal isOpen={isModalOpen} isSubmitting={isSubmitting} errorMessage={errorMessage} onSubmit={handleSubmit} />

      {!isInitialised ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/80 text-slate-500">
          Connecting to Sentient…
        </div>
      ) : null}
    </main>
  );
}
