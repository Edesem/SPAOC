# Current architecture (observed)

This repository is not an AI/agent application. It is a cross-platform Expo/React Native app for St Paul’s parishioners. The codebase currently centers on screen components, custom hooks, a few utility modules, local persistence, and integrations with Google Calendar, the Antiochian liturgical API, Expo Notifications, and external URLs.

## 1. System overview

### What the app does today

The app currently provides:

- A home screen that lists parish events grouped by day.
- A favourites screen that stores selected events in local storage and shows them later.
- A prayer screen that fetches liturgical readings and service PDFs for a selected date.
- A settings screen for notification preferences and a small amount of application state.
- Screens for event details, daily reading text, and PDF viewing.
- Local notifications for “Saint of the Day” and some notification-related settings.

### Major components

- Expo Router screens under [app/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app) and [app/(tabs)/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs))
- Custom data hooks under [hooks/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks)
- API and external integration modules under [api/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api) and [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx)
- Persistence and notification helpers under [utils/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils)
- Reusable UI under [components/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components)

### External dependencies and services

The app integrates with:

- Google Calendar APIs for parish events, fasting dates, saints, and related calendars.
- The Antiochian liturgical API via [api/AntiochianApi.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api/AntiochianApi.ts).
- Expo Notifications for scheduling local notifications.
- AsyncStorage for favourites and settings.
- Expo Router, React Navigation, and React Native UI libraries.

### Main execution flow

The runtime starts through Expo Router ([package.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/package.json), [app/_layout.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/_layout.tsx)). The tab layout mounts the main screens, which then load data from hooks and route navigation. The app uses a mix of direct component state, custom hooks, and module-level utilities rather than a single application state layer.

## 2. Architecture

The current architecture is a feature-oriented screen-based app with a fairly thin “UI shell” and business/data concerns spread across screens, hooks, and utilities.

### High-level structure

- Screen components own a large amount of UI behavior, layout, and state.
- Custom hooks act as data-fetching adapters for specific screens.
- Utilities contain notification scheduling, date grouping, and small helpers.
- Constants contain many hard-coded calendar IDs, API keys, and URLs.
- Favourites persistence goes through a [favourites repository](../services/favourites/favouritesRepository.ts), and settings and notification preferences go through a [settings repository](../services/settings/settingsRepository.ts). Notification scheduling bookkeeping (`notified-*` keys) and cached category events are still read and written directly in [utils/notifications.ts](../utils/notifications.ts).

### Mermaid diagram

```mermaid
flowchart TD
    A[Expo Router entry] --> B[Root layout]
    B --> C[Bottom tab layout]
    C --> D[Home screen]
    C --> E[Favourites screen]
    C --> F[Prayer screen]
    C --> G[Settings screen]
    C --> H[Event details screen]
    C --> I[Daily readings screen]
    C --> J[PDF viewer]

    D --> D6[useHomeFeature]
    D6 --> D1[useEvents]
    D6 --> D2[useDailySaint]
    D6 --> D3[useFastDay]
    D6 --> D4[utils/notifications]
    D6 --> D7[useForegroundRefresh]
    D1 --> D0[CalendarDataService]
    D2 --> D0
    D3 --> D0
    D0 --> D5[Google Calendar API]
    D4 --> D8[Expo Notifications + AsyncStorage]

    E --> E0[Favourites repository]
    E --> E2[EventItem]
    E2 --> E0
    E0 --> E1[AsyncStorage favourites]

    F --> F0[LiturgicalDataService]
    F0 --> F1[AntiochianApi]
    F1 --> F2[Antiochian liturgical API]
    F --> F3[Daily readings screen]
    F --> F4[PDF viewer]

    G --> G1[Zustand store]
    G --> G0[Settings repository]
    G1 --> G0
    G --> G3[utils/notifications]
    G3 --> G0
    G0 --> G2[AsyncStorage settings]
```

