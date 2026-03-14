'use client';

import { ChangeEvent, FocusEvent, HTMLInputTypeAttribute, useId } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps {
  label?: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  autoComplete?: string;
}

// ─── Style Constants ──────────────────────────────────────────────────────────

const baseInputStyles = [
  // Layout & Sizing
  'w-full px-3.5 py-2.5',
  // Typography
  'text-sm text-slate-900 placeholder:text-slate-400',
  // Background & Border
  'bg-white border rounded-lg',
  // Transition
  'transition-all duration-150 ease-in-out',
  // Focus
  'focus:outline-none focus:ring-2 focus:ring-offset-0',
  // Disabled
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200',
].join(' ');

const inputStateStyles = {
  default: 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20',
  error:   'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ErrorMessage({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"
    >
      {/* Inline SVG — zero icon-library dependency */}
      <svg
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11z" />
      </svg>
      {message}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  className = '',
  required = false,
  autoComplete,
}: InputProps) {
  // useId gives stable, unique IDs that survive SSR → CSR hydration without mismatch
  const autoId   = useId();
  const inputId  = `input-${autoId}`;
  const errorId  = `error-${autoId}`;

  const hasError = Boolean(error);

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>

      {/* ── Label ─────────────────────────────────────────────────────── */}
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-rose-500" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={[
          baseInputStyles,
          hasError ? inputStateStyles.error : inputStateStyles.default,
        ].join(' ')}
      />

      {/* ── Error Message ─────────────────────────────────────────────── */}
      {hasError && <ErrorMessage id={errorId} message={error!} />}

    </div>
  );
}