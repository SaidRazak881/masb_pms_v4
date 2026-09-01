# Panduan Pemasangan Supabase — TPMS MIMOS Academy

Dokumen ini menerangkan **urutan tepat** untuk memasang pangkalan data TPMS
di Supabase. Ikut langkah di bawah dari atas ke bawah — urutan penting
kerana jadual dan fungsi dirujuk silang.

---

## 1. Cipta projek Supabase

1. Log masuk ke https://supabase.com/dashboard
2. Klik **New project**
   - Nama: `mimos-academy-tpms`
   - Database password: simpan dengan selamat
   - Region: **Singapore (ap-southeast-1)** — paling hampir dengan Malaysia
3. Selepas siap, buka **Project Settings → API**
   - Salin **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Salin **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Letakkan nilai tersebut dalam fail `.env.local` di root repositori:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> ⚠️ JANGAN masukkan `service_role` key dalam kod frontend. Ia hanya untuk
> pentadbiran dan mesti dirahsiakan.

---

## 2. Jalankan fail SQL mengikut urutan

Buka **SQL Editor** di Supabase Dashboard, tampal dan jalankan fail-fail
berikut **SATU PER SATU mengikut urutan**:

| Urutan | Fail | Fungsi |
| ------ | ---- | ------ |
| 1 | `lib/supabase/schema-master.sql` | Skema induk: enum, jadual (profiles, organizers, programmes, participants, financial_docs, costs, documents, audit_logs), fungsi bantu, trigger audit, RLS |
| 2 | `lib/supabase/schema-import-staging.sql` | Jadual staging import (`import_batches`, `import_staging`) + RLS |
| 3 | `lib/supabase/sync-import-transaction.sql` | RPC transaksi atomik `sync_import_transaction()` |
| 4 | `lib/supabase/governance-lock.sql` | Modul Governance: lock/unlock, `programme_unlock_requests`, RPC `request_programme_unlock`, `review_programme_unlock`, `lock_programme` |
| 5 | `lib/supabase/change-requests.sql` | Modul Change Requests: jadual `change_requests`, RPC `submit_change_request`, `review_change_request`, `cancel_change_request` |
| 6 | `lib/supabase/seed-v4-raw.sql` | (PILIHAN) Data awal dari V4 RAW |
| 7 | `lib/supabase/migrations/v4-raw-data-inserts.sql` | (PILIHAN) INSERT data V4 RAW yang diproses |

> Jika anda mahu data contoh yang telah diproses daripada fail Excel V4 RAW,
> jalankan 6 dan 7. Jika mahu bermula kosong, langkau kedua-duanya.

### Semakan selepas pasang

Jalankan dalam SQL Editor untuk mengesahkan:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Jadual yang dijangka wujud:
`audit_logs`, `change_requests`, `cost_items`, `financial_docs`,
`import_batches`, `import_staging`, `organizers`, `participants`,
`programme_costs`, `programme_documents`, `programme_unlock_requests`,
`programmes`, `user_profiles`.

---

## 3. Cipta pengguna & profil

Sistem menggunakan **Supabase Auth** (e-mel + kata laluan). Pengguna perlu
dicipta dahulu, kemudian profil dengan peranan.

### 3.1 Cipta pengguna (Auth)

**Dashboard → Authentication → Users → Add user**. Cipta mengikut senarai
`V4 RAW/User Profiles Mapping.xlsx`:

| Nama | E-mel | Peranan cadangan |
| ---- | ----- | ---------------- |
| Zalina Sayuti | zalina@mimos.my | admin |
| Siti Sarah | sitisarah.ramli@mimos.my | executive |
| Abu Sa'id | abu.razak@mimos.my | staff |
| Qusyairi | qusyairi.zolkefle@mimos.my | staff |
| Fuziah | fuziah.rahim@mimos.my | staff |
| Adilah | adilah.nisman@mimos.my | finance |
| Aisyah | aisyah.alias@mimos.my | staff |
| Dr. Ahmad Nizar | nizar.harun@mimos.my | head_governance |

### 3.2 Cipta profil & peranan

Jalankan SQL berikut (gantikan UUID dengan ID pengguna sebenar daripada
Auth):

