# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This React Native application is called SPAOC. It is primarily a calendar application for a specific local Antiochian Orthodox Church. The first and main page (index.tsx) is the events screen. There is also a prayer screen that uses an api to retrieve daily readings and services.

## Tech Stack

- React Native
- TypeScript
- Expo
- State management: Zustand
- Styling: StyleSheet
- Testing: Jest + React Native Testing Library
- Package manager: npm

## Commands

- `npm start` — Metro with the dev client (`expo start --dev-client`); there is no Expo Go support. `npm run ios` / `npm run android` build and run the native app (`ios/` and `android/` are git-ignored).
- `npm run lint` — `expo lint .` (ESLint 9 flat config, whole repo).
- `npm run typecheck` — `tsc --noEmit` (strict mode).
- `npm test` — Jest in **watch mode** (`--watchAll`). For a one-shot run use `npx jest --watchAll=false`.
- Single test file: `npx jest --watchAll=false src/services/calendar/googleCalendarMapper.test.ts`; single test by name: add `-t "name"`.
- `npm run coverage` — what CI runs; fails below 80% global line coverage. CI (`.github/workflows/ci.yml`) runs coverage, then lint, then typecheck, on Node 24.

Local setup needs a git-ignored `.env` (copy `.env.example`) with `EXPO_PUBLIC_{IOS,ANDROID}_CAL_{PROD,DEV}_KEY` (Google Calendar API keys). `config/env.ts` is the only code that reads `EXPO_PUBLIC_*`; `services/calendar/index.ts` calls it at import time, so the app **throws at start-up** if the key for the current platform/build is missing. Jest never loads `.env`, so `jest.setup.ts` injects fixture keys and mocks AsyncStorage.

## Project Structure

All source lives in `src/`. Assets, docs, config files and `jest.setup.ts` stay at the repo root. The dependency direction is **`app` → `features` → shared**, and ESLint enforces it (see below).

- `app/` — routes only. `_layout.tsx` and `+not-found.tsx` are real; every other file is a one-line `export { default } from "@/features/<f>/screens/<X>Screen"`. Expo Router finds `src/app` on its own. Every file under `app/` becomes a route (a test enforces nothing is parked there; delete unused screens, git history keeps them).
- `features/<name>/` — one folder per feature, with only the subfolders it needs (`screens`, `components`, `hooks`, `services`, `domain`, `constants.ts`) and an `index.ts` that is its public API:
  - `calendar` — events, favourites, fasting, saints. Google Calendar service, favourites repository/store, Home/Favourites/EventDetails screens, `EventData` type.
  - `prayer` — daily readings and service texts. Antiochian.org client and service, `usePrayerFeature`, PDF viewer and Daily Readings screens.
  - `notifications` — no UI. The pure planner, the `expo-notifications` gateway, the saint/favourite/calendar modules, and the app-level handler/listeners.
  - `settings` — Settings screen and `SettingPicker`. The settings repository and store are shared (see below).
  - `parish` — About and Help screens, `DonateSection`, bank/Square constants.
- Shared code (never imports a feature): `components` (`ThemedText`, `ThemedView`, `ui/`), `hooks` (theme and `useForegroundRefresh`), `services/settings` (repository + store, read by theme, calendar and notifications), `domain/calendarSources.ts` (read by the shared settings repository), `lib` (`parishTime`, `haptics`), `theme`, `config`, `constants`, `types/routes.ts`.
- `assets/` (repo root) — images and fonts.

Import rules: inside a feature use relative imports; across features go through the other feature's index (`@/features/calendar`); route files and shared code use `@/`. `import/no-restricted-paths` in `eslint.config.js` fails the build on shared → feature, feature → `app`, and deep cross-feature imports. A lint rule also keeps `notificationPlanner.ts` free of React/Expo/AsyncStorage/`now()`/`new Date()`.

Aliases: `@/` is `src/` and `@assets/` is the root `assets/` folder (e.g. `require("@assets/images/orthodox/church.png")`). Both come from `tsconfig.json` `paths`; Expo's Metro and jest-expo read them, so there is no `babel.config.js` or `metro.config.js`.

