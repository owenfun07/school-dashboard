# Supabase Step 2: My School setup

This guide connects the private **My School** page to the Supabase tables created in Step 1. It does not add the community boards, posts, or student self-enrolment yet.

## 1. Confirm your Step 1 data

Before changing the app, confirm that these rows exist in Supabase:

- A user under **Authentication → Users**.
- A matching `profiles` row whose `id` is the Auth user UUID.
- A `schools` row for `Faketown Middle School`.
- `Grade 6`, `Grade 7`, and `Grade 8` rows in `grades` for that school.
- An `active` `school_memberships` row that connects your user to Faketown Middle School with `role` set to `owner`. Leave `grade_id` empty for the owner account.

## 2. Add the safe Supabase browser configuration

1. In Supabase, open **Project Settings → API**.
2. Copy the **Project URL**.
3. Copy the browser-safe **Publishable key**. Some projects label the compatible value as an **anon key**.
4. In this repository, copy `server/.env.example` to `server/.env` if it does not already exist. If `server/.env` already has Google settings, keep them.
5. Add these two values to `server/.env`:

   ```dotenv
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-browser-safe-key
   ```

Do not add a Supabase **Secret key**, **service_role key**, or database password. The server exposes only the URL and browser-safe key to the My School page.

## 3. Apply the Row Level Security policies

1. In Supabase, open **SQL Editor**.
2. Click **New query**.
3. Copy all of `supabase/step-2-my-school-rls.sql` into the query window.
4. Click **Run**.
5. Open **Table Editor** and ensure RLS is enabled for `profiles`, `schools`, `grades`, and `school_memberships`.

The policies intentionally allow a signed-in person to read only their own profile and membership, plus the school and grades linked to their active membership. They do not allow a browser user to create memberships or give themselves an owner/admin role.

## 4. Start the local server

From the repository root:

```bash
npm --prefix server start
```

Then open:

```text
http://localhost:3000/my-school
```

The page is intentionally not linked from the sidebar or Tools page yet.

## 5. Sign in and verify the expected result

Sign in using the email/password account created in Supabase Auth. The page should show:

```text
School: Faketown Middle School
Role: Owner
Membership status: Active
Grade: Not assigned
```

If it says that the profile or membership is missing, compare your UUID values in this order:

```text
Authentication → Users.id
profiles.id
school_memberships.user_id
```

All three must be the same UUID for the owner account.

## 6. What this does not do yet

- It does not replace the existing Google Classroom/Calendar/Drive login.
- It does not create user profiles automatically after sign-up.
- It does not let students join a school.
- It does not create boards, resources, comments, or posts.
- It does not add a navigation link.

Those are later steps after this private identity-and-membership check works.
