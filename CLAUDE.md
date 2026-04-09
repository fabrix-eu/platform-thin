# CLAUDE.md — platform-front

Thin SPA frontend for Fabrix. Built with TanStack Router + React Query. This is the **active frontend** — all new frontend work happens here.

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:4002
npm run typecheck    # tsc -b (must pass before commit)
npm run build:test   # Build with localhost:4011 API (for feature specs)
npm run build:prod   # Build with production API (for deploy only)
npm run lint         # ESLint
```

No tests yet. The typecheck (`tsc -b`) is strict: unused locals/parameters are errors.

## Architecture

### Philosophy: thin client

The frontend holds **no business logic**. It is a thin rendering layer over the API:

- **Data fetching**: React Query (`useQuery`) — the query cache IS the app state
- **Mutations**: `useMutation` → API call → `invalidateQueries` to refresh
- **Validation**: 100% server-side. No Zod/yup schemas. Submit the form, display server errors via `FieldError` component
- **Auth**: JWT tokens in localStorage, auto-refresh on 401 (see `src/lib/api.ts`)

### 3-shell navigation

```
Shell A — Explorer (no sidebar)
  /                              Home (org cards or onboarding CTA)
  /organizations                 Directory (list + search + pagination)
  /organizations/$id             Public org profile
  /organizations/new             Search → claim/create flow
  /map                           MapLibre interactive map
  /communities                   Public communities explorer

Shell B — Mon Organisation (sidebar layout)
  /$orgSlug                      → redirect to /$orgSlug/dashboard
  /$orgSlug/dashboard            Stats overview
  /$orgSlug/profile              Edit org profile
  /$orgSlug/relations            Manage relations
  /$orgSlug/assessments          Assessment forms
  /$orgSlug/communities          My communities list
  /$orgSlug/settings             Org settings

Shell C — Community (nested in Shell B, tabs)
  /$orgSlug/communities/$communitySlug
  /$orgSlug/communities/$communitySlug/members
  /$orgSlug/communities/$communitySlug/events
  /$orgSlug/communities/$communitySlug/challenges
  /$orgSlug/communities/$communitySlug/matchmaking
```

**Key rule**: a community is always accessed THROUGH an organization. The org is the "lens" through which the user participates. That's why it's `/$orgSlug/communities/$communitySlug`, not `/communities/$communitySlug`.

### Route guards

Defined in `src/lib/router.ts`, used in `beforeLoad`:

- `requireAuth()` — redirects to `/login` if not authenticated
- `requireOrgMember({ params })` — checks user belongs to `orgSlug`, else redirects to public profile
- `requireCommunityMember({ params })` — checks org has access to `communitySlug`, else redirects to communities list

Guards read from the React Query cache (`queryClient.getQueryData(['me'])`).

### Header behavior

- **Shell A**: header shows global nav (Home, Directory, Map, Communities) + user menu
- **Shell B/C**: header is clean — only OrgSwitcher + user menu. Global nav is hidden. The sidebar footer has a "← Explorer" link to return to Shell A

### OrgSwitcher context-awareness

The OrgSwitcher computes the destination based on current context:
- **Shell A** → `/$newSlug/dashboard`
- **Shell B** (`/$orgSlug/profile`) → `/$newSlug/profile` (preserves section)
- **Shell C** (`/$orgSlug/communities/$c/...`) → `/$newSlug/communities` (does NOT preserve community, the other org may not be in it)

## File structure

```
src/
├── main.tsx                    Entry point (QueryClient + Router providers)
├── index.css                   Tailwind v4 theme (@theme inline)
├── lib/
│   ├── api.ts                  Fetch wrapper, JWT auth, auto token refresh
│   ├── auth.ts                 Login/logout/getMe, User types
│   ├── organizations.ts        Org API functions + types + ORG_KINDS
│   ├── router.ts               All route definitions + guards
│   └── queryClient.ts          React Query client (staleTime: 60s)
├── components/
│   ├── OrgSwitcher.tsx         Context-aware org dropdown
│   ├── UserMenu.tsx            Avatar dropdown (Radix Avatar)
│   ├── OrganizationsMap.tsx    MapLibre GL map
│   ├── MapLegend.tsx           Map filter/legend
│   ├── OrganizationForm.tsx    Reusable create/edit form
│   ├── FieldError.tsx          Server validation error display
│   └── ui/
│       └── avatar.tsx          Radix Avatar wrapper (shadcn pattern)
└── routes/
    ├── root.tsx                Header layout (Shell A nav or clean)
    ├── home.tsx                Org cards or onboarding CTA
    ├── login.tsx               Login form
    ├── map.tsx                 Map page
    ├── communities.tsx         Communities explorer
    ├── organizations/          Shell A org pages
    │   ├── list.tsx            Directory with search + pagination
    │   ├── show.tsx            Public org profile
    │   ├── new.tsx             3-step: search → claim → create
    │   └── edit.tsx            Edit org form
    ├── org/                    Shell B pages
    │   ├── layout.tsx          Sidebar layout
    │   ├── dashboard.tsx       Stats cards
    │   ├── profile.tsx         Org info
    │   ├── relations.tsx       Relations (stub)
    │   ├── assessments.tsx     Assessments (stub)
    │   ├── communities-list.tsx  Communities list
    │   └── settings.tsx        Settings (stub)
    └── community/              Shell C pages
        ├── layout.tsx          Tabs layout
        ├── index.tsx           Overview (stub)
        ├── members.tsx         Members (stub)
        ├── events.tsx          Events (stub)
        ├── challenges.tsx      Challenges (stub)
        └── matchmaking.tsx     Matchmaking (stub)
