'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileForm } from '@/components/forms/profile-form';
import { useAuth } from '@/hooks/use-auth';
import type { CompositeRiskScore } from '@/types/risk';
import type { SpecialNeed } from '@/types/user';

interface ProfileData {
  id: number;
  nickname: string;
  province_code: string;
  residence_type: string;
  special_needs: SpecialNeed[];
  role: string;
  created_at: string;
}

interface StatsData {
  riskScore: number | null;
  totalConsultations: number;
  memberSince: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    riskScore: null,
    totalConsultations: 0,
    memberSince: null,
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (!res.ok) return;
      const data = (await res.json()) as ProfileData;
      setProfile(data);
    } catch {
      // Silently handle
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const riskRes = await fetch(`/api/risk/${user.province_code}`);

      if (riskRes.ok) {
        const riskData = (await riskRes.json()) as CompositeRiskScore;
        setStats((prev) => ({
          ...prev,
          riskScore: riskData.composite_score,
        }));
      }
    } catch {
      // Silently handle
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  // Derive memberSince from profile
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  function handleSaved() {
    fetchProfile();
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your profile and view your risk summary
        </p>
      </div>

      {/* Profile form */}
      <div className="mx-auto w-full max-w-xl">
        {profileLoading ? (
          <div className="flex flex-col gap-4">
            <Card padding="md">
              <div className="flex items-center gap-4">
                <Skeleton width="48px" height="48px" rounded="full" />
                <div className="flex flex-col gap-2">
                  <Skeleton width="120px" height="18px" />
                  <Skeleton width="60px" height="20px" rounded="full" />
                </div>
              </div>
            </Card>
            <Skeleton width="100%" height="56px" rounded="lg" />
            <Skeleton width="100%" height="56px" rounded="lg" />
            <Skeleton width="100%" height="120px" rounded="lg" />
            <Skeleton width="100%" height="40px" rounded="lg" />
          </div>
        ) : profile ? (
          <ProfileForm user={profile} onSaved={handleSaved} />
        ) : (
          <Card padding="md">
            <p className="text-sm text-text-muted text-center">
              Unable to load profile data.
            </p>
          </Card>
        )}
      </div>

      {/* Summary stats */}
      <div className="mx-auto w-full max-w-xl">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
          Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Risk Score */}
          <Card padding="md">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Risk Score
              </span>
              {statsLoading ? (
                <Skeleton width="48px" height="28px" />
              ) : stats.riskScore !== null ? (
                <span
                  className={[
                    'text-2xl font-bold',
                    stats.riskScore < 30
                      ? 'text-accent-green'
                      : stats.riskScore < 60
                        ? 'text-accent-yellow'
                        : 'text-accent-red',
                  ].join(' ')}
                >
                  {stats.riskScore.toFixed(0)}
                </span>
              ) : (
                <span className="text-sm text-text-muted">N/A</span>
              )}
            </div>
          </Card>

          {/* Consultations */}
          <Card padding="md">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Consultations
              </span>
              {statsLoading ? (
                <Skeleton width="32px" height="28px" />
              ) : (
                <span className="text-2xl font-bold text-text-primary">
                  {stats.totalConsultations}
                </span>
              )}
            </div>
          </Card>

          {/* Member Since */}
          <Card padding="md">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Member Since
              </span>
              {profileLoading ? (
                <Skeleton width="100px" height="18px" />
              ) : memberSince ? (
                <span className="text-sm font-medium text-text-primary text-center">
                  {memberSince}
                </span>
              ) : (
                <span className="text-sm text-text-muted">N/A</span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
