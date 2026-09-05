# PROMPT 8C-DRIFT-2 — Investigate schema `private` and `private.has_role` (READ-ONLY)

> 🟢 **NO HARD GATE.** Every query below is **read-only**: no DDL, no DML, no
> `GRANT`/`REVOKE`, no `DROP`, no RPC invocation. Run immediately.
> The two behavioural probes (P7b, P8c) open a transaction and **ROLLBACK** —
> they change nothing.

---

## 1. PERSONA

You are a **senior PostgreSQL/Supabase production database engineer**. You are
careful, conservative, and you **never fabricate evidence**. You paste real
output even when it contradicts the expectation.

## 2. MANDATORY ECHO CONTROL (new — read this first)

Probe P4/P5 of the previous round failed with errors that are **impossible** for
the queries as written:

* P5 reported `"array_agg" is an aggregate function` — but P5 contains **no
  `array_agg`** anywhere.
* P4 reported `column d.refid does not exist` — but `pg_depend.refid` is a valid
  system-catalog column.

Conclusion: the SQL that reached the engine was **not** the SQL in the approved
prompt. This is the 5th non-byte-for-byte incident (DP-13.2, DP-17.2, DP-21.4,
the `defaclnobjtype` typo, and now P4/P5).

**Therefore, for EVERY query in this prompt you must:**

1. **First** paste the exact query text you are about to submit, inside a fenced
   `sql` block, **copied from this file** — not retyped, not reformatted, not
   "cleaned up".
2. **Then** paste the result or the full error verbatim.
3. If your connector rewrote, truncated, or reformatted the query before
   execution, **paste what was actually sent** and say so explicitly.

Do not modify a query to make it work. If it fails, report the failure and
continue with the remaining queries.

## 3. CONTEXT — why this probe exists (Panel DP-25, 2026-09-05)

Phase 8C is installed and accepted on production (`anon` 53 → 0 across 56
functions; blocked accounts lose power; backfill gated by single-use token).

The drift probe recorded the definition of the orphan write RPC
`public.unlock_programme`, which exists on live but has **no definition anywhere
in the repo**. Two facts from that definition drive this probe:

```
IF NOT private.has_role('head_governance') THEN RAISE EXCEPTION ... USING ERRCODE='42501';
UPDATE public.programmes SET governance_lock_status='unlocked', locked_at=NULL,
       locked_by=NULL, lock_reason=p_reason, updated_at=now() WHERE id=p_programme_id
```

* Its access control is **`private.has_role`** — a schema named `private` that
  **does not exist in any repo file**. The repo defines and uses
  `public.has_role` (`lib/supabase/fix-rls-recursion.sql`), which 8C hardened via
  `public.current_user_role()` (now filters `is_active` and `account_status`).
* `unlock_programme` is **`SECURITY INVOKER`**, so it does **not** inherit the
  hardened `public` chain at all.

**Open hypothesis (NOT a conclusion):** if `private.has_role` does not filter
`is_active`/`account_status`, then a **blocked** `head_governance` user can still
unlock a programme — meaning **DP-17.4(a) is not closed for this path**. P7b is
designed to decide this with a single comparison.

## 4. QUERIES

### P6a — Full schema inventory (find every schema the repo does not know about)

```sql
SELECT n.nspname AS schema_name,
       count(p.oid)::int AS function_count
  FROM pg_namespace n
  LEFT JOIN pg_proc p ON p.pronamespace = n.oid
 WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
   AND n.nspname NOT LIKE 'pg_temp%'
   AND n.nspname NOT LIKE 'pg_toast_temp%'
 GROUP BY n.nspname
 ORDER BY n.nspname;
```

**Why:** the repo knows `public`, `auth`, `storage`, `extensions`. Any other
schema is undocumented surface. **Paste every row.**

### P6b — Everything inside schema `private`

```sql
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_function_result(p.oid)             AS result_type,
       r.rolname                                 AS owner,
       p.prosecdef                               AS security_definer,
       p.provolatile                             AS volatility,
       p.proconfig::text                         AS search_path_pin,
       p.proacl::text                            AS privileges,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_roles r ON r.oid = p.proowner
 WHERE n.nspname = 'private'
 ORDER BY p.proname;
```

**Report if this returns zero rows** — that would mean `private.has_role` does
not exist, which is itself a critical finding (`unlock_programme` would then fail
at runtime for everyone).

### P7a — Definition of every function in `private`

```sql
SELECT p.proname AS function_name,
       pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'private'
 ORDER BY p.proname;
```

**Paste every definition VERBATIM and COMPLETE.** Do not summarise, do not
reformat, do not remove comments. This is the primary evidence of the probe.

**What Arena will look for:** whether the body filters `is_active` /
`account_status`, whether it reads `auth.uid()` or `request.jwt.claims`, and
whether it is `SECURITY DEFINER`.

### P7b — 🔴 THE DECISIVE TEST: same blocked account, both role-check paths

```sql
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<UUID_AKAUN_BLOCKED>','role','authenticated')::text, true);
SELECT private.has_role('head_governance')      AS private_hg,
       private.has_role('staff')                AS private_staff,
       public.has_role('staff'::public.app_role) AS public_staff,
       public.current_user_role()::text          AS public_role_now;
ROLLBACK;
```

Replace `<UUID_AKAUN_BLOCKED>` with the UUID of the blocked account already
identified in J0c (`test` / `test@gmail.com`, role `staff`, `is_active=false`,
`account_status=blocked`). **Do not block or modify any real account.**

**How to read the result:**

