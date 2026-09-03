# CODEBASE MAP — TPMS MIMOS Academy

> Dijana: 2026-09-03 · Arahan kemaskini: `node scripts/codebase-map.mjs`
> Git: a4e63e3 PROMPT-6G SELESAI (semua kriteria PASS) + betulkan pengesahan G1 yang rosak · arena/01a06274-masb-pms-v4

> **Nota penggunaan:** Dokumen ini ialah KONTEKS RINGKAS untuk pembantu AI. Ia bukan spec penuh — rujuk fail sebenar apabila perlu butiran.

## 1. Seni Bina

- **Frontend/Backend:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- **Data & Auth:** Supabase (PostgreSQL, RLS, Auth, Storage) — production di Vercel
- **Mod demo:** bila `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` tiada, sistem guna mock-data
- **Dokumen rujukan:** `README.md`, `docs/SETUP-SUPABASE.md`, `docs/DEPLOY-VERCEL.md`

## 2. Laluan Aplikasi (app/)

- /account-blocked  `(app/(auth)/account-blocked/page.tsx)`
- /forgot-password  `(app/(auth)/forgot-password/page.tsx)`
- /login  `(app/(auth)/login/page.tsx)`
- /pending-approval  `(app/(auth)/pending-approval/page.tsx)`
- /register  `(app/(auth)/register/page.tsx)`
- /admin/users  `(app/(dashboard)/admin/users/page.tsx)`
- /dashboard  `(app/(dashboard)/dashboard/page.tsx)`
- /import  `(app/(dashboard)/import/page.tsx)`
- /participants  `(app/(dashboard)/participants/page.tsx)`
- /programmes/:id  `(app/(dashboard)/programmes/[id]/page.tsx)`
- /programmes  `(app/(dashboard)/programmes/page.tsx)`
- /reports  `(app/(dashboard)/reports/page.tsx)`
- /security  `(app/(dashboard)/security/page.tsx)`
- /api/import/sync  `(app/api/import/sync/route.ts)`
- /  `(app/page.tsx)`

## 3. Komponen Utama (components/)

- `components/admin/user-management.tsx`
- `components/dashboard/dashboard-overview.tsx`
- `components/governance/change-request-dialog.tsx`
- `components/governance/change-request-history.tsx`
- `components/governance/change-request-inbox.tsx`
- `components/governance/governance-panel.tsx`
- `components/governance/lock-banner.tsx`
- `components/governance/lock-programme-button.tsx`
- `components/governance/request-unlock-dialog.tsx`
- `components/governance/unlock-approval-card.tsx`
- `components/governance/unlock-request-history.tsx`
- `components/import/duplicate-compare-dialog.tsx`
- `components/import/import-history.tsx`
- `components/import/review-panel.tsx`
- `components/import/smart-excel-import.tsx`
- `components/layout/logout-button.tsx`
- `components/layout/mobile-nav.tsx`
- `components/layout/sidebar-nav.tsx`
- `components/participants/participants-browser.tsx`
- `components/programmes/create-programme-dialog.tsx`
- `components/programmes/detail/audit-trail-tab.tsx`
- `components/programmes/detail/costs-tab.tsx`
- `components/programmes/detail/documents-tab.tsx`
- `components/programmes/detail/financial-tab.tsx`
- `components/programmes/detail/overview-tab.tsx`
- `components/programmes/detail/participants-tab.tsx`
- `components/programmes/edit-programme-dialog.tsx`
- `components/programmes/programme-detail-tabs.tsx`
- `components/programmes/programmes-browser.tsx`
- `components/programmes/status-badges.tsx`
- `components/reports/report-builder.tsx`
- `components/security/account-guard.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/dialog.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/select.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/textarea.tsx`

## 4. Modul Logik (lib/)

- `lib/actions/financial-actions.ts`
- `lib/actions/import-actions.ts`
- `lib/actions/participant-actions.ts`
- `lib/actions/programme-actions.ts`
- `lib/actions/user-management-actions.ts`
- `lib/auth-client.ts`
- `lib/auth.ts`
- `lib/change-request-actions.ts`
- `lib/change-requests.ts`
- `lib/dashboard-data.ts`
- `lib/excel-parser.ts`
- `lib/format.ts`
- `lib/governance-actions.ts`
- `lib/governance.ts`
- `lib/import-api.ts`
- `lib/import-shared.ts`
- `lib/master-records.ts`
- `lib/mock-data.ts`
- `lib/participants-data.ts`
- `lib/programme-mapper.ts`
- `lib/report-excel.ts`
- `lib/reporting.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/server.ts`
- `lib/types.ts`
- `lib/user-management.ts`
- `lib/utils.ts`

