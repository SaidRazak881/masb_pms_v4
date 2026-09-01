/**
 * governance.ts — Domain Governance Lock & Request Unlock
 * (Langkah 5, TPMS MIMOS Academy).
 *
 * Modul ini mengandungi LOGIK TULEN sahaja (tiada I/O, tiada React) supaya
 * boleh digunakan bersama oleh Server Component, Server Action, route
 * handler dan Client Component.
 *
 * Prinsip tadbir urus (governance):
 *
 *   1. Program yang telah dikunci (`locked = true`) adalah rekod AUDIT.
 *      Tiada sesiapa — termasuk Admin — boleh menyunting terus.
 *   2. Untuk menyunting, pengguna mesti menghantar *Permohonan Buka Kunci*
 *      (unlock request) dengan justifikasi bertulis.
 *   3. Permohonan diluluskan oleh peranan berautoriti (Manager/Admin) dan
 *      tidak boleh diluluskan sendiri oleh pemohon (no self-approval).
 *   4. Kelulusan memberi TETINGKAP SUNTINGAN bertempoh (default 24 jam).
 *      Selepas tamat, program mengunci semula secara automatik.
 *   5. Setiap peralihan keadaan mesti meninggalkan jejak audit.
 */

/* ====================== Peranan & keizinan ====================== */

export type GovernanceRole =
  | "viewer"
  | "executive"
  | "manager"
  | "admin"
  | "head_governance";

/** Susunan hierarki peranan — indeks lebih tinggi = lebih berkuasa. */
const ROLE_RANK: Record<GovernanceRole, number> = {
  viewer: 0,
  executive: 1,
  manager: 2,
  admin: 3,
  head_governance: 3,
};

/** Peranan yang dibenarkan MELULUS/MENOLAK permohonan buka kunci. */
export const APPROVER_ROLES: GovernanceRole[] = [
  "manager",
  "admin",
  "head_governance",
];

/** Peranan yang dibenarkan MENGUNCI program secara manual. */
export const LOCKER_ROLES: GovernanceRole[] = [
  "manager",
  "admin",
  "head_governance",
];

/** Label paparan Bahasa Melayu bagi setiap peranan. */
export const ROLE_LABEL: Record<GovernanceRole, string> = {
  viewer: "Pemerhati",
  executive: "Eksekutif",
  manager: "Pengurus",
  admin: "Pentadbir",
  head_governance: "Head Governance",
};

export function hasRoleAtLeast(
  role: GovernanceRole,
  minimum: GovernanceRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canApproveUnlock(role: GovernanceRole): boolean {
  return APPROVER_ROLES.includes(role);
}

export function canLockProgramme(role: GovernanceRole): boolean {
  return LOCKER_ROLES.includes(role);
}

/* ====================== Keadaan & entiti ====================== */

export type UnlockRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type LockReason =
  | "programme_completed"
  | "financial_closed"
  | "audit_period"
  | "manual";

export const LOCK_REASON_LABEL: Record<LockReason, string> = {
  programme_completed: "Program telah tamat",
  financial_closed: "Akaun kewangan ditutup",
  audit_period: "Tempoh audit",
  manual: "Dikunci secara manual",
};

export const UNLOCK_STATUS_LABEL: Record<UnlockRequestStatus, string> = {
  pending: "Menunggu Kelulusan",
  approved: "Diluluskan",
  rejected: "Ditolak",
  expired: "Tamat Tempoh",
  cancelled: "Dibatalkan",
};

/** Varian lencana UI bagi setiap status (selari dengan components/ui/badge). */
export const UNLOCK_STATUS_VARIANT: Record<
  UnlockRequestStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  expired: "secondary",
  cancelled: "outline",
};

export interface UnlockRequest {
  id: string;
  programmeId: string;
  programmeCode?: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  /** Justifikasi bertulis — wajib. */
  reason: string;
  /** Bidang/tab yang ingin disunting, cth. ["financial", "participants"]. */
  scope: string[];
  /** Tempoh tetingkap suntingan yang dipohon, dalam jam. */
  requestedHours: number;
  status: UnlockRequestStatus;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  /** Masa tamat tetingkap suntingan (hanya jika diluluskan). */
  unlockExpiresAt?: string | null;
}

