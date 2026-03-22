'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEmergencyPlan } from '@/hooks/use-emergency-plan';
import type { HouseholdMember, EmergencyContact, MeetingPoint } from '@/hooks/use-emergency-plan';
import { MeetingPointPicker } from './meeting-point-picker';
import { KitBuilder } from './kit-builder';

const STEPS = [
  { key: 'household', label: 'Household' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'meeting', label: 'Meeting Points' },
  { key: 'kit', label: 'Emergency Kit' },
  { key: 'review', label: 'Review' },
];

export function PlanWizard() {
  const { plan, isLoading, error, updatePlan, kitContent, isStreamingKit, streamKitRecs } = useEmergencyPlan();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [members, setMembers] = useState<HouseholdMember[]>(plan?.household_members ?? []);
  const [contacts, setContacts] = useState<EmergencyContact[]>(plan?.communication_plan ?? []);
  const [points, setPoints] = useState<MeetingPoint[]>(plan?.meeting_points ?? []);
  const [evacNotes, setEvacNotes] = useState(plan?.evacuation_notes ?? '');

  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync local state when plan loads from backend
  useEffect(() => {
    if (plan) {
      setMembers(plan.household_members ?? []);
      setContacts(plan.communication_plan ?? []);
      setPoints(plan.meeting_points ?? []);
      setEvacNotes(plan.evacuation_notes ?? '');
    }
  }, [plan]);

  async function saveAndNext() {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updatePlan({
        household_members: members,
        communication_plan: contacts,
        meeting_points: points,
        evacuation_notes: evacNotes || null,
      });
      if (result) {
        if (step < STEPS.length - 1) setStep(step + 1);
      } else {
        setSaveError(error || 'Could not save — please sign in');
      }
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card variant="glass" padding="lg">
        <div className="flex items-center justify-center h-40 text-text-muted">
          Loading your plan...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={[
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer',
                i === step
                  ? 'bg-accent-green text-black'
                  : i < step
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-white/5 text-text-muted',
              ].join(' ')}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${i < step ? 'bg-accent-green/30' : 'bg-white/5'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-text-muted">{STEPS[step].label}</span>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <HouseholdStep members={members} setMembers={setMembers} />
          )}
          {step === 1 && (
            <ContactsStep contacts={contacts} setContacts={setContacts} />
          )}
          {step === 2 && (
            <MeetingPointPicker points={points} setPoints={setPoints} />
          )}
          {step === 3 && (
            <KitBuilder
              kitContent={kitContent}
              isStreaming={isStreamingKit}
              onGenerate={streamKitRecs}
              evacNotes={evacNotes}
              onEvacNotesChange={setEvacNotes}
            />
          )}
          {step === 4 && (
            <ReviewStep
              members={members}
              contacts={contacts}
              points={points}
              evacNotes={evacNotes}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error message */}
      {saveError && (
        <div className="px-4 py-2 rounded-xl bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
          {saveError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={saveAndNext}
          disabled={saving}
        >
          {saving ? 'Saving...' : step === STEPS.length - 1 ? 'Save Plan' : 'Next'}
          {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}

function HouseholdStep({
  members,
  setMembers,
}: {
  members: HouseholdMember[];
  setMembers: (m: HouseholdMember[]) => void;
}) {
  function addMember() {
    setMembers([...members, { name: '', age: null, needs: null, medications: null }]);
  }

  function removeMember(idx: number) {
    setMembers(members.filter((_, i) => i !== idx));
  }

  function updateMember(idx: number, field: keyof HouseholdMember, value: string | number | null) {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  }

  return (
    <Card variant="glass" padding="md">
      <h3 className="text-lg font-semibold text-text-primary mb-3">Household Members</h3>
      <p className="text-sm text-text-muted mb-4">Add everyone who lives in your home so we can personalize your plan.</p>

      <div className="flex flex-col gap-3">
        {members.map((m, i) => (
          <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} />
              <Input placeholder="Age" type="number" value={m.age ?? ''} onChange={(e) => updateMember(i, 'age', e.target.value ? parseInt(e.target.value) : null)} />
              <Input placeholder="Special needs" value={m.needs ?? ''} onChange={(e) => updateMember(i, 'needs', e.target.value || null)} />
              <Input placeholder="Medications" value={m.medications ?? ''} onChange={(e) => updateMember(i, 'medications', e.target.value || null)} />
            </div>
            <button type="button" onClick={() => removeMember(i)} className="p-2 text-text-muted hover:text-accent-red transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="mt-3 flex items-center gap-1.5 text-sm text-accent-green hover:text-accent-green/80 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add member
      </button>
    </Card>
  );
}

function ContactsStep({
  contacts,
  setContacts,
}: {
  contacts: EmergencyContact[];
  setContacts: (c: EmergencyContact[]) => void;
}) {
  function addContact() {
    setContacts([...contacts, { name: '', phone: '', role: null, priority: contacts.length + 1 }]);
  }

  function removeContact(idx: number) {
    setContacts(contacts.filter((_, i) => i !== idx));
  }

  function updateContact(idx: number, field: keyof EmergencyContact, value: string | number | null) {
    const updated = [...contacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setContacts(updated);
  }

  return (
    <Card variant="glass" padding="md">
      <h3 className="text-lg font-semibold text-text-primary mb-3">Emergency Contacts</h3>
      <p className="text-sm text-text-muted mb-4">People to call during an emergency, in priority order.</p>

      <div className="flex flex-col gap-3">
        {contacts.map((c, i) => (
          <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input placeholder="Name" value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} />
              <Input placeholder="Phone" value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} />
              <Input placeholder="Role (e.g. neighbor)" value={c.role ?? ''} onChange={(e) => updateContact(i, 'role', e.target.value || null)} />
            </div>
            <button type="button" onClick={() => removeContact(i)} className="p-2 text-text-muted hover:text-accent-red transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addContact}
        className="mt-3 flex items-center gap-1.5 text-sm text-accent-green hover:text-accent-green/80 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add contact
      </button>
    </Card>
  );
}

function ReviewStep({
  members,
  contacts,
  points,
  evacNotes,
}: {
  members: HouseholdMember[];
  contacts: EmergencyContact[];
  points: MeetingPoint[];
  evacNotes: string;
}) {
  return (
    <Card variant="glass" padding="md">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Review Your Plan</h3>

      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-1">Household ({members.length})</h4>
          {members.length === 0 ? (
            <p className="text-xs text-text-muted">No members added</p>
          ) : (
            <ul className="text-sm text-text-primary">
              {members.map((m, i) => (
                <li key={i}>{m.name}{m.age ? `, ${m.age}` : ''}{m.needs ? ` — ${m.needs}` : ''}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-1">Contacts ({contacts.length})</h4>
          {contacts.length === 0 ? (
            <p className="text-xs text-text-muted">No contacts added</p>
          ) : (
            <ul className="text-sm text-text-primary">
              {contacts.map((c, i) => (
                <li key={i}>{c.name}: {c.phone}{c.role ? ` (${c.role})` : ''}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-1">Meeting Points ({points.length})</h4>
          {points.length === 0 ? (
            <p className="text-xs text-text-muted">No meeting points set</p>
          ) : (
            <ul className="text-sm text-text-primary">
              {points.map((p, i) => (
                <li key={i}>{p.name}{p.address ? ` — ${p.address}` : ''}</li>
              ))}
            </ul>
          )}
        </div>

        {evacNotes && (
          <div>
            <h4 className="text-sm font-semibold text-text-secondary mb-1">Evacuation Notes</h4>
            <p className="text-sm text-text-primary">{evacNotes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
