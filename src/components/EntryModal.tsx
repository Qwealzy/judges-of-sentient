'use client';

import Image from 'next/image';
import { FormEvent, useId, useState } from 'react';
import clsx from 'clsx';

export type EntryFormValues = {
  username: string;
  avatarFile: File | null;
};

type EntryModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: { username: string; avatarFile: File }) => Promise<void>;
};

export function EntryModal({ isOpen, isSubmitting, errorMessage, onSubmit }: EntryModalProps) {
  const usernameId = useId();
  const avatarId = useId();
  const [values, setValues] = useState<EntryFormValues>({ username: '', avatarFile: null });
  const [touched, setTouched] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);

    if (!values.username.trim() || !values.avatarFile) {
      return;
    }

    await onSubmit({ username: values.username.trim(), avatarFile: values.avatarFile });
    setValues({ username: '', avatarFile: null });
    setTouched(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="mx-4 grid max-w-5xl grid-cols-1 gap-10 rounded-3xl bg-white p-10 shadow-2xl shadow-slate-600/30 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <header className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Sentient Pledge</p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Are you worthy of being SentientMaxi?</h1>
            <p className="text-base text-slate-500">Pledge to Sentient to show how much you want it!</p>
          </header>

          <div className="space-y-5">
            <label className="flex flex-col gap-2" htmlFor={usernameId}>
              <span className="text-sm font-medium text-slate-600">Username</span>
              <input
                id={usernameId}
                name="username"
                type="text"
                placeholder="Enter your on-chain alias"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={values.username}
                onChange={(event) => setValues((prev) => ({ ...prev, username: event.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-2" htmlFor={avatarId}>
              <span className="text-sm font-medium text-slate-600">Profile photo</span>
              <input
                id={avatarId}
                name="avatar"
                type="file"
                accept="image/*"
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-slate-400"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setValues((prev) => ({ ...prev, avatarFile: file }));
                }}
              />
            </label>

            {touched && (!values.username.trim() || !values.avatarFile) ? (
              <p className="text-sm font-medium text-rose-500">Please provide both a username and a profile photo.</p>
            ) : null}

            {errorMessage ? <p className="text-sm font-medium text-rose-500">{errorMessage}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              'inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-white',
              isSubmitting && 'cursor-not-allowed opacity-70'
            )}
          >
            {isSubmitting ? 'Summoning results…' : 'See the results'}
          </button>
        </form>

        <div className="relative hidden overflow-hidden rounded-3xl bg-slate-900/90 p-6 text-white shadow-inner shadow-slate-900/40 md:flex md:flex-col md:items-center md:justify-center">
          <Image src="/pledge-frame.png" alt="Sentient pledge frame" width={420} height={420} className="w-full max-w-[420px]" priority />
          <p className="mt-6 text-center text-sm text-slate-300">
            Replace this artwork with your official Sentient image. Your profile photo will be composited onto the frame.
          </p>
        </div>
      </div>
    </div>
  );
}