### Notable architectural characteristics

- Screens are doing too much: data fetching, refresh logic, local state, navigation, styling, notifications, and sometimes modal state all live together.
- Hooks are not yet a consistent abstraction layer; they mostly fetch data directly and return state to a single screen.
- Persistence logic is repeated across multiple components rather than centralized.
- There is no provider-based or repository-based boundary separating UI from remote services.
- There is no AI/agent subsystem in this repository; there are no prompts, tool definitions, LLM providers, orchestration modules, memory stores, or model-selection layers.

## 3. Important flows

### 3.1 Home screen: event + saint + fast-day flow

Entry point:
- [app/(tabs)/index.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/index.tsx)

Flow:
- The Home screen delegates data loading, refresh, and coordination to [hooks/useHomeFeature.ts](../hooks/useHomeFeature.ts). The screen connects the hook's return values to components (SectionList, its `ListHeaderComponent` and `ListFooterComponent`, month picker and clear button) and keeps only the `SectionList` ref, tab-press-to-scroll-to-top wiring, navigation, and rendering. The top image and the saint/fast block are the list header, the bottom image is the list footer, and `renderSectionHeader` only handles event sections, so `ListEmptyComponent` shows when no events match. The month picker button sits in the top bar and the picker modal outside the list, so both stay reachable when a month has no events. While a month is selected, a "Clear month filter" button calls `clearMonthFilter` from the hook (`isMonthFiltered` tells the screen when to show it).
- `useHomeFeature` requests notification permissions, sets up notification listeners, and schedules Saint of the Day notifications on mount, and calls three hooks:
  - [hooks/useEvents.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useEvents.tsx) to load parish events from every event calendar.
  - [hooks/useDailySaint.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useDailySaint.ts) to load saints for the current date.
  - [hooks/useFastDay.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useFastDay.ts) to load fasting calendar events and derive fast labels.
- All three hooks load data through `calendarService` from [services/calendar/](../services/calendar/index.ts), which implements the `CalendarDataService` interface. `useEvents` is kept as a compatibility wrapper so the screen is unchanged.
- The current implementation, `GoogleCalendarService`, holds the calendar IDs, request URLs, and error handling. [services/calendar/googleCalendarMapper.ts](../services/calendar/googleCalendarMapper.ts) normalizes Google events into the app's `EventData` shape. Nothing outside [services/calendar/](../services/calendar/index.ts) knows about Google Calendar.
- `useHomeFeature` groups the data by date with [utils/dateUtils.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/dateUtils.ts), then delegates the remaining Home business rules to pure functions in [utils/homeRules.ts](../utils/homeRules.ts): filtering sections by the selected month, indexing sections for the `SectionList`, and deriving the major/minor fast labels and saint title. The hook only calls these functions and wires their results into React state.
- Tapping an event navigates to [app/eventDetails.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/eventDetails.tsx) with the event payload.

State and side effects:
- `useHomeFeature` owns refresh status, date selection, and month filtering, and registers the background refresh through [hooks/useForegroundRefresh.ts](../hooks/useForegroundRefresh.ts). The screen keeps only the `SectionList` ref and navigation-driven scroll-to-top state.
- Side effects (network requests via the data hooks, notifications, and the foreground refresh via `useForegroundRefresh`) live in `useHomeFeature`; navigation and haptics stay in the screen component.

External calls:
- Google Calendar events endpoints, saints endpoint, fasting endpoint.
- Expo Notifications scheduling.

Decision points:
- The Home screen decides which fast label to display based on the current fasting events array.
- The screen also filters events by selected month using the grouped data it already loaded.

### 3.2 Event details flow

Entry point:
- [components/EventItem.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/EventItem.tsx)

Flow:
- The event item pushes a route to `/eventDetails` with event params.
- [app/eventDetails.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/eventDetails.tsx) reads params and renders the selected event.
- The screen can copy the location to the clipboard and open maps via `Linking`.

