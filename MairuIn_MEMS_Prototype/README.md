# MairuIn MEMS — Executive Management System (Prototype v0.3)

A responsive browser-based prototype for the General Manager's office. It is seeded from the workbook `GM_Funds_Services_Correspondence_Tracker_Final_Updated.xlsx` with 72 action records and 24 correspondence records at the time this prototype was generated.

## Included in v0.3
- Clickable Executive Dashboard cards that reveal the underlying open actions, overdue actions, due-soon actions, and open correspondence directly below the cards.
- Dedicated Overdue Actions view consolidating all overdue actions with owner, deadline, days overdue, priority, status, editing, search, and CSV export.
- Clickable cards and drill-down lists on Stanley’s Dashboard and Correspondence Dashboard.
- Action tracker: search, filter by status/workstream, add/edit/delete actions, update owners/deadlines/status, CSV export.
- Correspondence register: search, filter by status/category, log/edit/delete correspondence, record assignments, response deadlines, event dates, feedback and closure, CSV export.
- Bulk CSV import for actions and correspondence: download a template, review proposed records, and then confirm the import. The CSV file stays in the browser; only approved records are saved to the shared database.
- Invitation tracking: category, event date, RSVP/response deadline, invitation response, attendance status, and dashboard/register alerts for pending responses, near-term RSVP deadlines, and upcoming/past event dates.
- Responsive layout for phones and desktop browsers.
- Local demo mode saves changes in this browser using `localStorage`.
- Optional Supabase cloud mode for authenticated shared records across authorised users.

## Run the demo
1. Extract the ZIP to a folder.
2. Open `index.html` in a modern browser.
3. The app opens in **LOCAL DEMO** mode. Changes stay in that browser only.

## Enable shared online use
This prototype is not yet hosted online. To enable shared office use:
1. Create a Supabase project and use its Authentication feature.
2. Open the Supabase SQL Editor and run `supabase-schema.sql`.
3. In Supabase Auth, create accounts only for authorised officers. Keep public sign-ups disabled.
4. Copy `config.example.js` to `config.js` if needed, then enter the Supabase Project URL and anon/public key in `config.js`. The supplied `config.js` is blank by default.
5. Deploy this folder as a static website (for example, to a trusted static host). The cloud mode uses the Supabase JS client from a CDN, so the deployed browser needs internet access.
6. Sign in with an authorised email/password account. The app seeds the cloud tables with the bundled starter data only if the tables are empty.

**Security note:** never put the Supabase service-role key in browser code. The included starter RLS policies allow any authenticated user in this project's Auth tenant to read/write/delete all records, so invite only authorised staff. For production, add role-specific policies and an audit log before broad rollout.

## Current limitations / next phase
- Actual file uploads/attachments, scheduled reminders, audit trail, per-role permissions, automated email/phone notifications, and a managed deployment are not included yet. Invitation alerts appear inside the app; they do not send push/email notifications.
- For the first cloud initialization, the first authorised user to sign in while tables are empty seeds the records from this prototype. After that, the cloud records are the shared source of truth.
- Export both CSVs before testing changes to important records.

## Data source
The initial records were extracted from the master workbook's `Stanleys Action Tracker` and `Correspondence Register` sheets. Review the seeded data before treating this prototype as an official live system.