### Naming

- Files that mainly export a component, class or interface are PascalCase (`EventItem.tsx`, `GoogleCalendarService.ts`, `CalendarDataService.ts`); everything else is camelCase (`parishTime.ts`, `homeRules.ts`, `useEvents.ts`, `colours.ts`).
- Use `.tsx` only when the file contains JSX; otherwise `.ts`.
- Australian spelling in identifiers and paths (`colours`, `favourites`). `theme/themedColors.ts` is a separate template palette that only backs `ThemedText`/`ThemedView`; `theme/colours.ts` is the app palette.
- Tests sit beside the code as `name.test.ts[x]`. Tests for route files cannot (everything under `app/` becomes a route), so they live in `src/__tests__/`.

## Architecture

Data flows one way: **screen → feature hook → data hook → service → provider**.

- **Remote data sits behind interfaces.** `features/calendar/services` (`CalendarDataService`, Google Calendar implementation) and `features/prayer/services` (`LiturgicalDataService`, Antiochian.org implementation) each export a module-level singleton from their `index.ts` (`calendarService`, `liturgicalService`). Screens and hooks depend on the interface; provider details and mappers (`googleCalendarMapper`, `antiochianMapper`) stay inside the service folder. Swap providers in `index.ts`.
- **Local persistence goes through repositories.** `features/calendar/favourites` and `services/settings` pair a repository (the only code that touches AsyncStorage, with private keys) with a Zustand store (in-memory state, `hydrate()` loads persisted values). `app/_layout.tsx` hydrates both at startup and holds the splash screen until settings are ready.
- **Feature hooks orchestrate screens.** `useHomeFeature` / `usePrayerFeature` combine the data hooks (`useEvents`, `useDailySaint`, `useFastDay`) plus refresh/selection state, so screens only render. Pure helpers for them live in `features/calendar/domain` (`homeRules`, `dateUtils`).
- **Event calendars are defined in two places that must stay in sync by name:** `domain/calendarSources.ts` (name, colour, image — also drives the Settings screen order) and `features/calendar/services/googleCalendarConfig.ts` (Google calendar IDs). `googleCalendarConfig.test.ts` fails if they drift. The `source` name on each event keys colours and per-calendar notification settings.
- **Time:** the parish is on `Australia/Melbourne` regardless of device time zone. Use `now()` and the helpers in `lib/parishTime.ts` instead of `new Date()` for "what day is it" logic; tests pin the clock with `setNow`/`resetNow` rather than fake timers. A few legacy `new Date()` call sites remain — don't copy them.
- **Notifications** are split into three parts (see `docs/notification-planner.md`): a pure planner (`features/notifications/notificationPlanner.ts`), a gateway over `expo-notifications` (`notificationGateway.ts`), and a reconcile step (`syncNotifications.ts`). Expo's own scheduled list is the only record of what is scheduled. `syncNotifications` reconciles saint notifications only (it runs from the root layout once settings hydrate, and after the Settings saint toggle); favourite notifications still call the gateway directly, and the calendar kind is unwired (#130). The root layout also installs the handler/listeners (`appNotifications.ts`).
- Prefer a Zustand store for new shared cross-screen state.

## Testing

Tests are colocated (`*.test.ts[x]` beside the source), apart from tests of route files in `src/__tests__/`. Service tests mock at the lowest layer (e.g. `AntiochianLiturgicalService.network.test.ts` mocks only axios so the real client runs). Coverage is collected from `src/{app,components,config,domain,features,hooks,lib,services}` (see `collectCoverageFrom` in `package.json`), excluding `constants.ts` files, which are pure data. A new top-level folder under `src/` needs adding to that list or its code is not measured.

## Docs

`docs/` holds an architecture snapshot, refactoring plan, notification design, `issue-drafts.md` (the backlog drafts from that review) and `store/` (App Store screenshots). The older docs were written before the move into `src/` and feature folders, so their file links are stale: verify against the code before relying on them.