State and side effects:
- Mostly presentational, but it uses navigation options and side effects for clipboard and external links.

### 3.3 Favourites flow

Entry point:
- [components/EventItem.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/EventItem.tsx) and [app/(tabs)/favourites.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/favourites.tsx)

Flow:
- Tapping the star icon in the event item calls `addFavourite` or `removeFavourite` on the [favourites repository](../services/favourites/favouritesRepository.ts).
- The Favourites screen calls `removeExpiredFavourites` on focus, which drops expired events from storage and returns the upcoming ones.
- Favourite event notifications read the list with `getFavourites`.
- The screen renders favourite items using [components/EventItem.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/EventItem.tsx).

State and side effects:
- Favourites are stored in AsyncStorage under the `favourites` key as a JSON object keyed by event ID/title.
- Only the repository reads or writes that key, so callers do not depend on the storage format.
- Expired favourites are removed from storage whenever the Favourites screen loads.

### 3.4 Settings and notification flow

Entry point:
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)

Flow:
- The settings screen reads and writes settings through the [settings repository](../services/settings/settingsRepository.ts).
- It uses a Zustand store for the start-of-week preference ([app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)), which loads and saves the value with `getStartOfWeek` and `saveStartOfWeek`.
- On load, `loadNotificationToggles` returns the toggle values to show and writes the first-run defaults. `getCalendarNotificationSettings` returns the saved per-calendar settings, or saves and returns disabled defaults.
- [hooks/useColorScheme.ts](../hooks/useColorScheme.ts) reads the saved theme with `getThemeChoice`.
- The settings screen interacts with [utils/notifications.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/notifications.ts) to schedule or cancel local notifications. Scheduling checks `isDailySaintNotificationsEnabled` / `isFavouriteNotificationsEnabled` before doing any work.

State and side effects:
- Settings are stored in AsyncStorage under `START_OF_WEEK`, `APP_THEME`, `dailySaintsNotificationsEnabled`, `favouriteNotificationsEnabled` (`"true"`/`"false"` strings) and `calendarNotificationSettings` (a JSON object keyed by calendar name).
- Only the repository reads or writes those keys, so callers do not depend on the storage format.
- Notification toggle state lives in React local state and is persisted through the repository.
- Notification scheduling is a side effect triggered from the UI layer.

### 3.5 Prayer / liturgical reading flow

Entry point:
- [app/(tabs)/prayer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/prayer.tsx)

Flow:
- The Prayer screen delegates data loading and refresh to [hooks/usePrayerFeature.ts](../hooks/usePrayerFeature.ts), which loads liturgical data through `liturgicalService` from [services/liturgical/](../services/liturgical/index.ts), which implements the `LiturgicalDataService` interface.
- The screen uses the service's helper methods to extract reading teasers, full reading text, and feast title.
- The current implementation, `AntiochianLiturgicalService`, wraps the client in [api/AntiochianApi.ts](../api/AntiochianApi.ts). Only the service layer imports that client.
- Selecting a date calls the hook's `load(date)`, the single load path; the initial load on mount uses it too. Only the most recent request may write results, so a slow response for an earlier date is ignored.
- Pull-to-refresh and the foreground refresh (registered in the hook through `useForegroundRefresh`) call the hook's `refresh()`, which reloads the selected date rather than resetting to today.
- Tapping a reading opens [app/dailyReadings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/dailyReadings.tsx).
- Tapping a service opens [app/pdfViewer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/pdfViewer.tsx).

State and side effects:
- `usePrayerFeature` owns the selected date, the loaded data, and the loading, refreshing, and error state. `error` means the load failed; a day with no services is empty data, not an error, so every route to the same day shows the same message.
- The screen keeps the date picker visibility and navigation to other routes. It no longer touches `AppState`: `usePrayerFeature` registers the foreground refresh itself.

### 3.6 AI / agent flow

