import { PublicLayout } from '../../layouts/PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-champagne-700">Iris Hair Cut and Salon</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-zinc-900">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          We use information you provide to manage your salon account, appointments, and requests, and to communicate with you about those services.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Information and use</h2>
          <p className="text-sm leading-7 text-zinc-600">
            Depending on how you use the website, this may include your name, email address, phone number, account details, appointment details, and information you submit in a request. We use it to provide and administer the features you request, support your account, and maintain the security of our services.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Service providers and retention</h2>
          <p className="text-sm leading-7 text-zinc-600">
            Information may be processed by service providers that help operate the website, such as hosting, database, email, messaging, and image-storage providers. We retain information for as long as needed to provide our services, meet operational or legal obligations, and resolve disputes.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Your choices and questions</h2>
          <p className="text-sm leading-7 text-zinc-600">
            Keep your account information accurate and contact the salon if you have a question or request about information associated with your account. We take reasonable steps to protect information, but no online service can guarantee absolute security.
          </p>
        </section>

        <p className="mt-8 text-xs text-zinc-500">
          This notice describes the website’s current general practices and does not replace any rights or obligations under applicable law.
        </p>
      </article>
    </PublicLayout>
  );
}