```sql
insert into public.user_profiles (id, full_name, email, role, is_active)
values
  ('<UUID-ZALINA>', 'Zalina Sayuti', 'zalina@mimos.my', 'admin', true),
  ('<UUID-NIZAR>', 'Dr. Ahmad Nizar', 'nizar.harun@mimos.my', 'head_governance', true),
  ('<UUID-ADILAH>', 'Adilah Nisman', 'adilah.nisman@mimos.my', 'finance', true),
  ('<UUID-SITI>', 'Siti Sarah', 'sitisarah.ramli@mimos.my', 'executive', true);
```

### Peranan yang disokong (`app_role`)

| Peranan | Kuasa |
| ------- | ----- |
| `viewer` | Baca sahaja, eksport laporan yang dibenarkan |
| `staff` | Cipta & edit program yang tidak dikunci |
| `finance` | Edit quotation, PO, DO, invoice, kos, payment status |
| `executive` | Lihat keseluruhan, laporan |
| `manager` | Lulus permohonan buka kunci |
| `admin` | Import, cipta program, urus template laporan |
| `head_governance` | **Lock/unlock program**, lulus change request |

---

## 4. Storage (fail dokumen) — pilihan

Untuk muat naik dokumen (quotation, PO, DO, invoice, sijil):

1. **Dashboard → Storage → New bucket**
   - Nama: `programme-documents`
   - Public: **No** (private)
2. RLS untuk bucket (SQL Editor):

```sql
create policy "Authenticated boleh muat naik dokumen program"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'programme-documents');

create policy "Authenticated boleh baca dokumen program"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'programme-documents');
```

URL fail boleh disimpan dalam medan `document_url` (financial_docs),
`file_path` (programme_documents) atau `supporting_document_url`
(change_requests).

---

## 5. Ujian RLS & lock governance

### 5.1 Ujian deny — lock berfungsi

```sql
-- Log masuk sebagai staff (bukan head_governance), cuba update program terkunci:
update public.programmes
set title = 'HACK'
where programme_code = 'MIMOS-TRN-2026-0001'
  and is_locked = true;
-- JANGAN pulangkan baris (0 rows) kerana RLS menolak.
```

### 5.2 Ujian allow — change request

```sql
select public.submit_change_request(
  '<PROGRAMME_UUID>',     -- program yang DIKUNCI
  'title',                -- medan dibenarkan
  'Tajuk Lama',
  'Tajuk Baharu',
  'Sebab perubahan yang lengkap sekurang-kurangnya 10 aksara'
);
-- Sebagai head_governance:
select public.review_change_request('<REQUEST_UUID>', true, 'Diluluskan');
```

### 5.3 Ujian audit trail

```sql
select * from public.audit_logs
where table_name = 'change_requests'
order by created_at desc limit 5;
```

---

## 6. Penyelesaian masalah biasa

| Masalah | Punca | Penyelesaian |
| ------- | ----- | ------------ |
| `relation "public.programmes" does not exist` | Skema belum dijalankan | Jalankan `schema-master.sql` dahulu |
| `function public.sync_import_transaction() does not exist` | RPC belum dipasang | Jalankan `sync-import-transaction.sql` |
| `type public.change_request_status does not exist` | Fail 5 belum dijalankan | Jalankan `change-requests.sql` |
| RLS menolak INSERT pada `import_staging` | Polisi belum wujud | Jalankan `schema-import-staging.sql` |
| `42601: permission denied` | Guna anon key untuk operasi pentadbiran | Guna **SQL Editor** (service role) atau log masuk sebagai pengguna berkenaan |
| Halaman papar "Mod demo" walaupun env diisi | Env tidak dibaca | Sahkan `.env.local` dan **restart** `npm run dev` |

---

## 7. Nota keselamatan

- **Jangan** gunakan `service_role` dalam aplikasi frontend.
- RLS diaktifkan pada semua jadual utama — polisi `UPDATE` pada
  `programmes` hanya membenarkan edit jika `is_locked = false` ATAU
  `unlock_expires_at > now()` ATAU pengguna adalah head_governance/admin.
- Semua tulis pada `change_requests` melalui RPC `SECURITY DEFINER` —
  tiada polisi INSERT/UPDATE terus, jadi lock tidak boleh dipintas melalui
  API.
- Audit log dijana automatik oleh trigger untuk create/update/delete pada
  jadual utama.
