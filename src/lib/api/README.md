# Centralised API layer

Every API call from the frontend goes through this folder. **Never import
`axios` directly in a page** — use `api.<domain>.<method>()` instead.

```
src/lib/api/
  client.ts          ← shared axios instance + interceptors + unwrap()
  auth.ts            ← api.auth.login / me / logout / changePassword
  complaints.ts      ← api.complaints.list / mine / get / create / update / …
  technicians.ts     ← api.technicians.list / create / update / remove
  departments.ts     ← api.departments.*
  locations.ts       ← api.locations.*
  users.ts           ← api.users.*
  roles.ts           ← api.roles.list / permissions / updatePermissions
  uploads.ts         ← api.uploads.image / images
  index.ts           ← bundles everything into a single `api` object
```

## What the client already handles for you

- **`baseURL`** is taken from `NEXT_PUBLIC_API_URL`. No more hard-coding `http://localhost:3000`.
- **Bearer token** is injected from `localStorage.getItem("token")` on every request.
- **Envelope unwrap** — backend returns `{ success, data, ... }` and the client extracts `data` so you just get the value.
- **401 handling** — expired / revoked tokens automatically clear localStorage and bounce the user to `/login`.
- **TypeScript types** — every method returns a typed object (`Complaint`, `Technician`, `Role`, etc.).

## Standard usage pattern

```ts
import { api, type Complaint } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logError } from "@/lib/api-helpers";

async function load() {
  try {
    const list: Complaint[] = await api.complaints.list();
    setComplaints(list);
  } catch (error) {
    logError("page.context", error);          // structured log
    notify.error(error, "Failed to load");    // user feedback
  }
}
```

That's the **whole** boilerplate. No axios import, no token, no
`response.data.data`, no manual headers.

## Adding a new endpoint

1. Open the relevant domain file (or create a new one).
2. Add a method that calls `request.get / post / patch / delete`.
3. Export it from `index.ts` if it's a new domain.

Example — add a "close ticket" shortcut:

```ts
// src/lib/api/complaints.ts
close(id: string) {
  return request.patch<Complaint>(`/api/complaints/${id}`, { status: "CLOSED" });
},
```

Then `api.complaints.close(id)` is available everywhere.

## Migration checklist (for existing pages)

When migrating an old page that still uses `axios` directly:

1. Delete the `const API_URL = ...` line — the client knows the base URL.
2. Replace `import axios from "axios"` with `import { api } from "@/lib/api"`.
3. Remove the `const token = localStorage.getItem("token")` line — the
   interceptor injects it for you.
4. Replace `await axios.get(URL, { headers })` with `await api.<domain>.<method>()`.
5. Drop the `Array.isArray(response.data) ? ... : response.data.data` branch —
   the client already unwrapped.
6. Wrap the call in `try / catch { notify.error(error, "...") }`.

A 25-line `fetchX` function typically becomes 6 lines.

## Worked example: `src/app/maintenance/my-complaints/page.tsx`

```diff
- import axios from "axios";
- const API_URL = process.env.NEXT_PUBLIC_API_URL;
-
- const fetchComplaints = async () => {
-   try {
-     const token = localStorage.getItem("token");
-     const response = await axios.get(`${API_URL}/api/complaints/my`, {
-       headers: { Authorization: `Bearer ${token}` },
-     });
-     setComplaints(
-       Array.isArray(response.data) ? response.data : response.data.data || []
-     );
-   } catch (error) {
-     logError("my-complaints.page", error);
-   } finally {
-     setLoading(false);
-   }
- };

+ import { api, type Complaint } from "@/lib/api";
+ import { notify } from "@/lib/notify";
+
+ const fetchComplaints = async () => {
+   try {
+     const data = await api.complaints.mine();
+     setComplaints(data);
+   } catch (error) {
+     logError("my-complaints.page", error);
+     notify.error(error, "Failed to load complaints");
+   } finally {
+     setLoading(false);
+   }
+ };
```

## Pages still to migrate

These pages still use raw axios. Migrate them when you next touch them
(or in a focused refactor PR):

- `src/app/maintenance/tickets/page.tsx`
- `src/app/maintenance/tickets/create/page.tsx`
- `src/app/maintenance/tickets/[id]/page.tsx`
- `src/app/maintenance/technician/page.tsx`
- `src/app/maintenance/departments/page.tsx`
- `src/app/maintenance/location/page.tsx`
- `src/app/maintenance/user/page.tsx`
- `src/app/maintenance/roles/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/login-form.tsx`
- `src/components/dashboard/ComplaintTable.tsx`

Each one becomes ~30% shorter and impossible to forget the auth header on.