There is no AI/LLM or agent orchestration flow in this repository.

Observed facts:
- No model provider integration is present.
- No prompt management, tool registry, agent definitions, memory store, or orchestration engine exists.
- The app contains no code paths that would route requests through an LLM or agent runtime.

## 4. Configuration

### Runtime configuration sources

The app uses the following configuration mechanisms:

- [app.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app.json) for Expo app metadata, bundle ID, orientation, scheme, and plugin configuration.
- [eas.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/eas.json) for build profiles.
- [package.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/package.json) for scripts, dependencies, and Expo/Jest configuration.
- [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx) for many hard-coded URLs and API-related values.
- [services/calendar/googleCalendarConfig.ts](../services/calendar/googleCalendarConfig.ts) for the Google Calendar IDs and API base URL.
- AsyncStorage keys for favourites and settings are private to the [favourites](../services/favourites/favouritesRepository.ts) and [settings](../services/settings/settingsRepository.ts) repositories.

### Environment variables and secrets

The repository currently does not use a conventional `.env` configuration layer. Instead, secrets and configuration are embedded in code:

- A Google API key is hard-coded in [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx).
- The Antiochian API client uses a hard-coded client ID and client secret in [api/AntiochianApi.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api/AntiochianApi.ts).
- [assets/service_account.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/assets/service_account.json) exists but is not wired into the runtime code visible here.

### Feature flags and runtime toggles

- The settings screen exposes a small number of user toggles for notifications and start-of-week behavior.
- Some UI sections are currently disabled through `false` conditions in [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx), suggesting partially completed or intentionally hidden functionality.
- [app/pdfViewer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/pdfViewer.tsx) has a hard-coded `USE_WEBVIEW` flag for a temporary PDF strategy.

## 5. Testing

### What is tested today

There is one visible Jest snapshot test:
- [components/__tests__/ThemedText.test.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/__tests__/ThemedText.test.tsx)

Both data services have service-level tests that mock the network, not React hooks:
- [services/calendar/](../services/calendar/index.ts) tests inject or stub `fetch` and cover successful Google Calendar payloads, malformed and empty responses, and date normalization of timed and all-day events.
- [AntiochianLiturgicalService.network.test.ts](../services/liturgical/AntiochianLiturgicalService.network.test.ts) runs the service on the real Antiochian client with only axios mocked. It covers authentication, day ID derivation from dates, caching, malformed and empty responses, and reading/feast transformations.

Date tests build instants with explicit UTC offsets so they pass in any device time zone.

Favourites persistence has repository-level tests against the AsyncStorage Jest mock:
- [favouritesRepository.test.ts](../services/favourites/favouritesRepository.test.ts) covers loading data already stored in the existing format, add/remove, expiry at the end-time boundary, leaving storage untouched when there are no favourites, and invalid stored JSON.
- [EventItem.test.tsx](../components/__tests__/EventItem.test.tsx) mocks the repository and covers the star toggle: initial state, favouriting, unfavouriting with the `onUnfavourite` callback, and error logging on load or save failure.
- [favourites.test.ts](../__tests__/favourites.test.ts) mocks the repository and covers the Favourites screen: expiry cleanup on focus, never touching the `favourites` key directly, the empty state, removing unfavourited items by id or title, and error logging on load failure.

Settings persistence is tested the same way:
- [settingsRepository.test.ts](../services/settings/settingsRepository.test.ts) runs against the AsyncStorage Jest mock. It covers reading values stored in the existing format, the stored value formats, fallbacks for unset or unrecognised values, first-run notification and calendar defaults, and invalid stored JSON.
- [settings.test.tsx](../__tests__/settings.test.tsx) mocks the repository and covers the Settings screen: loading and saving the saint notification toggle, scheduling or cancelling notifications, loading and saving the start of week, error logging when calendar settings fail to load, and never touching the settings keys directly.

