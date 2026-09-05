import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, CheckCircle2, Clock, Mail, Save, GraduationCap } from 'lucide-react';
import { submissionService, authService, instructorRequestService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [experience, setExperience] = useState('');
  const [isSubmittingInstructor, setIsSubmittingInstructor] = useState(false);
  const [instructorMsg, setInstructorMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await submissionService.getMySubmissions();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Could not fetch submissions:', err);
      }
    };
    fetchSubmissions();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      await authService.updateProfile({ first_name: firstName, last_name: lastName });
      await refreshUser();
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInstructorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInstructor(true);
    setInstructorMsg(null);
    try {
      await instructorRequestService.submitRequest({ experience_summary: experience });
      setInstructorMsg({ type: 'success', text: 'Application submitted! We will review it shortly.' });
      setExperience('');
    } catch (err: any) {
      setInstructorMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit application.' });
    } finally {
      setIsSubmittingInstructor(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Trainee Profile & Records</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage personal credentials and review complete flag submission history.
        </p>
      </div>

      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="card-saas p-6 text-center md:col-span-1">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-extrabold text-2xl mx-auto mb-4 shadow-md">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">{user?.full_name || user?.username}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">@{user?.username}</p>
          <div className="mt-3">
            <Badge role={user?.primary_role}>{user?.primary_role}</Badge>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[rgba(148,163,184,0.08)] text-left text-xs space-y-2 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Joined {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Update Form */}
        <Card className="card-saas md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={150}
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={150}
                />
              </div>
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email address cannot be changed."
              />
              <Button type="submit" variant="primary" isLoading={isUpdating} leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Become Instructor Form */}
        {user?.primary_role !== 'INSTRUCTOR' && user?.primary_role !== 'SUPER_ADMIN' && (
          <Card className="card-saas md:col-span-3">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Become an Instructor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instructorMsg && (
                <Alert variant={instructorMsg.type} className="mb-4" onClose={() => setInstructorMsg(null)}>
                  {instructorMsg.text}
                </Alert>
              )}
              <form onSubmit={handleInstructorSubmit} className="space-y-4">
                <Input
                  label="Short Summary"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Tell us about your teaching & security experience..."
                  maxLength={100}
                  required
                  helperText="Maximum 100 characters."
                />
                <Button type="submit" variant="primary" isLoading={isSubmittingInstructor}>
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Flag Submissions History */}
      <Card className="card-saas">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Recent Flag Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-[rgba(148,163,184,0.05)]">
            {submissions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No flag attempts recorded yet.</p>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{sub.scenario_title}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Attempt #{sub.attempt_number} • {new Date(sub.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    {sub.is_correct ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        +{sub.awarded_points} PTS
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded border border-rose-200 dark:border-rose-800/40">
                        Incorrect
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
