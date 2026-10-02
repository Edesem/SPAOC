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
- `npm run lint` — `expo lint` (ESLint 9 flat config).
- `npm run typecheck` — `tsc --noEmit` (strict mode).
- `npm test` — Jest in **watch mode** (`--watchAll`). For a one-shot run use `npx jest --watchAll=false`.
- Single test file: `npx jest --watchAll=false services/calendar/googleCalendarMapper.test.ts`; single test by name: add `-t "name"`.
- `npm run coverage` — what CI runs; fails below 80% global line coverage. CI (`.github/workflows/ci.yml`) runs coverage, then lint, then typecheck, on Node 24.

Local setup needs a git-ignored `.env` with `EXPO_PUBLIC_{IOS,ANDROID}_CAL_{PROD,DEV}_KEY` (Google Calendar API keys). `constants/consts.tsx` **throws at import time** if the key for the current platform/build is missing. Jest never loads `.env`, so `jest.setup.ts` injects fixture keys and mocks AsyncStorage.

## Project Structure

- `app/(tabs)` — tab screens; `app/*.tsx` — stack screens (`eventDetails`, `settings`, `dailyReadings`, `pdfViewer`). Every file under `app/` becomes a route (a test enforces nothing is parked there; unused screens go in `discarded/`).
- `components` — reusable UI components
- `hooks` — custom hooks
- `services` — API and external services
- `domain` — pure business rules (no React, Expo, or AsyncStorage)
- `api` — raw Antiochian.org HTTP client
- `types` — shared TypeScript types
- `utils` — pure utility functions
- `styles`, `constants` — colours/common styles and app constants
- `assets` — images, fonts, etc.

Imports use the `@/` alias for the repo root (e.g. `@/domain/parishTime`).

## Architecture

Data flows one way: **screen → feature hook → data hook → service → provider**.

- **Remote data sits behind interfaces.** `services/calendar` (`CalendarDataService`, Google Calendar implementation) and `services/liturgical` (`LiturgicalDataService`, Antiochian.org implementation) each export a module-level singleton from their `index.ts` (`calendarService`, `liturgicalService`). Screens and hooks depend on the interface; provider details and mappers (`googleCalendarMapper`, `antiochianMapper`) stay inside the service folder. Swap providers in `index.ts`.
- **Local persistence goes through repositories.** `services/favourites` and `services/settings` pair a repository (the only code that touches AsyncStorage, with private keys) with a Zustand store (in-memory state, `hydrate()` loads persisted values). `app/_layout.tsx` hydrates both at startup and holds the splash screen until settings are ready.
- **Feature hooks orchestrate screens.** `useHomeFeature` / `usePrayerFeature` combine the data hooks (`useEvents`, `useDailySaint`, `useFastDay`) plus refresh/selection state, so screens only render. Pure helpers for them live in `utils/homeRules.ts` and `utils/dateUtils.ts`.
- **Event calendars are defined in two places that must stay in sync by name:** `domain/calendarSources.ts` (name, colour, image — also drives the Settings screen order) and `services/calendar/googleCalendarConfig.ts` (Google calendar IDs). The `source` name on each event keys colours and per-calendar notification settings.
- **Time:** the parish is on `Australia/Melbourne` regardless of device time zone. Use `now()` and the helpers in `domain/parishTime.ts` instead of `new Date()` for "what day is it" logic; tests pin the clock with `setNow`/`resetNow` rather than fake timers. A few legacy `new Date()` call sites remain — don't copy them.
- **Notifications** are being split into three parts (see `docs/notification-planner.md`): a pure planner (`domain/notificationPlanner.ts`, must not import React/Expo/AsyncStorage or read the clock), a gateway over `expo-notifications` (`services/notifications/notificationGateway.ts`), and a not-yet-written reconcile step. Expo's own scheduled list is meant to be the only record of what is scheduled. Today the saint/favourite/calendar notification modules in `services/notifications` call the gateway directly, and the root layout installs the handler/listeners (`services/notifications/appNotifications.ts`) and tops up the 7-day saint schedule at startup.
- `utils/eventBus.ts` (eventemitter3) is a leftover cross-screen broadcast channel; prefer a Zustand store for new shared state.

## Testing

Tests are colocated (`*.test.ts[x]` beside the source, `components/__tests__`) plus screen/hook-level tests in the top-level `__tests__/`. Service tests mock at the lowest layer (e.g. `AntiochianLiturgicalService.network.test.ts` mocks only axios so the real client runs). Coverage is collected from `app`, `components`, `domain`, `hooks`, `services`, `utils`, `api`.

## Docs

`docs/` holds an architecture snapshot, refactoring plan, and notification design, and `issue-drafts.md` the backlog drafts from that review. They were written at earlier commits (e.g. `utils/notifications.ts` is now a stub), so verify against the code before relying on them.
