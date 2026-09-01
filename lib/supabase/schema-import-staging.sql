-- =====================================================================
-- TPMS MIMOS Academy — Jadual staging import Excel
-- =====================================================================
-- Data yang diekstrak oleh lib/excel-parser.ts dipetakan ke jadual ini
-- (lihat fungsi `toStagingRows()`). Rekod kekal di sini sehingga pengguna
-- membuat keputusan pada Staging Review Screen:
--
--   sync_confirmed → disegerak terus ke jadual induk (programmes/financials)
--   merged         → digabungkan dengan rekod program sedia ada
--   created_new    → program/transaksi baharu dicipta
--   discarded      → dibuang (kekal untuk jejak audit jika perlu)
-- =====================================================================

create type import_entity_kind as enum ('quotation', 'invoice', 'cost', 'unknown');
create type import_record_action as enum (
  'pending', 'sync_confirmed', 'merged', 'created_new', 'discarded'
);
create type import_duplicate_confidence as enum ('high', 'medium', 'none');

create table if not exists import_staging (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  imported_by         uuid references auth.users (id),
  batch_id            uuid not null,

  -- Sumber
  source_file         text not null,
  source_sheet        text not null,
  source_row         integer not null,

  -- Entiti
  entity_kind         import_entity_kind not null,

  -- Data perniagaan (dinormalisasikan)
  programme_title     text,
  client_name         text,
  reference_no        text,
  reference_type      text,
  amount              numeric(14, 2),
  currency            text not null default 'MYR',
  doc_date            date,
  fiscal_year         integer,
  category            text,
  trainer             text,
  delivery_mode       text,
  status_raw          text,
  description         text,

  -- Pengesahan & keputusan
  is_valid            boolean not null default false,
  validation_errors   jsonb not null default '[]'::jsonb,
  warnings            jsonb not null default '[]'::jsonb,
  duplicate_match_id  text,
  duplicate_confidence import_duplicate_confidence,
  duplicate_snapshot  jsonb,
  suggested_action    import_record_action not null default 'pending',
  decided_at          timestamptz,
  decided_by          uuid references auth.users (id),

  -- Payload mentah untuk audit / paparan
  raw_payload         jsonb not null default '{}'::jsonb
);

-- Batch muat naik (satu fail Excel = satu batch)
create table if not exists import_batches (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id),
  source_file     text not null,
  file_name       text not null,
  total_rows      integer not null default 0,
  valid_rows      integer not null default 0,
  invalid_rows    integer not null default 0,
  duplicate_rows  integer not null default 0,
  status          text not null default 'staged'
                  -- staged | reviewed | synced | discarded
);

alter table import_staging
  add constraint import_staging_batch_fk
  foreign key (batch_id) references import_batches (id) on delete cascade;

create index if not exists idx_import_staging_batch
  on import_staging (batch_id);
create index if not exists idx_import_staging_action
  on import_staging (suggested_action);
create index if not exists idx_import_staging_ref
  on import_staging (entity_kind, reference_no);
create index if not exists idx_import_staging_dup
  on import_staging (duplicate_confidence);

-- Dasar baris (RLS) — boleh diperketat ikut peranan pasukan.
alter table import_staging enable row level security;
alter table import_batches enable row level security;

create policy "Pengguna terauth boleh melihat staging"
  on import_staging for select
  to authenticated
  using (true);

create policy "Pengguna terauth boleh menambah staging"
  on import_staging for insert
  to authenticated
  with_check (true);

create policy "Pengguna terauth boleh mengemaskini keputusan"
  on import_staging for update
  to authenticated
  using (true)
  with_check (true);

create policy "Pengguna terauth boleh melihat batch"
  on import_batches for select
  to authenticated
  using (true);

create policy "Pengguna terauth boleh mencipta batch"
  on import_batches for insert
  to authenticated
  with_check (true);
