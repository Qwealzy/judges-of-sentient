'use client';

import Image from 'next/image';
import { FormEvent, useId, useState } from 'react';
import clsx from 'clsx';

import { pledgeFrameSrc } from '@/lib/pledgeFrame';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#040108]/80 p-4 md:p-10 backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,143,0,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(147,51,234,0.18),_transparent_55%)]"
      />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 rounded-[32px] border border-orange-500/30 bg-[#140214]/95 p-8 shadow-[0_0_70px_rgba(255,94,0,0.25)] ring-1 ring-purple-500/20 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-10">
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
                placeholder="Twitter @Username"
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

          <div className="flex flex-col items-center gap-4">
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

            <div className="flex flex-col items-center gap-3 text-xs text-amber-200/70">
              <span className="text-sm font-semibold tracking-[0.35em] text-amber-300/80">Made by Godsonits</span>
              <div className="flex items-center gap-4">
                <a
                  href="https://x.com/GGodsonits"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-200/80 transition hover:text-amber-100"
                  aria-label="Godsonits on X"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M18.244 2h3.166l-6.92 7.91L22 22h-6.61l-4.357-5.708L5.9 22H2.732l7.4-8.456L2 2h6.778l3.945 5.249L18.244 2Zm-1.164 18h1.753L7.05 3.917H5.178L17.08 20Z" />
                  </svg>
                </a>
                <div className="flex items-center gap-2 text-amber-200/70">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M20.317 4.369A19.791 19.791 0 0 0 16.556 3a14.458 14.458 0 0 0-.651 1.334 18.626 18.626 0 0 0-5.808 0A12.505 12.505 0 0 0 9.446 3a19.736 19.736 0 0 0-3.76 1.376C1.92 9.27 1.14 14.033 1.493 18.728a19.916 19.916 0 0 0 4.955 2.528 15.019 15.019 0 0 0 1.059-1.727 12.58 12.58 0 0 1-1.666-.8c.14-.1.277-.204.409-.31 3.214 1.5 6.707 1.5 9.889 0 .135.108.273.214.414.315-.53.31-1.082.577-1.653.8.28.6.598 1.177.95 1.727a19.864 19.864 0 0 0 4.96-2.53c.407-5.027-.696-9.747-2.993-14.36ZM8.68 15.337c-.965 0-1.76-.882-1.76-1.963s.766-1.963 1.761-1.963c1 0 1.787.885 1.76 1.963 0 1.081-.766 1.963-1.76 1.963Zm6.64 0c-.964 0-1.76-.882-1.76-1.963s.765-1.963 1.76-1.963 1.787.885 1.76 1.963c0 1.081-.766 1.963-1.76 1.963Z" />
                  </svg>
                  <span className="text-[0.7rem] tracking-[0.35em]">@godsonits</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="relative hidden overflow-hidden rounded-[28px] border border-amber-500/30 bg-[#0c0111] p-6 shadow-[0_0_60px_rgba(109,40,217,0.35)] md:flex md:flex-col md:items-center md:justify-center">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.15),_transparent_70%)]" aria-hidden />
          <div className="flex w-full max-w-[360px] items-center justify-center rounded-[24px] border border-amber-500/40 bg-black/40 p-6 shadow-inner shadow-purple-900/50">
            <Image
              src={pledgeFrameSrc}
              alt="Sentient pledge frame"
              width={360}
              height={640}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <p className="mt-6 text-xs tracking-[0.35em] text-amber-200/70">Design by @Emilmehdiyev_</p>
        </div>
      </div>
    </div>
  );
}
