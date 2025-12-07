# Dubai Nest Hub - AI Coding Agent Instructions

**Last Updated**: December 2025 | Vite 7, React 18, TypeScript, Supabase PostgreSQL, Node.js admin API

## Quick Start
```sh
npm i                  # Install dependencies
npm run dev            # Start dev server on :8080
npm run build          # Production build → dist/
npm run lint           # ESLint check
```

### Start Admin API (Required for Conversations)
```sh
cd truenester-chatbot-api
npm i                  # First time only
npm run dev            # Starts on port 4000
```
Keep this running in a separate terminal for conversation/lead management to work.

## Project Overview
**Dubai Nest Hub** is a full-stack real estate platform for Dubai properties targeting Indian investors. Frontend: React 18 + Vite + TypeScript + shadcn/ui. Backend: Node.js admin API in `truenester-chatbot-api/` + Supabase PostgreSQL with RLS policies. Supports property listings (Buy/Rent/Sell), lead tracking via chatbot, and admin management.

## Architecture

### Frontend (React 18 + Vite 7)
- **Routing**: React Router v6; pages in `src/pages/`, admin in `src/pages/admin/`
- **State**: TanStack React Query for server data; React hooks for local UI state
- **Build**: Vite alias `@` → `src/`; auto-tagged components in dev mode via `lovable-tagger`
- **Styling**: Tailwind CSS with class-based dark mode; shadcn/ui components
- **UI Feedback**: Use `useToast()` hook from `@/hooks/use-toast` for success/error messages

### Backend (Node.js + Supabase)
- **Admin API Server**: `truenester-chatbot-api/src/server.ts` (Express, 636 lines); handles conversations, exports, analytics, agent assignment
- **Database**: Supabase PostgreSQL with RLS; migrations in `database-migrations/` (run manually in Supabase UI)
- **Auth**: Supabase localStorage-backed auth; env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Key Data Models & Patterns

### Property Type Storage (Pipe-Delimited)
Properties store multiple types as `"apartment|penthouse|villa"`. **Always use `parsePropertyTypes()`** from `src/lib/utils.ts` when reading—it splits on `|` and `{,}` and trims whitespace. Example:
```typescript
import { parsePropertyTypes, getPrimaryPropertyType } from "@/lib/utils";
const types = parsePropertyTypes("apartment|penthouse"); // ["apartment", "penthouse"]
const primary = getPrimaryPropertyType(property.property_type); // "apartment"
```

### Admin Form Pattern (PropertyForm.tsx Template)
1. **Component structure**: Wrap in `AdminLayout`, use `useParams()` for `id` (edit vs. create)
2. **Local form state**: `formData` object + handlers like `handleInputChange(field, value)`
3. **Array fields**: Manage with separate input + "Add" button (e.g., `newFeature` → `features` array)
4. **Rich text**: Use `AdvancedRichTextEditor` (1500+ line Tiptap component) with `minHeight` prop
5. **Submit flow**: Build typed object → `supabase.from("table").upsert([data]).select()` → navigate on success
6. **Image upload**: Use `supabase.storage.from("property-images").upload()` → get public URL → store in array

### Query Filtering (Conversations Example)
Conversations use complex filters in `useConversationFilters.ts` and `adminConversations.ts`:
- **Status filters**: `status` array (AND-ed) — "new", "in-progress", "closed"
- **Lead quality**: `leadQuality` array — "hot" (>80), "warm" (50–80), "cold" (<50)
- **Score range**: `[min, max]` tuple for lead_score 0–100
- **Date range**: `from` and `to` ISO strings
- **Full-text search**: `query` string against customer name/email/phone
- **Intent**: customer's goal ("buy", "rent", "sell")
- **Sort**: "recent", "score-high", "score-low"

**Key insight**: Filters are **AND-ed** together. Build payload as `{ status: [...], leadQuality: [...], scoreRange: [80, 100], ... }` then pass to `adminConversationsApi.fetchConversations(filterPayload, page, pageSize)`.

### Lead Scoring & Quality
- `lead_score`: 0–100 stored in DB (deterministic, recalculated when needed)
- `lead_quality`: Computed from `lead_score` → "hot"/"warm"/"cold"
- `leadScoreBreakdown`: Object with components (intent, engagement, actions, contactInfo) — used for transparency
- **Client-side resilience**: Even if stored `lead_score` is stale, recalculate from breakdown client-side when displaying

## Integration Points

### Admin API (`truenester-chatbot-api/`)
- **Base URL**: From `VITE_ADMIN_API_URL` env var (e.g., `http://localhost:4000/api`)
- **Port**: Defaults to 4000; set via `PORT` env var
- **Auth**: Expects `x-admin-api-key` header; value from `ADMIN_API_KEY` env var
- **Endpoints**:
  - `GET /api/admin/conversations?status=new&leadQuality=hot&sort=recent` — fetch with filters
  - `PATCH /api/admin/conversations/:id` — update status, notes, assignment
  - `POST /api/admin/conversations/:id/export?format=csv|xlsx|pdf` — export conversations
  - `POST /api/chatbot/leads` — chatbot widget posts new lead data here
- **Response mapping**: `adminConversations.ts` has `mapConversation()`, `mapMessage()`, etc. to normalize API ↔ DB field names (snake_case ↔ camelCase)

### Chatbot Widget (`TrueNesterChatbot.tsx`)
- Rendered on **all pages except `/admin`** (controlled in `AppRoutes` using `location.pathname`)
- Config via `VITE_CHATBOT_API_URL` env var
- Captures: customer name, phone, email, intent, budget, property type, area
- Posts to `/api/chatbot/leads` with metadata
- **Placement**: Loaded conditionally after checking `isAdminRoute`

