# Supabase tests

This directory is reserved for SQL-level tests that can be run with the Supabase CLI when it is available locally.

The automated repository test suite also includes database integrity checks in `tests/database.test.ts` so schema and fixture consistency stays covered even without a running local Supabase stack.