export interface ProgrammeLockState {
  programmeId: string;
  locked: boolean;
  lockReason: LockReason;
  lockedBy?: string | null;
  lockedByName?: string | null;
  lockedAt?: string | null;
  /** Tetingkap suntingan aktif hasil kelulusan, jika ada. */
  unlockExpiresAt?: string | null;
}

/* ====================== Parameter tadbir urus ====================== */

/** Tempoh tetingkap suntingan lalai (jam). */
export const DEFAULT_UNLOCK_HOURS = 24;

/** Tempoh minimum & maksimum yang boleh dipohon (jam). */
export const MIN_UNLOCK_HOURS = 1;
export const MAX_UNLOCK_HOURS = 72;

/** Panjang minimum & maksimum justifikasi. */
export const MIN_REASON_LENGTH = 20;
export const MAX_REASON_LENGTH = 1000;

/** Skop suntingan yang boleh dipohon. */
export const UNLOCK_SCOPES = [
  { value: "overview", label: "Maklumat Am" },
  { value: "financial", label: "Kewangan" },
  { value: "participants", label: "Peserta" },
  { value: "costs", label: "Kos" },
  { value: "documents", label: "Dokumen" },
] as const;

export type UnlockScope = (typeof UNLOCK_SCOPES)[number]["value"];

const VALID_SCOPES = new Set<string>(UNLOCK_SCOPES.map((s) => s.value));

export function scopeLabel(value: string): string {
  return UNLOCK_SCOPES.find((s) => s.value === value)?.label ?? value;
}

/* ====================== Pengesahan input ====================== */

export interface UnlockRequestInput {
  programmeId: string;
  reason: string;
  scope: string[];
  requestedHours: number;
}

export interface ValidationResult {
  valid: boolean;
  /** Ralat mengikut medan, untuk dipaparkan di sebelah input borang. */
  errors: Partial<Record<keyof UnlockRequestInput, string>>;
}

/**
 * Sahkan permohonan buka kunci. Digunakan di KEDUA-DUA klien (maklum balas
 * segera) dan pelayan (sempadan keselamatan sebenar).
 */
