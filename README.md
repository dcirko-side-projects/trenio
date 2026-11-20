# Trenio

Trenio is a mobile-first personal organizer for tasks, notes, ideas, and plans, with a secondary desktop layout. It uses React, TypeScript, Vite, Tiptap, Supabase, and Lucide. The hosted PWA is available at [trenio.pages.dev](https://trenio.pages.dev/).

## Features

- Organize items by category and keep pinned items in the Current view.
- Review scheduled and overdue tasks in Today, which uses the Europe/Zagreb time zone.
- Receive individual mobile push reminders three days before a deadline, on the deadline, and on the first overdue day. Each reminder displays the task name and opens the task on tap.
- Turn lines into plan steps, create linked tasks from saved checkboxes, and keep completion in sync.
- Convert ideas into plans while preserving their content.
- Search names, content, and categories without case or accent sensitivity. Enable archive search to include completed or archived items.
- Export current and archived data as JSON.

The hosted app requires internet access and a single owner account. Local development defaults to a clearly marked in-memory demo when Supabase is unconfigured. Demo edits disappear on refresh. Supabase storage checks record versions before accepting changes, so an older edit cannot silently overwrite a newer one.

## Run locally

Use Node.js 20.19+ or 22.12+ with npm. From the repository root:

```powershell
npm ci
npm run dev
```

Open the URL printed by Vite, usually http://127.0.0.1:5173.

## Connect a new Supabase project

1. Create a Supabase project and apply the SQL files in [supabase/migrations](supabase/migrations/) in filename order. Apply each migration once to the new database.
2. Create an owner account in Supabase Authentication and disable public signup. Insert the owner's Auth UUID into `private.app_owner` as described in the [technical documentation](docs/TECHNICAL.md).
3. Copy `.env.example` to `.env` and set the project URL and public publishable key. Keep administrator, secret, and service-role keys out of the frontend.
4. Restart Vite. Verify that the owner can save and reopen entries and that anonymous and secondary accounts cannot read the owner's data.

### Enable push reminders

Apply the task push migration and deploy the `dispatch-task-push` Edge Function with `supabase/config.toml`. Set `TASK_PUSH_PUBLIC_KEY`, `TASK_PUSH_PRIVATE_KEY`, and `TASK_PUSH_CRON_SECRET` as Edge Function secrets. Reuse the VAPID key pair on subsequent deployments to preserve subscriptions. Store the function's full HTTPS URL as `trenio_push_function_url` and the same scheduling secret as `trenio_push_cron_secret` in Vault. Apply `supabase/setup/schedule_task_push.sql`. Set only the public VAPID key as `VITE_TASK_PUSH_PUBLIC_KEY` for the frontend build.

On the phone, open **Više mogućnosti** → **Push obavijesti**, select **Uključi push na ovom uređaju**, and grant permission once. Tasks with a deadline have automatic reminders at 09:00 Europe/Zagreb. An extra reminder is available under **Dodatni podsjetnik** on a task. The most recently enabled device receives the reminders. Verify delivery with Trenio closed and tap the notification to confirm that it opens the task.

## Checks and build

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:connected
npm run check:public-access
npm run build
npm run preview
```

The demo and connected Playwright checks use isolated local servers. The public-access check uses the configured Supabase public API to verify that anonymous table access and public registration are denied. The build is output to `dist/`. The production site uses Cloudflare Pages Direct Upload. See the original release notes below for the Wrangler command and release verification.

## Backups

Use the app menu to export a fresh JSON backup, including archived items. Keep backups private. Use `npm run backup:prepare -- 'C:/path/trenio-backup.json'` to validate the export and generate a SQL rehearsal for temporary tables. The `--restore-empty` option generates a separate script for an empty, configured database. Confirm the target project and owner before running it. The restore script stops if it finds existing data. Generated SQL is stored in the ignored `.local/` directory. The backup size limit is 10 MB.

Push subscriptions, reminder schedules, and delivery records are excluded. Set any needed reminders again after restoring a backup.

## Documentation

- [Product and MVP](docs/PRODUCT.md)
- [Technical architecture](docs/TECHNICAL.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)
- [Current state](docs/CURRENT_STATE.md)
- [Original Croatian README with detailed setup, deployment, backup, and acceptance notes](https://github.com/dcirko-side-projects/trenio/blob/3932c30dc4652865a8c040790e522b67712aa1c3/README.md)
