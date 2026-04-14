import { useState, type SubmitEvent } from 'react';
import { actions } from 'astro:actions';

type Locale = 'es' | 'en';
type FormState = 'idle' | 'sending' | 'success' | 'error' | 'rate-limit';

interface Props {
  locale: Locale;
}

const copy: Record<
  Locale,
  {
    name: string;
    email: string;
    message: string;
    send: string;
    sending: string;
    success: string;
    error: string;
    rateLimit: string;
  }
> = {
  es: {
    name: 'Nombre',
    email: 'Email',
    message: 'Mensaje',
    send: 'Enviar',
    sending: 'Enviando…',
    success: '¡Mensaje enviado! Te respondo dentro de 48hs.',
    error: 'Algo falló. Mandame un mail directo.',
    rateLimit: 'Demasiados intentos. Probá en una hora.',
  },
  en: {
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    sending: 'Sending…',
    success: 'Message sent! I reply within 48 hours.',
    error: 'Something broke. Email me directly.',
    rateLimit: 'Too many tries. Try again in an hour.',
  },
};

export default function ContactForm({ locale }: Props) {
  const [state, setState] = useState<FormState>('idle');
  const t = copy[locale];

  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Capture the form element BEFORE awaiting — React nulls synthetic
    // event fields (including currentTarget) once the handler yields.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    setState('sending');
    const { error } = await actions.sendContact(form);

    if (error) {
      setState(error.code === 'TOO_MANY_REQUESTS' ? 'rate-limit' : 'error');
      return;
    }

    setState('success');
    formEl.reset();
  };

  const inputClass =
    'w-full bg-transparent border border-[var(--color-border)] px-3 py-2 focus:border-[var(--color-accent)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]';
  const labelClass = 'block text-[var(--color-text-dim)] uppercase text-xs mb-1';

  return (
    <form onSubmit={onSubmit} className="space-y-4 font-mono text-sm">
      {/*
        Honeypot field. Hidden from humans via display:none (Tailwind's
        `hidden`), hidden from assistive tech via aria-hidden, and skipped in
        the tab order via tabIndex={-1}. Browsers still submit the value,
        which is validated as an empty string on the server.
      */}
      <input
        type="text"
        name="honeypot"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          {t.name}
        </label>
        <input
          id="contact-name"
          required
          name="name"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          {t.email}
        </label>
        <input
          id="contact-email"
          required
          type="email"
          name="email"
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          {t.message}
        </label>
        <textarea
          id="contact-message"
          required
          name="message"
          rows={6}
          minLength={10}
          maxLength={5000}
          className={`${inputClass} resize-y`}
        />
      </div>

      <button
        disabled={state === 'sending'}
        type="submit"
        className="bg-[var(--color-accent)] text-[var(--color-bg)] px-4 py-2 font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        {state === 'sending' ? t.sending : t.send}
      </button>

      {/* Announce status changes to assistive tech via a live region. */}
      <div role="status" aria-live="polite" className="min-h-[1.5rem]">
        {state === 'success' && <p className="text-[var(--color-accent)]">{t.success}</p>}
        {state === 'error' && <p className="text-red-400">{t.error}</p>}
        {state === 'rate-limit' && <p className="text-yellow-400">{t.rateLimit}</p>}
      </div>
    </form>
  );
}
