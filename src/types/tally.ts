export type TallyParticipantsMode = "one_per_submission" | "from_field";

export interface TallyFormFieldConfig {
  questionId: string;
  label: string;
  type?: string;
}

export interface TallyFormConfig {
  id: string;
  name: string;
  enabled: boolean;
  allowedFields: TallyFormFieldConfig[];
  primaryFieldId?: string;
  secondaryFieldId?: string;
  participantsMode?: TallyParticipantsMode;
  participantsFieldId?: string;
}

export interface TallyApiFormSummary {
  id: string;
  name: string;
  status?: string;
  numberOfSubmissions?: number;
  updatedAt?: string;
}

export interface TallyApiQuestion {
  id: string;
  title: string;
  type: string;
}

export interface StoredTallySubmission {
  submissionId: string;
  respondentId?: string;
  submittedAt: string;
  participantsCount: number;
  /** Map of questionId -> sanitized display string (ONLY allowedFields) */
  fields: Record<string, string>;
}

export interface StoredTallySubmissionsFile {
  formId: string;
  syncedAt: string;
  totalSubmissions: number;
  totalParticipants: number;
  fieldLabels: Record<string, string>;
  submissions: StoredTallySubmission[];
}

export interface CheckinRecord {
  checkedIn: boolean;
  checkedInCount?: number;
  updatedAt: string;
  checkedInBy?: string;
}

export interface ManualCheckinGuest {
  id: string;
  name: string;
  participantsCount: number;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface StoredCheckinsFile {
  formId: string;
  updatedAt: string;
  checkins: Record<string, CheckinRecord>;
  manualGuests?: ManualCheckinGuest[];
}

export interface MergedTallySubmission extends StoredTallySubmission {
  checkedIn: boolean;
  checkedInCount: number;
  checkedInAt?: string;
  checkedInBy?: string;
  isManual?: boolean;
}

export interface CheckinBatchItem {
  submissionId: string;
  checkedIn: boolean;
  checkedInCount?: number;
  updatedAt: string;
  checkedInBy?: string;
}

export interface TallySubmissionsResponse {
  formId: string;
  syncedAt: string | null;
  totalSubmissions: number;
  totalParticipants: number;
  checkedInSubmissions: number;
  checkedInParticipants: number;
  fieldLabels: Record<string, string>;
  submissions: MergedTallySubmission[];
  storage: "vercel-blob" | "local-file";
}

