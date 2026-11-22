'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { JobApplication, Vacancy, recruitmentService } from '../../../services/recruitmentService';

export default function SubAdminRecruitmentPage() {
  const [isHiring, setIsHiring] = useState(false);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([recruitmentService.getSettings(), recruitmentService.getVacancies(), recruitmentService.getApplications()])
      .then(([settings, vacancyResponse, applicationResponse]) => {
        setIsHiring(settings.data.isHiring);
        setVacancies(vacancyResponse.data);
        setApplications(applicationResponse.data);
      })
      .catch(() => setError('Unable to load recruitment information.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['sub_admin']}>
      <DashboardLayout role="sub_admin" title="Recruitment Information" subtitle="View vacancies and applications">
        {loading ? <p className="text-sm text-zinc-500">Loading recruitment records...</p> : error ? <p className="text-sm text-rose-600">{error}</p> : (
          <div className="space-y-6">
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="font-serif text-lg font-bold">Hiring is {isHiring ? 'ON' : 'OFF'}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {vacancies.map((vacancy) => <article key={vacancy._id} className="rounded-lg bg-zinc-50 p-4">
                  <h3 className="font-semibold">{vacancy.title}{!vacancy.isActive && <span className="text-xs text-zinc-400"> (Inactive)</span>}</h3>
                  <p className="mt-1 whitespace-pre-line text-xs text-zinc-600">{vacancy.description}</p>
                  <p className="mt-2 text-xs text-zinc-500">{vacancy.experience}</p>
                </article>)}
                {!vacancies.length && <p className="text-sm text-zinc-500">No vacancies found.</p>}
              </div>
            </section>
            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <h2 className="border-b border-zinc-100 p-5 font-serif text-lg font-bold">Applications</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="bg-zinc-50 text-[10px] uppercase text-zinc-500"><tr><th className="p-4">Applicant</th><th className="p-4">Position</th><th className="p-4">Experience</th><th className="p-4">CV</th><th className="p-4">Status</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100">
                    {applications.map((application) => <tr key={application._id}>
                      <td className="p-4"><strong>{application.name}</strong><span className="block text-zinc-500">{application.email} · {application.phone}</span></td>
                      <td className="p-4">{typeof application.vacancy === 'string' ? 'Vacancy' : application.vacancy.title}</td>
                      <td className="max-w-xs p-4">{application.experience}</td>
                      <td className="p-4"><a href={application.cvUrl} target="_blank" rel="noreferrer" className="underline">View CV</a></td>
                      <td className="p-4 capitalize">{application.status}</td>
                    </tr>)}
                    {!applications.length && <tr><td colSpan={5} className="p-5 text-zinc-500">No applications received.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
