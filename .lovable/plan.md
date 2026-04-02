

## Plan: Fix Signup — Reattach Missing Database Trigger

### Problem
The `handle_new_user()` function exists but the **trigger is not attached** to `auth.users`. When a new user signs up, no profile row is created. The signup code then tries to `UPDATE profiles` for that user ID, which silently updates zero rows. The user ends up with an auth account but no profile, causing login/redirect failures.

### Fix

**Database migration** — One SQL statement to recreate the trigger:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

That is the entire fix. No code changes needed — the signup page and trigger function are both correct; only the trigger binding was missing.

### Files to Modify
- Database migration only (no application code changes)

