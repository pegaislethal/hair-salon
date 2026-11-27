'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { JobApplication, Vacancy, recruitmentService } from '../../../services/recruitmentService';

export default function AdminRecruitmentPage() {
  const [isHiring, setIsHiring] = useState(false);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [experience, setExperience] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [settings, vacancyResponse, applicationResponse] = await Promise.all([
        recruitmentService.getSettings(),
        recruitmentService.getVacancies(),
        recruitmentService.getApplications(),
      ]);
      setIsHiring(settings.data.isHiring);
      setVacancies(vacancyResponse.data);
      setApplications(applicationResponse.data);
      setError('');
    } catch {
      setError('Unable to load recruitment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setRequirements('');
    setExperience('');
    setDeadline('');
  };

  const editVacancy = (vacancy: Vacancy) => {
    setEditing(vacancy);
    setTitle(vacancy.title);
    setDescription(vacancy.description);
    setRequirements(vacancy.requirements.join('\n'));
    setExperience(vacancy.experience);
    setDeadline(vacancy.applicationDeadline?.slice(0, 10) || '');
  };

  const saveVacancy = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await recruitmentService.saveVacancy({
        _id: editing?._id,
        title,
        description,
        requirements: requirements.split('\n').map((line) => line.trim()).filter(Boolean),
        experience,
        isActive: editing?.isActive,
        applicationDeadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : undefined,
      });
      resetForm();
      await load();
    } catch {
      setError('Unable to save vacancy. Check the form and try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleHiring = async () => {
    setError('');
    try {
      await recruitmentService.updateSettings(!isHiring);
      setIsHiring(!isHiring);
    } catch {
      setError('Unable to update hiring status.');
    }
  };

  const deactivate = async (vacancyId: string) => {
    try {
      await recruitmentService.deactivateVacancy(vacancyId);
      await load();
    } catch {
      setError('Unable to deactivate this vacancy.');
    }
  };

  const decide = async (applicationId: string, status: 'shortlisted' | 'accepted' | 'rejected') => {
    try {
      await recruitmentService.decide(applicationId, status);
      await load();
    } catch {
      setError('Unable to record the application decision.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout role="super_admin" title="Recruitment" subtitle="Control hiring, publish vacancies, and review applicants">
        <div className="space-y-8">
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <section className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl font-bold">Hiring Status</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${isHiring ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${isHiring ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                  {isHiring ? 'Currently Hiring (Live)' : 'Hiring Closed'}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {isHiring
                  ? 'Your active vacancies are currently visible on the public "Join Our Team" page.'
                  : 'Hiring is currently OFF. The public "Join Our Team" page displays a closed-hiring notice.'}
              </p>
            </div>
            <Button
              onClick={toggleHiring}
              className={isHiring ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}
            >
              {isHiring ? 'Turn Hiring Off' : 'Turn Hiring On'}
            </Button>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 p-5"><h2 className="font-serif text-xl font-bold">Vacancies</h2></div>
              {loading ? <p className="p-5 text-sm text-zinc-500">Loading vacancies...</p> : vacancies.length ? (
                <div className="divide-y divide-zinc-100">
                  {vacancies.map((vacancy) => <article key={vacancy._id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row">
                    <div>
                      <h3 className="font-semibold">{vacancy.title} {!vacancy.isActive && <span className="text-xs text-zinc-400">(Inactive)</span>}</h3>
                      <p className="mt-1 text-xs text-zinc-500">{vacancy.experience}</p>
                      {vacancy.applicationDeadline && <p className="mt-1 text-xs text-zinc-500">Deadline: {new Date(vacancy.applicationDeadline).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editVacancy(vacancy)}>Edit</Button>
                      {vacancy.isActive && <Button size="sm" variant="outline" onClick={() => deactivate(vacancy._id)}>Deactivate</Button>}
                    </div>
                  </article>)}
                </div>
              ) : <p className="p-5 text-sm text-zinc-500">No vacancies have been created.</p>}
            </div>

            <form onSubmit={saveVacancy} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="font-serif text-xl font-bold">{editing ? 'Edit Vacancy' : 'Create Vacancy'}</h2>
              <Input label="Job Title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">Description
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} required className="mt-1 w-full rounded-md border border-zinc-200 p-2.5 text-sm normal-case" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">Requirements (one per line)
                <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={3} className="mt-1 w-full rounded-md border border-zinc-200 p-2.5 text-sm normal-case" />
              </label>
              <Input label="Experience" value={experience} onChange={(event) => setExperience(event.target.value)} required maxLength={300} />
              <Input label="Application Deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              {editing && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> Vacancy is active</label>}
              <div className="flex gap-2">
                <Button type="submit" isLoading={saving}>{editing ? 'Save Vacancy' : 'Create Vacancy'}</Button>
                {editing && <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>}
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 p-5"><h2 className="font-serif text-xl font-bold">Applications</h2></div>
            {loading ? <p className="p-5 text-sm text-zinc-500">Loading applications...</p> : applications.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-zinc-50 text-[10px] uppercase text-zinc-500"><tr><th className="p-4">Applicant</th><th className="p-4">Position</th><th className="p-4">Experience & Skills</th><th className="p-4">CV</th><th className="p-4">Status</th><th className="p-4">Decision</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100">
                    {applications.map((application) => <tr key={application._id}>
                      <td className="p-4"><strong>{application.name}</strong><span className="block text-zinc-500">{application.email}</span><span className="text-zinc-500">{application.phone}</span></td>
                      <td className="p-4">{typeof application.vacancy === 'string' ? 'Vacancy' : application.vacancy.title}</td>
                      <td className="max-w-xs p-4"><p>{application.experience}</p><p className="mt-1 text-zinc-500">{application.skills.join(', ')}</p></td>
                      <td className="p-4"><a href={application.cvUrl} target="_blank" rel="noreferrer" className="font-semibold underline">View CV</a></td>
                      <td className="p-4 capitalize">{application.status}</td>
                      <td className="p-4">{application.status === 'pending' || application.status === 'shortlisted' ? <div className="flex flex-wrap gap-2">{application.status === 'pending' && <Button size="sm" variant="outline" onClick={() => decide(application._id, 'shortlisted')}>Shortlist</Button>}<Button size="sm" onClick={() => decide(application._id, 'accepted')}>Accept</Button><Button size="sm" variant="outline" onClick={() => decide(application._id, 'rejected')}>Reject</Button></div> : '—'}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            ) : <p className="p-5 text-sm text-zinc-500">No applications received yet.</p>}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
