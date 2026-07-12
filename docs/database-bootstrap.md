# Database Bootstrap

This document describes the order for bringing up the Yukatitip database foundation.

## 1. Apply the schema

- Use the initial migration in `supabase/migrations/20260712000000_initial_yukatitip_schema.sql`.
- The migration mirrors the canonical SQL schema in `schema.sql`.
- Run the database reset or migration flow for your local Supabase environment.

## 2. Seed reference data

- `supabase/seed.sql` seeds branch and route reference rows that do not depend on Supabase Auth.
- Branch head employees are left `NULL` in the seed because head assignment depends on employee bootstrap.

## 3. Create the first internal user

1. Create an Auth user in Supabase Auth.
2. Copy the user UUID from `auth.users`.
3. Insert the matching `profiles` row with the `owner` role.
4. Insert the matching `employees` row if the account is also used as an employee record.

## 4. Complete branch bootstrap

- Insert employee records for each branch.
- Update `branches.head_employee_id` after the employee rows exist.
- Create branch-specific routes, schedules, and tariffs if you need additional corridors beyond the seed.

## 5. Optional demo data

- `sample-data.json` is a richer fixture for documentation and manual loading.
- It contains circular references that require a two-phase bootstrap for branch head assignments.
- Do not commit real credentials or production user data into any fixture or seed.
