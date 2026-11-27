'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '../../layouts/PublicLayout';
import { Vacancy, recruitmentService } from '../../services/recruitmentService';

export default function JoinUsPage() {
  const [isHiring, setIsHiring] = useState(false);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    recruitmentService.getPublic()
      .then((response) => {
        if (!active) return;
        setIsHiring(response.data.isHiring);
        setVacancies(response.data.vacancies);
        setSelectedVacancy(response.data.vacancies[0]?._id || '');
      })
      .catch((requestError) => {
        console.error('Unable to load current vacancies:', requestError);
        if (active) setError('Unable to load current vacancies. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retryCount]);

  const submitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    form.set('vacancyId', selectedVacancy);
    try {
      const response = await recruitmentService.apply(form);
      setSuccess(response.message);
      formElement.reset();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="bg-champagne-50/50 border-b border-zinc-100 py-16 text-center">
        <div className="mx-auto max-w-3xl space-y-3 px-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-champagne-700">Careers at Iris</span>
          <h1 className="font-serif text-4xl font-bold text-zinc-900 sm:text-5xl">Join Our Team</h1>
          <p className="text-sm leading-relaxed text-zinc-600">Bring your craft, creativity, and care to Iris Hair Cut and Salon.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        {loading ? <p className="text-center text-sm text-zinc-500">Checking opportunities...</p> : error && !vacancies.length ? (
          <div role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 font-semibold underline underline-offset-4">
              Retry
            </button>
          </div>
        ) : !isHiring ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-700">Currently, we are not hiring. Please check back later.</p>
        ) : vacancies.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-700">There are no open vacancies right now. Please check back later.</p>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {vacancies.map((vacancy) => (
                <article key={vacancy._id} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-zinc-900">{vacancy.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-zinc-600">{vacancy.description}</p>
                  <p className="mt-3 text-xs text-zinc-600"><strong>Experience:</strong> {vacancy.experience}</p>
                  {!!vacancy.requirements.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-600">{vacancy.requirements.map((requirement, index) => <li key={`${vacancy._id}-${index}`}>{requirement}</li>)}</ul>}
                  {vacancy.applicationDeadline && <p className="mt-3 text-xs text-zinc-500">Apply by {new Date(vacancy.applicationDeadline).toLocaleDateString()}</p>}
                  <button type="button" onClick={() => { setSelectedVacancy(vacancy._id); document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800">Apply Now</button>
                </article>
              ))}
            </div>
            <form id="application-form" onSubmit={submitApplication} className="mx-auto max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-zinc-900">Application Form</h2>
              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">Position
                <select value={selectedVacancy} onChange={(event) => setSelectedVacancy(event.target.value)} className="mt-1 w-full rounded-md border border-zinc-200 p-2.5 text-sm normal-case" required>
                  {vacancies.map((vacancy) => <option key={vacancy._id} value={vacancy._id}>{vacancy.title}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="name" required maxLength={100} placeholder="Full name" className="rounded-md border border-zinc-200 p-2.5 text-sm" />
                <input name="email" type="email" required placeholder="Email" className="rounded-md border border-zinc-200 p-2.5 text-sm" />
                <input name="phone" required maxLength={30} placeholder="Phone" className="rounded-md border border-zinc-200 p-2.5 text-sm" />
                <input name="skills" placeholder="Skills (comma separated)" className="rounded-md border border-zinc-200 p-2.5 text-sm" />
              </div>
              <textarea name="experience" required maxLength={2000} rows={4} placeholder="Describe your relevant experience" className="w-full rounded-md border border-zinc-200 p-2.5 text-sm" />
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">CV (PDF, DOC, or DOCX; max 10 MB)
                <input name="cv" type="file" accept=".pdf,.doc,.docx" required className="mt-2 block w-full text-sm normal-case" />
              </label>
              <button disabled={submitting} className="rounded-md bg-zinc-900 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Application'}</button>
            </form>
          </>
        )}
      </section>
    </PublicLayout>
  );
}
