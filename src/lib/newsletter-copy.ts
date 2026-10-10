import type { Locale } from './i18n';

/** Localized copy for the confirmation email and the on-demand newsletter pages. */
export interface EmailCopy {
  subject: string;
  text: (url: string) => string;
  html: (url: string) => string;
}

export const emailCopy: Record<Locale, EmailCopy> = {
  es: {
    subject: 'Confirma tu suscripción',
    text: (url) =>
      `Hola,\n\nRecibimos una solicitud para suscribir este correo al newsletter de Facundo Pascale.\nConfirma tu suscripción abriendo este enlace (vale por 48 horas):\n\n${url}\n\nSi no fuiste tú, ignora este mensaje: no se guardó ninguna dirección.\n\n— Facundo`,
    html: (url) =>
      `<p>Hola,</p><p>Recibimos una solicitud para suscribir este correo al newsletter de Facundo Pascale.</p><p><a href="${url}">Confirmar suscripción</a> (el enlace vale por 48 horas).</p><p>Si no fuiste tú, ignora este mensaje: no se guardó ninguna dirección.</p><p>— Facundo</p>`,
  },
  en: {
    subject: 'Confirm your subscription',
    text: (url) =>
      `Hi,\n\nWe received a request to subscribe this address to Facundo Pascale's newsletter.\nConfirm your subscription by opening this link (valid for 48 hours):\n\n${url}\n\nIf this was not you, ignore this message: no address has been stored.\n\n— Facundo`,
    html: (url) =>
      `<p>Hi,</p><p>We received a request to subscribe this address to Facundo Pascale's newsletter.</p><p><a href="${url}">Confirm subscription</a> (the link is valid for 48 hours).</p><p>If this was not you, ignore this message: no address has been stored.</p><p>— Facundo</p>`,
  },
};

export interface PageCopy {
  title: string;
  heading: string;
  body: string;
  /** Label for the link back to the home newsletter section. */
  back: string;
}

export interface NewsletterPages {
  sent: PageCopy;
  invalidEmail: PageCopy;
  rateLimited: PageCopy;
  unavailable: PageCopy;
  confirmed: PageCopy;
  invalidToken: PageCopy;
}

export const pageCopy: Record<Locale, NewsletterPages> = {
  es: {
    sent: {
      title: 'Revisa tu correo',
      heading: 'Revisa tu correo',
      body: 'Si la dirección es válida, te enviamos un enlace para confirmar la suscripción. Vale por 48 horas.',
      back: 'Volver al inicio',
    },
    invalidEmail: {
      title: 'Correo no válido',
      heading: 'Revisa la dirección',
      body: 'No pudimos leer ese correo. Verifica que esté bien escrito e inténtalo de nuevo.',
      back: 'Volver al formulario',
    },
    rateLimited: {
      title: 'Demasiados intentos',
      heading: 'Demasiados intentos',
      body: 'Recibimos muchas solicitudes desde tu conexión. Inténtalo de nuevo en un rato.',
      back: 'Volver al inicio',
    },
    unavailable: {
      title: 'Aún no disponible',
      heading: 'Aún no disponible',
      body: 'La suscripción todavía no está disponible. Vuelve a intentarlo más tarde.',
      back: 'Volver al inicio',
    },
    confirmed: {
      title: 'Suscripción confirmada',
      heading: 'Listo, estás dentro',
      body: 'Tu suscripción quedó confirmada. Puedes darte de baja cuando quieras desde cualquier correo.',
      back: 'Volver al inicio',
    },
    invalidToken: {
      title: 'Enlace no válido',
      heading: 'Enlace no válido o vencido',
      body: 'Este enlace de confirmación no es válido o ya venció. Suscríbete de nuevo para recibir uno nuevo.',
      back: 'Suscribirme de nuevo',
    },
  },
  en: {
    sent: {
      title: 'Check your inbox',
      heading: 'Check your inbox',
      body: 'If the address is valid, we sent you a link to confirm your subscription. It is valid for 48 hours.',
      back: 'Back to home',
    },
    invalidEmail: {
      title: 'Invalid email',
      heading: 'Check the address',
      body: 'We could not read that email. Make sure it is spelled correctly and try again.',
      back: 'Back to the form',
    },
    rateLimited: {
      title: 'Too many attempts',
      heading: 'Too many attempts',
      body: 'We received many requests from your connection. Please try again in a while.',
      back: 'Back to home',
    },
    unavailable: {
      title: 'Not available yet',
      heading: 'Not available yet',
      body: 'Subscriptions are not available right now. Please try again later.',
      back: 'Back to home',
    },
    confirmed: {
      title: 'Subscription confirmed',
      heading: "You're in",
      body: 'Your subscription is confirmed. You can unsubscribe anytime from any email.',
      back: 'Back to home',
    },
    invalidToken: {
      title: 'Invalid link',
      heading: 'Invalid or expired link',
      body: 'This confirmation link is not valid or has expired. Subscribe again to get a new one.',
      back: 'Subscribe again',
    },
  },
};