| Result | Meaning |
|---|---|
| `private_staff = false` and `public_staff = false` | ✅ `private.has_role` **is** hardened the same way — DP-17.4(a) closed for this path |
| `private_staff = true` while `public_staff = false` | 🔴 **OPEN HOLE**: the `private` path still grants power to a blocked account. Report as 🔴 blocker |
| `private_hg = true` | 🔴 **OPEN HOLE** (worse): a blocked account passes the exact check that guards `unlock_programme` |
| query errors with `42P01` / function does not exist | Report verbatim — `private.has_role` is missing or has a different signature |

**Paste all four values and confirm `ROLLBACK` appears in the output.**

### P8a — Blast radius: every function that references schema `private`

```sql
SELECT n.nspname AS schema_name, p.proname AS function_name
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname IN ('public','private')
   AND pg_get_functiondef(p.oid) LIKE '%private.%'
 ORDER BY 1, 2;
```

**Why:** if more than `unlock_programme` depends on `private`, then hardening
only the `public` chain left more than one bypass. **Paste every row.**

### P8b — Do any RLS policies reference schema `private`?

```sql
SELECT schemaname, tablename, policyname
  FROM pg_policies
 WHERE coalesce(qual,'') LIKE '%private.%'
    OR coalesce(with_check,'') LIKE '%private.%'
 ORDER BY 1, 2, 3;
```

### P8c — Dependencies on `unlock_programme` (P4 reissued)

```sql
SELECT d.classid::regclass::text AS dependent_class,
       d.objid::text             AS dependent_object,
       d.deptype                 AS dependency_type
  FROM pg_depend d
 WHERE d.refid = (SELECT p.oid
                    FROM pg_proc p
                    JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = 'public'
                     AND p.proname = 'unlock_programme'
                   LIMIT 1)
 ORDER BY 1, 2;
```

**Note:** `pg_depend` legitimately has a `refid` column. If this still reports
`column d.refid does not exist`, **do not modify the query** — paste the echoed
query text from step 2 of the Echo Control and the full error. That discrepancy
is itself the evidence Arena needs.

### P8d — Policies/triggers referencing `unlock_programme` (P5 reissued)

```sql
SELECT 'policy' AS kind, schemaname AS schema_name, tablename AS object_name,
       policyname AS name
  FROM pg_policies
 WHERE coalesce(qual,'') ILIKE '%unlock_programme%'
    OR coalesce(with_check,'') ILIKE '%unlock_programme%'
UNION ALL
SELECT 'trigger', trigger_schema, event_object_table, trigger_name
  FROM information_schema.triggers
 WHERE action_statement ILIKE '%unlock_programme%'
 ORDER BY 1, 2, 3;
```

**Note:** the previous P5 included a third branch scanning `pg_get_functiondef`
for all functions. That branch is **removed here** because P8a already covers it
more cheaply. Do not re-add it.

## 5. PROHIBITIONS

1. 🔴 **READ-ONLY ONLY.** No `DROP`, `ALTER`, `CREATE`, `REVOKE`, `GRANT`,
   `UPDATE`, `DELETE`, `INSERT`, and no RPC invocation.
2. JANGAN / **DO NOT** call `unlock_programme` to "see what happens" — it is a
   **write** RPC whose body has never been reviewed.
3. Do not use `service_role`.
4. Do not reset or change any password.
5. Do not merge to `main` or change the Vercel Production Branch. This prompt
   does **not** approve it.
6. Do not paste the full anon key or any secret.
7. Do not fabricate evidence — every value must be real output. If a query fails,
   paste the full error and continue with the rest.
8. Do not "fix" a failing query. Report it.
9. Do not resolve the drift yourself — no DROP, no CREATE, no inventory change.
   That decision belongs to Arena and the user.
10. Do not leave any transaction open. P7b and P8c must end in `ROLLBACK`;
    confirm the word `ROLLBACK` appears in the output you paste.

## 6. REPORT FORMAT (mandatory — 6 sections)

**Section 1 — Context & status:** Supabase project, and confirmation that 8C is
  still in the reported state (K1 `anon=0`).
**Section 2 — Actions taken:** for **each** of P6a, P6b, P7a, P7b, P8a, P8b,
  P8c, P8d — the **echoed query text** first, then the verbatim output/error.
**Section 3 — Results (table):** `P6a..P8d` | status ✅/❌/⏳ | evidence.
**Section 4 — Issues / blockers:** 🔴/🟠/🟢. **P7b must be interpreted using the
  table in §4 of this prompt** — state explicitly which row of that table the
  live result matches.
**Section 5 — Full compliance:** the 10 prohibitions, and confirmation that the
  Echo Control was applied to every query.
**Section 6 — Conclusion & next steps.**

**Stop after the report.** Do not start 8B/8D, and do not attempt remediation.

---

## Notes for Arena (not part of the prompt)

* If P7b shows `private_staff = true` while `public_staff = false`, DP-17.4(a) is
  **open** for the `private` path. Remediation must be an **additive migration**
  (never edit an installed file) — most likely hardening `private.has_role` to
  filter `is_active`/`account_status` exactly as `public.current_user_role()` now
  does, or re-pointing `unlock_programme` at the hardened public chain.
* Record the outcome as **DP-26**. Also fold P6a's schema list into the standard
  probe set: the repo currently has no inventory of non-`public` schemas, and
  Lesson 84 exists precisely because of that blind spot.
* `unlock_programme`'s recorded definition lives at
  `lib/supabase/legacy/unlock-programme-RECORDED-FROM-LIVE.sql` (evidence only —
  not installed, not scanned by the convention guard, not added to the Section 2
  inventory).
* The DROP decision remains **deferred** by the user's standing instruction
  ("legacy pre-repo DROP cleanup = KEKAL DITANGGUH"). P8c/P8d exist to make that
  future decision safe, not to trigger it now.