## 5. Pangkalan Data — Skema SQL (lib/supabase/)

### `lib/supabase/change-requests.sql`
- **Jadual:** change_requests
- **Enum:** change_request_status
- **Fungsi/RPC:** change_request_allowed_fields, submit_change_request, review_change_request, cancel_change_request
- **Polisi RLS:** change_requests_select_authenticated

### `lib/supabase/fix-add-programme-categories.sql`

### `lib/supabase/fix-rls-recursion.sql`
- **Fungsi/RPC:** current_user_role, current_role_name, has_role
- **Polisi RLS:** Admin boleh lihat semua profil · Pengguna boleh kemaskini programmes jika tidak dikunci · Pengguna boleh kemaskini participants jika program tidak dikunci · Pengguna boleh kemaskini financial_docs jika program tidak dikunci · Pengguna boleh kemaskini invoices jika program tidak dikunci · Pengguna boleh kemaskini programme_costs jika program tidak dikunci · Pengguna boleh kemaskini cost_items jika program tidak dikunci · Pengguna boleh kemaskini programme_documents jika program tidak dikunci · Pengguna terauth boleh kemaskini programmes

### `lib/supabase/governance-lock.sql`
- **Jadual:** programme_unlock_requests
- **Enum:** unlock_request_status, programme_lock_reason
- **Fungsi/RPC:** current_role_name, is_unlock_approver, programme_is_editable, request_programme_unlock, review_programme_unlock, lock_programme, cancel_programme_unlock, expire_stale_unlocks, enforce_programme_lock
- **Polisi RLS:** unlock_select_authenticated · unlock_no_direct_write
- **Trigger:** programmes_enforce_lock

### `lib/supabase/migrations/v4-raw-data-inserts.sql`

### `lib/supabase/schema-import-staging.sql`
- **Jadual:** import_staging, import_batches
- **Enum:** import_entity_kind, import_record_action, import_duplicate_confidence
- **Polisi RLS:** Pengguna terauth boleh melihat staging · Pengguna terauth boleh menambah staging · Pengguna terauth boleh mengemaskini keputusan · Pengguna terauth boleh melihat batch · Pengguna terauth boleh mencipta batch

### `lib/supabase/schema-master.sql`
- **Jadual:** user_profiles, organizers, programmes, participants, financial_docs, invoices, programme_costs, cost_items, programme_documents, audit_logs
- **Enum:** programme_status, programme_category, delivery_mode, payment_status, financial_doc_type, bumi_status, participant_status, cost_category, document_type, audit_action, app_role
- **Fungsi/RPC:** current_user_id, current_user_role, current_role_name, has_role, log_audit, programmes_audit_trigger, participants_audit_trigger, financial_docs_audit_trigger
- **Polisi RLS:** (badan LANGUAGE sql dihurai serta-merta). · Pengguna boleh lihat profil sendiri · Pengguna boleh kemaskini profil sendiri · Admin boleh lihat semua profil · Pengguna terauth boleh lihat organizers · Pengguna terauth boleh tambah organizers · Pengguna terauth boleh kemaskini organizers · Pengguna terauth boleh lihat programmes · Pengguna terauth boleh tambah programmes · Pengguna boleh kemaskini programmes jika tidak dikunci · Pengguna boleh padam programmes sendiri jika draf · Pengguna terauth boleh lihat participants · Pengguna terauth boleh tambah participants · Pengguna boleh kemaskini participants jika program tidak dikunci · Pengguna boleh padam participants jika program draf · Pengguna terauth boleh lihat financial_docs · Pengguna terauth boleh tambah financial_docs · Pengguna boleh kemaskini financial_docs jika program tidak dikunci · Pengguna terauth boleh lihat invoices · Pengguna terauth boleh tambah invoices · Pengguna boleh kemaskini invoices jika program tidak dikunci · Pengguna terauth boleh lihat programme_costs · Pengguna terauth boleh tambah programme_costs · Pengguna boleh kemaskini programme_costs jika program tidak dikunci · Pengguna terauth boleh lihat cost_items · Pengguna terauth boleh tambah cost_items · Pengguna boleh kemaskini cost_items jika program tidak dikunci · Pengguna terauth boleh lihat programme_documents · Pengguna terauth boleh tambah programme_documents · Pengguna boleh kemaskini programme_documents jika program tidak dikunci · Pengguna terauth boleh lihat audit_logs
- **Trigger:** programmes_audit_trigger, participants_audit_trigger, financial_docs_audit_trigger

