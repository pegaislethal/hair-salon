import Link from 'next/link';
import { PublicLayout } from '../../layouts/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-champagne-700">Iris Hair Cut and Salon</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-zinc-900">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          These terms apply when you browse or use the Iris Hair Cut and Salon website and its account, appointment, and contact features.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Accounts and website use</h2>
          <p className="text-sm leading-7 text-zinc-600">
            Provide accurate information when creating or updating an account and keep your sign-in details secure. Use the website lawfully and do not interfere with its operation, access another person’s account, or submit misleading or harmful content.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Appointments and services</h2>
          <p className="text-sm leading-7 text-zinc-600">
            An online appointment request is subject to confirmation by the salon. Service availability, descriptions, and prices may change; the salon will confirm the applicable details when arranging your appointment. Please use the booking features or contact the salon to ask about changing or cancelling a booking.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Website content and availability</h2>
          <p className="text-sm leading-7 text-zinc-600">
            Website content is provided to describe the salon and its services. We aim to keep the website available and accurate but cannot guarantee uninterrupted access or that every listing is current at all times. We may update website features or content as our services change.
          </p>
        </section>

        <p className="mt-8 text-sm leading-7 text-zinc-600">
          If you have a question about these terms, please use the details on our <Link href="/contact" className="font-medium text-champagne-800 underline">Contact page</Link>.
        </p>
      </article>
    </PublicLayout>
  );
}
