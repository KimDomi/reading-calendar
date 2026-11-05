# 독서 달력

Dependency-free static app. Browser-local data stays in `reading-calendar-v1`;
import recovery uses `reading-calendar-pre-import`. No runtime API or cloud data
store is required.

## Development

Node.js 20 or newer is recommended. Run `npm ci` to install build-time holiday data tools. The deployed browser app requires no runtime dependencies or API calls.

```sh
npm run dev
npm run check
```

The product direction and release gates are tracked in [`ROADMAP.md`](ROADMAP.md).

## Unconfirmed progress

Registration alone does not confirm progress. Older registration-only confirmations are distinguished from actual records, including explicit zero-page records. Pending past allocations are checked on startup, local midnight, foreground return and calendar navigation. Automatic prompts are limited to once per local date on this device; the calendar's manual confirmation button remains available. Open dialogs, input and a running timer defer automatic prompts. The confirmation still records progress on the day it is submitted rather than assigning it to historical dates.

## Reading rest days

Settings support weekly rest days, optional Korean public holidays, and dated overrides (`rest` / `read`). Date overrides take priority. These scheduling preferences are stored with reading data and included in JSON backups; merging keeps the current preferences. Changing them recalculates allocations from today and preserves earlier allocations and all records. At least one weekly reading day must remain available. Deadline plans without any available reading days show a warning instead of receiving allocations.

Exports also include theme, notification toggle and notification time. The import preview offers an opt-in checkbox (selected by default) to restore included preferences and rest days, for either merge or replacement. Without settings in a legacy backup, or with that checkbox cleared, current preferences remain. Pre-import recovery includes preferences. Active timer sessions are kept on the current device and are not exported.

## Source

- `dist/app.js`: UI, interactions and derived display indexes. Rebuild display
  indexes on rendering; recalculate schedules only after explicit user actions.
- `dist/engine.js`: pure allocation, recording, graph and ordering functions.
- `dist/backup.js`: versioned JSON backup validation and non-destructive merging.
- `dist/style.css` / `dist/index.html`: responsive layout and entry point.

The backup/import entry belongs in the Settings tab. Records and historical
allocations must survive mode changes, reordering, pausing and schedule updates.
Batch confirmations validate all values before committing any progress.

## Before publishing

Run `node scripts-versions.mjs` to refresh content hashes in module imports and
HTML references. This keeps browser caches from mixing incompatible versions.
Then run:

```
node --input-type=module --check < dist/app.js
node --experimental-vm-modules test-startup.mjs
node test.mjs
node test-backup.mjs
```

The startup test executes the complete module graph with a minimal document. It
checks initialization, tab switching and backup-menu initialization; it does not
substitute for real touch or visual browser testing. Use explicit module parsing,
not Node's automatic syntax detection, for the browser entry.

Cloudflare Workers builds from `main` using `node scripts-versions.mjs`. This generates Korean public holiday dates (2020–2050) and refreshes browser cache hashes. Newly proclaimed temporary holidays need a data update in `scripts-holidays.mjs`.
