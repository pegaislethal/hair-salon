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
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-champagne-300 border-t-zinc-900 rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Checking available career opportunities...</p>
          </div>
        ) : error && !vacancies.length ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <p className="text-xs text-rose-600">Please check your connection and try again.</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-800"
            >
              Retry Loading
            </button>
          </div>
        ) : !isHiring ? (
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-800 flex items-center justify-center mx-auto text-xl font-serif">
              ✦
            </div>
            <h2 className="font-serif text-2xl font-bold text-zinc-900">Applications Currently Closed</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We do not have any open positions at this moment. Our team evaluates talent regularly, so please follow our social channels or check back soon for future openings.
            </p>
          </div>
        ) : vacancies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto text-xl font-serif">
              ✦
            </div>
            <h2 className="font-serif text-2xl font-bold text-zinc-900">No Open Vacancies Right Now</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We are in the process of updating our hiring requirements. Please check back shortly for new styling and salon roles.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {vacancies.map((vacancy) => (
                <article key={vacancy._id} className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-champagne-300 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block px-2.5 py-1 rounded bg-champagne-100 text-champagne-900 text-[10px] font-semibold uppercase tracking-wider">
                        Active Opening
                      </span>
                      {vacancy.applicationDeadline && (
                        <span className="text-xs text-zinc-500">
                          Deadline: {new Date(vacancy.applicationDeadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-zinc-900">{vacancy.title}</h2>
                      <p className="mt-2 whitespace-pre-line text-sm text-zinc-600 leading-relaxed">{vacancy.description}</p>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 space-y-2 text-xs">
                      <p className="text-zinc-700"><strong>Experience:</strong> {vacancy.experience}</p>
                      {!!vacancy.requirements.length && (
                        <div>
                          <strong className="block text-zinc-700 mb-1">Key Requirements:</strong>
                          <ul className="list-disc space-y-1 pl-5 text-zinc-600">
                            {vacancy.requirements.map((requirement, index) => (
                              <li key={`${vacancy._id}-${index}`}>{requirement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVacancy(vacancy._id);
                      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-6 w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    Apply for this Position
                  </button>
                </article>
              ))}
            </div>
            <form id="application-form" onSubmit={submitApplication} className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-10 shadow-lg">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-champagne-800">Direct Application</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">Submit Your Details</h2>
                <p className="text-xs text-zinc-500 mt-1">Fill out the form below and attach your CV. Our management team will review your profile.</p>
              </div>
              {error && <p role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">{error}</p>}
              {success && <p role="status" className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">{success}</p>}
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">Position Applying For
                <select value={selectedVacancy} onChange={(event) => setSelectedVacancy(event.target.value)} className="mt-1 w-full rounded-md border border-zinc-200 p-2.5 text-sm normal-case focus:outline-none focus:ring-1 focus:ring-zinc-900" required>
                  {vacancies.map((vacancy) => <option key={vacancy._id} value={vacancy._id}>{vacancy.title}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="name" required maxLength={100} placeholder="Full name *" className="rounded-md border border-zinc-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <input name="email" type="email" required placeholder="Email address *" className="rounded-md border border-zinc-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <input name="phone" required maxLength={30} placeholder="Phone number *" className="rounded-md border border-zinc-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <input name="skills" placeholder="Skills (e.g. Fades, Coloring, Styling)" className="rounded-md border border-zinc-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <textarea name="experience" required maxLength={2000} rows={4} placeholder="Brief summary of your relevant experience *" className="w-full rounded-md border border-zinc-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">Resume / CV (PDF, DOC, or DOCX; max 10 MB) *</label>
                <input name="cv" type="file" accept=".pdf,.doc,.docx" required className="mt-1 block w-full text-xs text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 cursor-pointer" />
              </div>
              <button disabled={submitting} className="w-full sm:w-auto rounded-lg bg-zinc-900 px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm">
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </section>
    </PublicLayout>
  );
}