```

## Conventions

### Adding a new API resource

1. Create `src/lib/<resource>.ts` with types matching backend Blueprint fields exactly
2. Export API functions: `getResources()`, `getResource(id)`, `createResource(data)`, etc.
3. Use `api.get<T>()`, `api.post<T>()` from `src/lib/api.ts`
4. Types use snake_case (matching the API), not camelCase

### Adding a new route

1. Define the route in `src/lib/router.ts` using `createRoute()`
2. Add it to the route tree
3. Create the page component in `src/routes/`
4. Add `beforeLoad` guard if the route requires auth

### Forms and validation

```tsx
// Submit to server, display errors from API response
const mutation = useMutation({
  mutationFn: (data) => api.post('/resource', { resource: data }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
});

// In JSX:
<FieldError errors={mutation.error} field="name" />
```

No client-side validation. The server is the source of truth.

### Query keys

| Key | Data |
|-----|------|
| `['me']` | Current user + orgs + communities |
| `['organizations']` | Paginated list |
| `['organizations', id]` | Single org |
| `['organizations', 'map']` | All orgs for map |

### Styling

- **Tailwind CSS v4** — config is in `src/index.css` via `@theme inline`
- **Fonts**: Archia (display/headings), IBM Plex Sans (body)
- **Colors**: primary = purple (`hsl(262.1 83.3% 57.8%)`), see `@theme` block
- **UI components**: Radix primitives added as needed (not full shadcn). Wrappers go in `src/components/ui/`
- **Org kind badges**: use `ORG_KINDS[kind].color` from `src/lib/organizations.ts`

### API client (`src/lib/api.ts`)

- Base URL: `http://localhost:4001` (dev) / `https://api.fabrixproject.eu` (prod)
- Auto-unwraps `{ data: ... }` envelope
- On 401: tries `POST /auth_tokens/refresh`, retries original request. If refresh fails: clears tokens, redirects to `/login`
- Concurrent refresh calls are deduplicated

## Environment

```
Dev:  http://localhost:4002 (frontend) → http://localhost:4001 (backend)
Prod: GitHub Pages (static SPA) → https://api.fabrixproject.eu
```

No `.env` files. Uses `import.meta.env.PROD` to switch API base URL.
