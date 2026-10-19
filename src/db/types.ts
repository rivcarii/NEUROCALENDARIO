import type { z } from 'zod';
import type { BaseFields } from './entities';
import type {
  appointmentInput, documentInput, episodeInput, examInput, intakeInput,
  medicationInput, noteInput, scheduleInput,
} from '../domain/schemas';

export type Episode = BaseFields & z.output<typeof episodeInput>;
export type Medication = BaseFields & z.output<typeof medicationInput>;
export type Schedule = BaseFields & z.output<typeof scheduleInput>;
export type Intake = BaseFields & z.output<typeof intakeInput>;
export type Appointment = BaseFields & z.output<typeof appointmentInput>;
export type Exam = BaseFields & z.output<typeof examInput>;
export type DocumentRecord = BaseFields & z.output<typeof documentInput>;
export type Note = BaseFields & z.output<typeof noteInput>;

export interface EntityMap {
  episode: Episode;
  medication: Medication;
  schedule: Schedule;
  intake: Intake;
  appointment: Appointment;
  exam: Exam;
  document: DocumentRecord;
  note: Note;
}

export type AccessLevel = 'read' | 'write' | 'admin';

export interface Account {
  id: string;
  displayName: string;
  role: 'owner' | 'family';
}

export interface Profile {
  id: string;
  ownerAccountId: string;
  displayName: string;
  relationship: string;
  birthYear: number | null;
  isPrimary: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRow {
  id: string;
  profileId: string;
  accountId: string;
  level: AccessLevel;
  revokedAt: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  accountId: string;
  profileId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string;
}
