# Awaaz Operator — Admin Panel

**Status:** Frontend-only admin UI (React + TypeScript)

---

## 🚀 Overview
Awaaz Operator is the admin dashboard for monitoring user-reported content and incidents. This README documents the pages available, UI features, recent fixes, and how to run and test the app locally. Note: this project uses static/mock data and no backend integration unless explicitly wired.

## 🧭 Pages (list & purpose)
| Path | Page | Purpose |
|---|---|---|
| `/` | Event | Event queue and moderation dashboard (approve/disapprove, create event, upload media)
| `/event/:id` | Event Detail | Detailed view with media preview, timeline, and editing tools
| `/rescue` | Rescue | Rescue-specific console (tasks, dispatch, resolve)
| `/sos` | SOS Monitoring | SOS-only monitoring dashboard with quick actions (UI-only)
| `/logs` | Logs | Activity and audit logs
| `/users` | Users | User management UI
| `/reports` | Reports | Reports (post/comment/profile)
| `/notifications` | Notifications | Admin notifications
| `/login` `/register` `/forgot-password` | Auth | Authentication flows

## ✨ Key UI Features
- Responsive dark-themed admin panel (Tailwind + ShadCN UI components)
- Event moderation: Approve / Disapprove with per-item spinner and toasts
- Create Event dialog with validations and media upload (image/video)
- Uploads: file preview, replace/remove, thumbnail support (client-side previews)
- Media preview popup (dialog) with accessible title and controls
- Rescue page: dedicated dashboard tailored for rescue tasks (create, dispatch, resolve)
- SOS Monitoring page: summary cards and per-SOS actions (Mark Active / Escalate / Resolve) — local state only
- Timeline and escalation UI for events

## 🧩 Recent Important Changes / Fixes
- Fixed EventDetail to use route `id` and show correct user/event data (no hardcoded names)
- Implemented upload preview & fixed blob URL revoke bug (previews persist for display)
- Media now opens in a popup dialog (not a new browser tab); dialog uses an accessible `DialogTitle`
- Approve/Disapprove buttons now update UI state and show loading feedback (simulate API)
- Created a dedicated Rescue dashboard (task list + details), replacing earlier static page
- Added SOS Monitoring page with reusable `SOSCard` component
- Fixed parser error (mixed `??` and `||`) and missing icon imports (AlertTriangle)

## 📂 Notable files
- `src/pages/Event.tsx` — main events dashboard & create event dialog
- `src/pages/EventDetail.tsx` — detail view, media popup, timeline
- `src/pages/Rescue.tsx` — rescue-specific dashboard & task workflow
- `src/pages/SosMonitoring.tsx` — SOS monitoring page (new)
- `src/components/layout/AdminSidebar.tsx` — sidebar (SOS menu added)

## ⚙️ Tech stack
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn UI primitives (Dialog, Card, Select, etc.)
- lucide-react icons
- sonner (toasts)
- date-fns (date formatting)

## ▶️ Run locally
1. Install dependencies:
```bash
npm install
```
2. Start dev server:
```bash
npm run dev
```
3. Open the URL shown in the terminal (usually `http://localhost:5173`).

## ✅ How to test core flows (UI-only)
- Event moderation: visit `/`, click **Approve** or **Disapprove** on a pending event and watch the dashboard counts update.
- Media upload: Open **Create Event**, attach image/video, preview, and submit. Check Event Detail media popup.
- Rescue: visit `/rescue` → create tasks → Dispatch / Resolve / Complete actions update UI.
- SOS: visit `/sos` → try action buttons to change statuses locally and watch summary counts.

## 📝 Notes & Next Steps
- The entire app currently uses local/mock data. To persist actions, wire the handlers to a backend API endpoints and replace mock data with fetched resources.
- Consider adding tests, real uploads, and real-time sync (websockets) if you want live multi-admin updates.

---

If you'd like, I can also add CONTRIBUTING and DEVELOPMENT notes (commands, common debugging steps, and test guidelines). Tell me which section you'd like expanded next.
