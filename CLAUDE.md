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

All source lives in `src/` (assets, docs, config files and `jest.setup.ts` stay at the repo root). Paths in the rest of this file are relative to `src/` unless they start with a root-level name.

- `app/(tabs)` — tab screens; `app/*.tsx` — stack screens (`eventDetails`, `settings`, `dailyReadings`, `pdfViewer`). Expo Router finds `src/app` automatically. Every file under `app/` becomes a route (a test enforces nothing is parked there; delete unused screens, git history keeps them).
- `components` — reusable UI components
- `hooks` — custom hooks
- `services` — API and external services
- `domain` — pure business rules (no React, Expo, or AsyncStorage)
- `api` — raw Antiochian.org HTTP client
- `config` — environment variable access (`env.ts`)
- `types` — shared TypeScript types
- `utils` — pure utility functions
- `theme` — `colours.ts` (the app palette, used everywhere), `themedColors.ts` (a separate template palette that only backs `ThemedText`/`ThemedView`) and `commonStyles.ts`
- `constants` — app constants (URLs, bank details)
- `assets` (repo root) — images, fonts, etc.

Imports use the `@/` alias for `src/` (e.g. `@/lib/parishTime`) and `@assets/` for the root `assets/` folder (e.g. `require("@assets/images/orthodox/church.png")`). Both come from `tsconfig.json` `paths`; Expo's Metro and jest-expo read them, so there is no `babel.config.js` or `metro.config.js`.

### Naming

- Files that mainly export a component, class or interface are PascalCase (`EventItem.tsx`, `GoogleCalendarService.ts`, `CalendarDataService.ts`); everything else is camelCase (`parishTime.ts`, `homeRules.ts`, `useEvents.ts`, `colours.ts`).
- Use `.tsx` only when the file contains JSX; otherwise `.ts`.
- Australian spelling in identifiers and paths (`colours`, `favourites`), matching the existing `Colours` and `favourites*` names. `themedColors.ts` is the one exception: it backs the Expo template's `Colors` export.
- Tests sit beside the code as `name.test.ts[x]`. Tests for route files cannot (everything under `app/` becomes a route), so they live in `src/__tests__/`.

## Architecture

Data flows one way: **screen → feature hook → data hook → service → provider**.

- **Remote data sits behind interfaces.** `services/calendar` (`CalendarDataService`, Google Calendar implementation) and `services/liturgical` (`LiturgicalDataService`, Antiochian.org implementation) each export a module-level singleton from their `index.ts` (`calendarService`, `liturgicalService`). Screens and hooks depend on the interface; provider details and mappers (`googleCalendarMapper`, `antiochianMapper`) stay inside the service folder. Swap providers in `index.ts`.
- **Local persistence goes through repositories.** `services/favourites` and `services/settings` pair a repository (the only code that touches AsyncStorage, with private keys) with a Zustand store (in-memory state, `hydrate()` loads persisted values). `app/_layout.tsx` hydrates both at startup and holds the splash screen until settings are ready.
- **Feature hooks orchestrate screens.** `useHomeFeature` / `usePrayerFeature` combine the data hooks (`useEvents`, `useDailySaint`, `useFastDay`) plus refresh/selection state, so screens only render. Pure helpers for them live in `utils/homeRules.ts` and `utils/dateUtils.ts`.
- **Event calendars are defined in two places that must stay in sync by name:** `domain/calendarSources.ts` (name, colour, image — also drives the Settings screen order) and `services/calendar/googleCalendarConfig.ts` (Google calendar IDs). The `source` name on each event keys colours and per-calendar notification settings.
- **Time:** the parish is on `Australia/Melbourne` regardless of device time zone. Use `now()` and the helpers in `lib/parishTime.ts` instead of `new Date()` for "what day is it" logic; tests pin the clock with `setNow`/`resetNow` rather than fake timers. A few legacy `new Date()` call sites remain — don't copy them.
- **Notifications** are being split into three parts (see `docs/notification-planner.md`): a pure planner (`domain/notificationPlanner.ts`, must not import React/Expo/AsyncStorage or read the clock), a gateway over `expo-notifications` (`services/notifications/notificationGateway.ts`), and a not-yet-written reconcile step. Expo's own scheduled list is meant to be the only record of what is scheduled. Today the saint/favourite/calendar notification modules in `services/notifications` call the gateway directly, and the root layout installs the handler/listeners (`services/notifications/appNotifications.ts`) and tops up the 7-day saint schedule at startup.
- Prefer a Zustand store for new shared cross-screen state.

## Testing

Tests are colocated (`*.test.ts[x]` beside the source, `components/__tests__`) plus screen/hook-level tests in `src/__tests__/`. Service tests mock at the lowest layer (e.g. `AntiochianLiturgicalService.network.test.ts` mocks only axios so the real client runs). Coverage is collected from `src/{app,components,domain,hooks,services,utils,api,config}` (see `collectCoverageFrom` in `package.json`).

## Docs

`docs/` holds an architecture snapshot, refactoring plan, and notification design, and `issue-drafts.md` the backlog drafts from that review. They were written at earlier commits (before the move into `src/`, for one), so verify against the code before relying on them.