### `lib/supabase/seed-v4-raw.sql`
- **Jadual:** organizers, programmes, participants, financial_docs, programme_costs, cost_items, programme_documents, audit_logs
- **Enum:** programme_status, programme_category, delivery_mode, payment_status, financial_doc_type, bumi_status, participant_status, cost_category, document_type, audit_action
- **Fungsi/RPC:** current_user_id, current_user_role, log_audit, programmes_audit_trigger
- **Polisi RLS:** IF NOT EXISTS; membolehkan fail ini dijalankan semula · Pengguna terauth boleh lihat programmes · Pengguna terauth boleh tambah programmes · Pengguna terauth boleh kemaskini programmes · Pengguna terauth boleh lihat organizers · Pengguna terauth boleh tambah organizers · Pengguna terauth boleh kemaskini organizers · Pengguna terauth boleh lihat participants · Pengguna terauth boleh tambah participants · Pengguna terauth boleh kemaskini participants · Pengguna terauth boleh lihat financial_docs · Pengguna terauth boleh tambah financial_docs · Pengguna terauth boleh kemaskini financial_docs · Pengguna terauth boleh lihat programme_costs · Pengguna terauth boleh tambah programme_costs · Pengguna terauth boleh kemaskini programme_costs · Pengguna terauth boleh lihat cost_items · Pengguna terauth boleh tambah cost_items · Pengguna terauth boleh lihat programme_documents · Pengguna terauth boleh tambah programme_documents · Pengguna terauth boleh lihat audit_logs
- **Trigger:** programmes_audit_trigger

### `lib/supabase/sync-import-transaction.sql`
- **Fungsi/RPC:** append_import_audit, sync_import_transaction

### `lib/supabase/updated-at-triggers.sql`
- **Fungsi/RPC:** set_updated_at
- **Trigger:** set_updated_at

### `lib/supabase/user-management.sql`
- **Jadual:** app_settings
- **Enum:** account_status
- **Fungsi/RPC:** is_super_admin, can_manage_users, my_account_status, my_password_change_required, assert_can_manage_users, default_password, assert_password_acceptable, admin_list_users, admin_user_summary, admin_approve_user, admin_set_user_blocked, admin_change_user_role, admin_reset_user_password, admin_reset_all_passwords_to_default, admin_require_password_change, mark_password_changed, handle_new_auth_user, sync_auth_user_update
- **Polisi RLS:** Super Admin sahaja boleh lihat tetapan · Super Admin boleh lihat semua profil · Pengguna boleh lihat profil sendiri · Pengguna boleh kemaskini profil sendiri
- **Trigger:** on_auth_user_created, on_auth_user_updated

## 6. Fail dengan Rujukan Mock / Demo (perlu perhatian bila 'live')

- `lib/actions/import-actions.ts`
- `lib/actions/programme-actions.ts`
- `lib/actions/user-management-actions.ts`
- `lib/change-request-actions.ts`
- `lib/dashboard-data.ts`
- `lib/governance-actions.ts`
- `lib/import-api.ts`
- `lib/master-records.ts`
- `lib/mock-data.ts`
- `lib/participants-data.ts`
- `lib/supabase/middleware.ts`
- `components/admin/user-management.tsx`
- `components/dashboard/dashboard-overview.tsx`
- `components/import/import-history.tsx`
- `components/import/smart-excel-import.tsx`
- `components/participants/participants-browser.tsx`
- `components/programmes/programmes-browser.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(dashboard)/programmes/[id]/page.tsx`
- `app/(dashboard)/programmes/page.tsx`
- `app/(dashboard)/security/page.tsx`

## 7. Dokumen & Prompt GPT (docs/)

