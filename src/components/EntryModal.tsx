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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#040108]/80 backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,143,0,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.18),_transparent_55%)]"
      />
      <div className="mx-4 grid max-w-5xl grid-cols-1 gap-10 rounded-[32px] border border-orange-500/30 bg-[#140214]/95 p-10 shadow-[0_0_70px_rgba(255,94,0,0.25)] ring-1 ring-purple-500/20 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          <header className="space-y-4">
            <p className="text-xs uppercase tracking-[0.6em] text-amber-300/70">Sentient Rite</p>
            <h1 className="text-3xl font-semibold text-amber-100 md:text-4xl">Are you worthy of being SentientMaxi?</h1>
            <p className="text-base text-amber-200/70">Pledge to Sentient to show how much you want it!</p>
          </header>

          <div className="space-y-6">
            <label className="flex flex-col gap-2" htmlFor={usernameId}>
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-400/80">Ritual name</span>
              <input
                id={usernameId}
                name="username"
                type="text"
                placeholder="Whisper your chosen alias"
                className="rounded-2xl border border-amber-500/40 bg-[#1b0821] px-4 py-3 text-base font-medium text-amber-100 placeholder:text-amber-200/40 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/40"
                value={values.username}
                onChange={(event) => setValues((prev) => ({ ...prev, username: event.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-2" htmlFor={avatarId}>
              <span className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-400/80">Offer your visage</span>
              <input
                id={avatarId}
                name="avatar"
                type="file"
                accept="image/*"
                className="rounded-2xl border border-dashed border-amber-500/40 bg-[#1c0924] px-4 py-6 text-sm text-amber-200/70 file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-amber-500 file:via-orange-500 file:to-rose-500 file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white transition hover:border-amber-400/60"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setValues((prev) => ({ ...prev, avatarFile: file }));
                }}
              />
            </label>

            {touched && (!values.username.trim() || !values.avatarFile) ? (
              <p className="text-sm font-medium text-rose-300">The rite requires both a name and a face.</p>
            ) : null}

            {errorMessage ? <p className="text-sm font-medium text-rose-300">{errorMessage}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              'relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-3 text-base font-semibold text-[#1a0507] shadow-[0_0_40px_rgba(255,96,0,0.35)] transition focus:outline-none focus:ring-2 focus:ring-amber-300/80 focus:ring-offset-2 focus:ring-offset-[#140214] hover:from-amber-400 hover:via-orange-400 hover:to-rose-400',
              isSubmitting && 'cursor-not-allowed opacity-70'
            )}
          >
            {isSubmitting ? 'Summoning results…' : 'See the results'}
          </button>
        </form>

        <div className="relative hidden overflow-hidden rounded-[28px] border border-amber-500/30 bg-[#0c0111] p-6 shadow-[0_0_60px_rgba(109,40,217,0.35)] md:flex md:flex-col md:items-center md:justify-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.15),_transparent_70%)]" aria-hidden />
          <div className="flex items-center justify-center rounded-full border border-amber-500/40 bg-black/40 p-6 shadow-inner shadow-purple-900/50">
            <Image src="/pledge-frame.png" alt="Sentient pledge frame" width={420} height={420} className="w-full max-w-[360px]" priority />
          </div>
        </div>
      </div>
    </div>
  );
}