Prayer screen orchestration is tested at the hook level:
- [usePrayerFeature.test.ts](../__tests__/usePrayerFeature.test.ts) mocks `liturgicalService` and covers: the initial load, error and empty results, loading a chosen date, ignoring slow responses and failures for a date that is no longer selected, refresh reloading the selected date, clearing earlier errors, and always ending the refreshing state, and the foreground refresh reloading the selected date after 5 hours but not before.

The shared foreground-refresh hook is tested on its own:
- [useForegroundRefresh.test.ts](../__tests__/useForegroundRefresh.test.ts) drives a fake `AppState` and clock ([test-utils/fakeAppState.ts](../test-utils/fakeAppState.ts)) and covers: the first return to the foreground only starting the clock, refreshing once the threshold has passed and not within it, measuring the next threshold from the last refresh, ignoring the app leaving, treating a return from inactive as a return, calling the latest callback after a re-render, and unsubscribing on unmount.

Home screen orchestration is tested at the hook level:
- [useHomeFeature.test.ts](../__tests__/useHomeFeature.test.ts) mocks `useEvents`, `useDailySaint`, `useFastDay`, and the notification modules, and covers: notification setup and the initial event load on mount, saint-title pluralisation, major/minor fast label derivation (including the "No Fast" fallback), refreshing all three data sources together, filtering sections to the picked month while closing the month picker, clearing the month filter (including after a month with no events), and the foreground refresh refetching all three sources after 5 hours but not before.
- Home's business rules are also tested directly, without rendering React: [homeRules.test.ts](../__tests__/homeRules.test.ts) covers [utils/homeRules.ts](../utils/homeRules.ts)'s major/minor fast label precedence, saint-title pluralisation, month filtering (including sections left with no events), and section indexing. The screen itself is tested in [homeScreen.test.tsx](../__tests__/homeScreen.test.tsx) against a fake `useHomeFeature`: header, footer, empty message, event section headers, the month picker and clear button (including when no events match) and scroll-to-top.

### What is not tested

The current test coverage does not appear to cover:

- Navigation flows between screens.
- Notification scheduling and cancellation logic.
- How screens present remote failures and empty data to the user.
- UI-level transformation logic such as date grouping and fast-day derivation.

The test script in [package.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/package.json) runs Jest in watch mode, which is not ideal for CI or regression safety.

## 6. Known architectural problems

The following are concrete issues visible in the codebase.

### 6.1 UI and data fetching are tightly coupled

Relevant files:
- [app/(tabs)/prayer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/prayer.tsx)
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)

Evidence:
- The screen components orchestrate data loading, state changes, navigation, and side effects directly.
- Prayer and Settings screens mix presentation, data loading, refresh logic, and external side effects in the same component.
- The Home screen moved this coordination into [hooks/useHomeFeature.ts](../hooks/useHomeFeature.ts), and Prayer's data loading and refresh moved into [hooks/usePrayerFeature.ts](../hooks/usePrayerFeature.ts). Both now share one foreground-refresh hook, [hooks/useForegroundRefresh.ts](../hooks/useForegroundRefresh.ts). Prayer still keeps its presentation in the screen, and the pattern has not yet been applied to Settings.

### 6.2 Persistence logic is duplicated and scattered

Relevant files:
- [utils/notifications.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/notifications.ts)

Evidence:
- Favourites and settings now each go through a single repository ([favourites](../services/favourites/favouritesRepository.ts), [settings](../services/settings/settingsRepository.ts)).
- [utils/notifications.ts](../utils/notifications.ts) still reads and writes `notified-*` scheduling markers and `events-*` cached events directly in AsyncStorage.
- `scheduleCategoryNotifications` reads calendar settings from a module-level `useState` rather than from the settings repository.

### 6.3 Remote integration logic is embedded in hooks and screens