- `ACTION-4A-VERCEL-SETUP.md`
- `ACTION-4C-MANUAL-UI.md`
- `ACTION-4E-RETEST-UI.md`
- `ACTION-6-UAT-AUTH-USERS.md`
- `CODEBASE-MAP.md`
- `DEPLOY-VERCEL.md`
- `EVALUASI-ALAT-AI-TPMS.md`
- `GPT-ASSISTANT-PROMPTS.md`
- `PROMPT-2-RECONCILE-LIVE.md`
- `PROMPT-2B-INSTALL-RPC.md`
- `PROMPT-2C-BLOCKER-RESOLUTION.md`
- `PROMPT-2D-SEED-VERIFY.md`
- `PROMPT-2E-AUDIT-LEGACY-FIX.md`
- `PROMPT-3-AUTH-STORAGE.md`
- `PROMPT-4-DEPLOY-E2E.md`
- `PROMPT-4B-E2E-VERIFY.md`
- `PROMPT-4C-CONTINUE-E2E.md`
- `PROMPT-4D-FINAL-VERIFY.md`
- `PROMPT-4E-FIX-DB-LOCK-NAMES.md`
- `PROMPT-4F-FIX-RLS-RECURSION.md`
- `PROMPT-4G-RETEST-IMPORT-NAV.md`
- `PROMPT-4H-ADD-CATEGORIES.md`
- `PROMPT-5-RESET-PASSWORDS.md`
- `PROMPT-6-INSTALL-USER-MANAGEMENT.md`
- `PROMPT-6B-FIX-C13-HAS-ROLE.md`
- `PROMPT-6C-AUDIT-LEGACY-TABLES.md`
- `PROMPT-6D-AUTH-VERCEL-LEGACY.md`
- `PROMPT-6E-VERCEL-PRODUCTION-PRIVATE-HAS-ROLE.md`
- `PROMPT-6F-AUDIT-PRIVATE-SCHEMA-DRIFT.md`
- `PROMPT-6G-UPDATED-AT-AND-REVOKE.md`
- `PROMPT-6H-E1-E9-PRECISE-CRITERIA.md`
- `PROMPT-TEMPLATE-FASA.md`
- `SETUP-SUPABASE.md`
- `SKILLS.md`

## 8. Fasa 6 — Pengesahan & Pengurusan Pengguna (TERKINI)

**MFA/TOTP telah DIBUANG sepenuhnya.** Sistem kini menggunakan e-mel + kata laluan sahaja.

- Kata laluan lalai pertama: `masb.12345` (`lib/auth.ts` DEFAULT_PASSWORD,
  `public.app_settings.default_password` di DB). Pengguna WAJIB tukar selepas
  log masuk (`must_change_password` → redirect `/security?required=1`).
- Master Admin / Super Admin: `saidrazak881@gmail.com` → role `super_admin`,
  dashboard khusus `/admin/users`.
- Pendaftaran sendiri: `/register` → trigger `on_auth_user_created` cipta profil
  `pending` + role `viewer` → Super Admin luluskan.
- Lupa kata laluan: `/forgot-password` → e-mel pemulihan → `/security?reset=1`.
- Status akaun: `pending` / `active` / `blocked`. Dikuatkuasakan sisi pelayan di
  `app/(dashboard)/layout.tsx` + `components/security/account-guard.tsx`.
- SQL: `lib/supabase/user-management.sql` (RPC `admin_*`, column-level GRANT
  menghalang eskalasi role, audit log setiap tindakan).
- Ujian SQL (PGlite): `node scripts/test-user-management-sql.mjs`
  → pemasangan DB kosong + 12 kumpulan ujian fungsi.

## 9. Isu Terbuka & Perhatian

- **Sejarah git telah ditulis semula** (komit "Add files via upload"): semua hash
  komit yang dirujuk dalam `docs/PROMPT-*.md` fasa terdahulu (21f18cb, 13078f2,
  8066e95, 8057579, 536ccc9) TIDAK lagi wujud. Rujuk kandungan fail semasa, bukan hash.
- Branch produksi Vercel perlu dikemas kini kepada branch semasa (lihat
  `docs/PROMPT-6-INSTALL-USER-MANAGEMENT.md`).
- Pengesahan akhir: `npm run build` + `node scripts/test-user-management-sql.mjs`
  sebelum push.