export function validateUnlockRequest(
  input: Partial<UnlockRequestInput>,
): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!input.programmeId || !input.programmeId.trim()) {
    errors.programmeId = "ID program tidak sah.";
  }

  const reason = (input.reason ?? "").trim();
  if (reason.length < MIN_REASON_LENGTH) {
    errors.reason = `Justifikasi terlalu ringkas — sekurang-kurangnya ${MIN_REASON_LENGTH} aksara (kini ${reason.length}).`;
  } else if (reason.length > MAX_REASON_LENGTH) {
    errors.reason = `Justifikasi terlalu panjang — maksimum ${MAX_REASON_LENGTH} aksara.`;
  }

  const scope = input.scope ?? [];
  if (scope.length === 0) {
    errors.scope = "Pilih sekurang-kurangnya satu bahagian untuk disunting.";
  } else if (scope.some((s) => !VALID_SCOPES.has(s))) {
    errors.scope = "Terdapat skop suntingan yang tidak dikenali.";
  }

  const hours = input.requestedHours ?? DEFAULT_UNLOCK_HOURS;
  if (!Number.isFinite(hours) || !Number.isInteger(hours)) {
    errors.requestedHours = "Tempoh mesti nombor bulat (jam).";
  } else if (hours < MIN_UNLOCK_HOURS || hours > MAX_UNLOCK_HOURS) {
    errors.requestedHours = `Tempoh mesti antara ${MIN_UNLOCK_HOURS} hingga ${MAX_UNLOCK_HOURS} jam.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/* ====================== Peralihan keadaan ====================== */

/** Adakah tetingkap suntingan masih sah pada masa `now`? */
export function isUnlockWindowActive(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > now.getTime();
}

/**
 * Status berkesan sesuatu permohonan: permohonan `approved` yang tetingkapnya
 * telah tamat dianggap `expired` walaupun pangkalan data belum dikemas kini.
 */
export function effectiveStatus(
  request: UnlockRequest,
  now: Date = new Date(),
): UnlockRequestStatus {
  if (
    request.status === "approved" &&
    !isUnlockWindowActive(request.unlockExpiresAt, now)
  ) {
    return "expired";
  }
  return request.status;
}

/**
 * Bolehkah program disunting sekarang?
 * Program tidak berkunci → boleh. Program berkunci → hanya jika terdapat
 * tetingkap suntingan aktif hasil kelulusan.
 */
export function canEditProgramme(
  lock: ProgrammeLockState,
  now: Date = new Date(),
): boolean {
  if (!lock.locked) return true;
  return isUnlockWindowActive(lock.unlockExpiresAt, now);
}

/** Bolehkah pengguna ini menghantar permohonan baharu? */
export function canRequestUnlock(
  lock: ProgrammeLockState,
  role: GovernanceRole,
  existingRequests: UnlockRequest[] = [],
  now: Date = new Date(),
): boolean {
  if (!lock.locked) return false;
  if (role === "viewer") return false;
  if (canEditProgramme(lock, now)) return false;
  return !existingRequests.some((r) => effectiveStatus(r, now) === "pending");
}

export interface ReviewDecisionInput {
  request: UnlockRequest;
  reviewerId: string;
  reviewerRole: GovernanceRole;
  now?: Date;
}

export interface DecisionCheck {
  allowed: boolean;
  /** Sebab penolakan dalam Bahasa Melayu, jika tidak dibenarkan. */
  message?: string;
}

/**
 * Peraturan kelulusan: peranan berautoriti, permohonan masih `pending`, dan
 * pemohon tidak boleh meluluskan permohonan sendiri.
 */
export function canReviewRequest({
  request,
  reviewerId,
  reviewerRole,
  now = new Date(),
}: ReviewDecisionInput): DecisionCheck {
  if (!canApproveUnlock(reviewerRole)) {
    return {
      allowed: false,
      message:
        "Hanya Pengurus atau Pentadbir boleh meluluskan permohonan buka kunci.",
    };
  }
  if (effectiveStatus(request, now) !== "pending") {
    return {
      allowed: false,
      message: "Permohonan ini telah pun diputuskan atau tamat tempoh.",
    };
  }
  if (request.requestedBy === reviewerId) {
    return {
      allowed: false,
      message:
        "Pemohon tidak boleh meluluskan permohonan sendiri (pengasingan tugas).",
    };
  }
  return { allowed: true };
}

/** Kira masa tamat tetingkap suntingan daripada masa kelulusan. */
export function computeUnlockExpiry(
  hours: number,
  approvedAt: Date = new Date(),
): string {
  const clamped = Math.min(
    MAX_UNLOCK_HOURS,
    Math.max(MIN_UNLOCK_HOURS, Math.round(hours)),
  );
  return new Date(approvedAt.getTime() + clamped * 3_600_000).toISOString();
}

/** Baki masa tetingkap suntingan dalam teks mesra pengguna. */
export function formatRemaining(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!expiresAt) return "—";
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "Tamat tempoh";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} hari ${hours % 24} jam lagi`;
  }
  if (hours > 0) return `${hours} jam ${minutes} minit lagi`;
  return `${minutes} minit lagi`;
}

/** Ringkasan satu baris untuk banner / jejak audit. */
export function describeLockState(
  lock: ProgrammeLockState,
  now: Date = new Date(),
): string {
  if (!lock.locked) return "Program terbuka untuk suntingan.";
  if (isUnlockWindowActive(lock.unlockExpiresAt, now)) {
    return `Tetingkap suntingan aktif — ${formatRemaining(lock.unlockExpiresAt, now)}.`;
  }
  return `Program berkunci — ${LOCK_REASON_LABEL[lock.lockReason]}.`;
}