Relevant files:
- [hooks/useEvents.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useEvents.tsx)
- [hooks/useDailySaint.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useDailySaint.ts)
- [hooks/useFastDay.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useFastDay.ts)
- [api/AntiochianApi.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api/AntiochianApi.ts)

Evidence:
- Each hook constructs its own URL and fetches data directly.
- The prayer screen depends on a bespoke API wrapper and then parses results inline.
- There is no common adapter for remote providers, response normalization, retries, or error handling.

### 6.4 There is hidden state and implicit dependencies

Relevant files:
- [utils/dateUtils.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/dateUtils.ts)
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)
- [utils/notifications.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/notifications.ts)

Evidence:
- [utils/dateUtils.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/dateUtils.ts) reads Zustand state directly from a store rather than receiving configuration as input.
- Notification scheduling utilities rely on module/global-like state and side-effectful AsyncStorage access in a non-obvious manner.
- Settings and notification behavior are spread across multiple modules with no single source of truth.

### 6.5 Business/domain logic is mixed with UI concerns

Relevant files:
- [hooks/useFastDay.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useFastDay.ts)
- [utils/dateUtils.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/dateUtils.ts)

Evidence:
- The Home screen's business rules (which major/minor fast label to show, saint-title pluralisation, month filtering, and section indexing) now live in [utils/homeRules.ts](../utils/homeRules.ts) as pure functions with unit tests; [hooks/useHomeFeature.ts](../hooks/useHomeFeature.ts) only calls them and wires the results into React state, so this problem no longer applies to Home.
- Date grouping and “this week / next week / later” labels are still computed in a utility file that also depends on application settings.
- `useFastDay` still fetches and interprets raw fasting-calendar events itself rather than going through a domain module.

### 6.6 Security-sensitive configuration is embedded in source

Relevant files:
- [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx)
- [api/AntiochianApi.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api/AntiochianApi.ts)

Evidence:
- A Google API key is committed to source.
- The Antiochian API module contains a client secret in source.
- This is a practical risk even if the repository is private or internal.

### 6.7 Some code appears to be dead, temporary, or partially disabled

Relevant files:
- [app/pdfViewer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/pdfViewer.tsx)
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)
- [utils/notifications.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/notifications.ts)
- [discarded/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/discarded)

Evidence:
- PDF viewing uses a temporary WebView workaround and contains large commented-out legacy code.
- Settings includes many `false`-guarded sections that appear to be unfinished or previously disabled.
- The repository includes a [discarded/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/discarded) folder with screens that are not part of the current navigation flow.

## 7. Uncertainties

### What is known from the code

- The app is an Expo/React Native app with tab-based navigation and screen-level routes.
- It fetches parish events from multiple Google Calendar calendars.
- It fetches saints and fasting data from Google Calendar.
- It fetches liturgical readings and PDFs from the Antiochian API.
- It persists favourites and settings with AsyncStorage and schedules local notifications with Expo Notifications.

### What is strongly suspected

- Some of the currently disabled settings and commented code paths may reflect abandoned product ideas rather than planned features.
- The current architecture is likely to become harder to evolve as more features are added because the UI layer already carries too much responsibility.
- The app is likely to be brittle around network failures and missing data because error handling is mostly inline and inconsistent.

### What cannot be determined from the code alone

- Whether the app is intended to grow into a larger multi-feature experience or remain a simple parish information app.
- Whether the hard-coded API credentials are still active and should be rotated.
- Whether any external service behavior differs materially from what the current code assumes (for example, event payload shapes or liturgical API response variations).
- Whether there are any hidden runtime issues caused by the current dependency versions until the app is run in a real environment.

## Summary

The system today is a screen-driven React Native application with a mix of direct component state, custom hooks, utility modules, and storage/notification side effects. It works by pulling data from several remote sources and presenting it through Expo Router screens. The biggest structural issues are coupling between UI and data/access logic, scattered persistence, embedded secrets, and a lack of a clear application/domain boundary.