### Contact Form Integration
- Contact page (`Contact.tsx`) creates conversations directly in admin panel
- Tagged as "contact-form", "general-inquiry", and department name
- Lead score defaults to 60 (warm) — genuine interest via contact form
- Integrates with Slack webhooks via `VITE_SLACK_WEBHOOK_URL` for instant notifications
- All form submissions appear in `/admin/conversations` with "new" status

### Property Inquiry Integration
- Property detail page (`PropertyDetail.tsx`) has inquiry form
- Creates conversation with intent: "property_inquiry"
- Captures property details, customer info, custom message
- Sends Slack notifications when submitted
- Available in admin panel with property context

### Chatbot & Lead Capture
- Chatbot widget (`TrueNesterChatbot.tsx`) on all public pages
- Captures lead info via flows (intent, budget, location, property type)
- Posts to `/api/chatbot/leads` endpoint in backend API
- Backend creates conversation + sends Slack notification
- Lead score auto-calculated based on conversation quality

### Supabase Client
- Initialized in `src/integrations/supabase/client.ts` (auto-generated by `supabase gen types typescript --local`)
- Imported as: `import { supabase } from "@/integrations/supabase/client"`
- **Auth persistence**: localStorage with auto-refresh enabled

## Common Workflows

### Add a New Admin Page
1. Create `src/pages/admin/[Feature].tsx` with `useParams()` for ID
2. Wrap in `<AdminLayout>` 
3. Use local `formData` state + `handleInputChange(field, value)` pattern — example:
   ```typescript
   const handleInputChange = (field: keyof FormData, value: any) => {
     setFormData(prev => ({ ...prev, [field]: value }));
   };
   ```
4. For arrays: separate input state + "Add" button (e.g., `newFeature` → `features` array)
5. On submit: validate → `supabase.from("table").upsert([data]).select()` → toast + navigate
6. Add route in `src/App.tsx` under `/admin`: 
   - `<Route path="/admin/feature/new" element={<Feature />} />`
   - `<Route path="/admin/feature/edit/:id" element={<Feature />} />`
7. Import component at top of `App.tsx`

### Display a Property
- Always filter by `published: true` for public pages
- Parse `property_type` with `parsePropertyTypes()` to display all variants
- Render images from `images` array; set `featured_image` for hero
- For sale properties: check `purpose === 'sale'` to show payment plans, floor plans, developer info
- For rental properties: simplified view, no payment terms

### Query Invalidation After Mutations
After `supabase.update()` or `.insert()`, always invalidate React Query:
```typescript
await supabase.from("conversations").update(data).eq("id", id);
queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
queryClient.invalidateQueries({ queryKey: ["conversations"] });
```

### Types & Code Generation
- **Never manually edit** `src/integrations/supabase/types.ts` — auto-generated
- Regenerate after DB schema changes: `supabase gen types typescript --local`
- All Supabase tables have matching TypeScript interfaces in `types.ts`
- Custom conversation types defined in `src/types/conversations.ts`

## Common Gotchas

1. **Property type formatting**: Always `parsePropertyTypes()` before use — don't assume single type
2. **HTML from Tiptap**: Tiptap editor returns HTML string; store as-is and render with `dangerouslySetInnerHTML`
3. **Published flag**: Public pages filter `published: true`; draft properties never visible to users
4. **Conversation filters are AND-ed**: Multiple status + leadQuality filters together, not OR-ed
5. **Lead quality thresholds**: >80 = hot, 50–80 = warm, <50 = cold (hardcoded in multiple places)
6. **Lovable commits**: When using Lovable UI editor, changes auto-commit; pull before pushing locally
7. **Image storage path**: All property images go to `property-images` bucket; use relative filenames for uploads
8. **Amenity icons**: Use `amenityIcons.tsx` mapping — exports `getAmenityIcon(name)` that returns Lucide icons
9. **Catch-all route**: Always add new routes **before** `<Route path="*" element={<NotFound />} />` in `App.tsx`

## Database Migrations

1. Write SQL in `database-migrations/[name].sql`
2. Copy SQL into Supabase dashboard → SQL Editor → Run
3. After schema changes, regenerate types: `supabase gen types typescript --local`
4. Commit both migration SQL and generated `types.ts` changes

## Development Tools & Testing

### Diagnostic Pages
- **Setup Database**: `/setup-database` — run initial DB setup scripts
- **Diagnostic Page**: `/diagnostic` — debug Supabase connection, check auth, test queries

### Linting & Code Quality
- Run `npm run lint` before commits — uses ESLint with TypeScript rules
- Vite dev mode auto-tags components via `lovable-tagger` plugin for debugging

### Admin API Testing
- Test script: `truenester-chatbot-api/test-api.js` — validates endpoints
- Uses `tsx` for TypeScript execution in development
- Morgan logger enabled in dev mode for HTTP request logging

## Deployment

- **Frontend**: `npm run build` → `dist/` → host on any static server (Vercel, Netlify, GitHub Pages)
- **Admin API**: Host `truenester-chatbot-api/` separately; requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY` env vars
- **Environment vars** (frontend `.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ADMIN_API_URL`, `VITE_CHATBOT_API_URL`, `VITE_SLACK_WEBHOOK_URL` (optional)
- **Environment vars** (backend `.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `SLACK_WEBHOOK_URL` (optional), `FRONTEND_URL` (optional)
