# Refactoring plan

The goal of this plan is not to rewrite the app. It is to move the codebase toward clearer boundaries in small steps while preserving current behavior.

## 1. Target architecture

The codebase would benefit from a structure that separates:

- Screen/presentation layer: route screens and reusable UI components
- Feature orchestration layer: screen-level coordination for loading, refreshing, navigation, and user actions
- Domain/business logic: rules such as fast-day interpretation, date grouping, favourites eligibility, and notification intent
- Data access layer: adapters for Google Calendar, the Antiochian API, AsyncStorage, and notifications
- Infrastructure/configuration: API credentials, storage keys, runtime settings, and provider-specific details

In practice, this means the app should move toward a model where screens call feature-level orchestrators or use cases rather than directly fetching remote data and mutating storage inside the screen component itself.

### Suggested boundaries based on the current code

- [app/(tabs)/index.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/index.tsx) should become a thin composition layer over a home-feature controller.
- [hooks/useEvents.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useEvents.tsx), [hooks/useDailySaint.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useDailySaint.ts), and [hooks/useFastDay.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useFastDay.ts) should be replaced or wrapped by a small data-access module that normalizes provider responses.
- [api/AntiochianApi.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api/AntiochianApi.ts) should become a service with a stable interface rather than a module that exposes many ad-hoc helpers.
- [utils/notifications.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/notifications.ts) should be split into a notification service and a scheduler that uses parsed intents rather than inline side effects.
- [components/EventItem.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/EventItem.tsx) should stop owning all favourite persistence decisions directly.

## 2. Architectural principles

The refactor should follow principles that are directly relevant to this codebase:

- UI screens should not own remote data fetching or persistence details.
- Business rules should be testable without React components or platform APIs.
- Provider-specific code should be isolated behind interfaces or adapters.
- Secrets and provider configuration should not live in application source files.
- Notification, persistence, and navigation side effects should occur at explicit boundaries rather than inside presentational components.
- The app should become easier to test by separating pure transformations from platform effects.

## 3. Migration strategy

The work should happen in small phases. Each phase should preserve the current user-visible behavior while introducing a seam for the next step.

### Phase 1: Introduce a stable data-access boundary

Objective:
- Stop scattering fetch logic across screens and hooks.

Files/modules affected:
- [hooks/useEvents.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useEvents.tsx)
- [hooks/useDailySaint.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useDailySaint.ts)
- [hooks/useFastDay.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useFastDay.ts)
- [api/AntiochianApi.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/api/AntiochianApi.ts)
- [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx)

What should change:
- Create thin service modules for Google Calendar integration and liturgical data access.
- Normalize provider responses into a shared application model.
- Keep the existing hooks/screens as wrappers if needed so the UI does not change immediately.

What should not change:
- Screen visuals, navigation behavior, and existing data shapes presented to the UI should remain the same.

Tests/safety checks:
- Add unit tests for response normalization and date parsing.
- Manually verify that the Home screen still renders events and saints after the change.

Expected outcome:
- Remote integration logic is no longer spread across multiple screen files.
- Future changes to provider APIs can be made in one place.

Dependencies on previous phases:
- None.

### Phase 2: Move persistence behind explicit repositories

Objective:
- Centralize favourites and settings persistence so storage format changes do not ripple through screens.

Files/modules affected:
- [components/EventItem.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/EventItem.tsx)
- [app/(tabs)/favourites.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/favourites.tsx)
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)
- [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx)

What should change:
- Introduce simple repository or storage modules for favourites and settings.
- Keep the existing AsyncStorage format initially to avoid breaking the current data.
- Move read/write logic out of the UI components.

What should not change:
- The user-facing behaviour of favourites and settings should remain the same.

Tests/safety checks:
- Add tests for favourite add/remove/expire behavior.
- Verify that the existing stored favourites continue to load correctly.

Expected outcome:
- Persistence is less coupled to UI and easier to mock in tests.

Dependencies on previous phases:
- Phase 1 should be complete enough that the app has a stable data model to persist.

### Phase 3: Separate feature orchestration from screen components

Objective:
- Reduce the amount of application logic embedded in route screens.

Files/modules affected:
- [app/(tabs)/index.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/index.tsx)
- [app/(tabs)/prayer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/prayer.tsx)
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)

What should change:
- Extract home-screen orchestration into a small feature controller or hook that coordinates data loading, refreshes, and navigation decisions.
- Extract prayer-screen orchestration into a similar layer that manages selected date, reading fetches, and visible state.
- Keep the screens focused on rendering user-facing results.

What should not change:
- The visible layout and screens should remain essentially the same.

Tests/safety checks:
- Add tests for the orchestration logic using stubbed data services.
- Verify that navigation still works for event details, daily readings, and PDF viewing.

Expected outcome:
- Screens become easier to understand and easier to test.

Dependencies on previous phases:
- Phase 1 and 2 should have established shared data and storage abstractions.

### Phase 4: Extract domain rules and pure helpers

Objective:
- Move business logic out of hooks/components and into pure modules.

Files/modules affected:
- [utils/dateUtils.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/dateUtils.ts)
- [hooks/useFastDay.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/hooks/useFastDay.ts)
- [app/(tabs)/index.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/index.tsx)

What should change:
- Extract rules such as fast-day detection, date-group labeling, and event filtering into pure functions with clear inputs and outputs.
- Keep the UI components responsible for presentation only.

What should not change:
- The text and labels shown to the user should stay consistent with the current app.

Tests/safety checks:
- Add unit tests for fast-day classification and date grouping.
- Compare rendered output against current behavior for a set of representative dates.

Expected outcome:
- Business rules are isolated and easier to reason about.

Dependencies on previous phases:
- Phase 3 should have reduced the amount of decision logic embedded in screen components.

### Phase 5: Consolidate notifications and configuration

Objective:
- Make notifications and runtime configuration more explicit and less hidden.

Files/modules affected:
- [utils/notifications.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/notifications.ts)
- [app/settings.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/settings.tsx)
- [notifications.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/notifications.tsx)
- [constants/consts.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/constants/consts.tsx)

What should change:
- Introduce a notification service that accepts user intent and schedules notifications through Expo.
- Move secrets and provider configuration to environment-based configuration or a build-time config module.
- Keep current feature behavior intact while replacing the current scattered implementation.

What should not change:
- The notification toggles and timing should not change unexpectedly.

Tests/safety checks:
- Add tests for the notification scheduling intent and the storage of notification settings.
- Verify that toggling settings still works manually.

Expected outcome:
- Notification behavior becomes more predictable and less coupled to the UI.

Dependencies on previous phases:
- Phase 2 should have consolidated settings persistence.

### Phase 6: Improve safety net and remove dead code

Objective:
- Reduce maintenance burden and make future work safer.

Files/modules affected:
- [app/pdfViewer.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/pdfViewer.tsx)
- [app/discarded/](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/discarded)
- The test setup and scripts in [package.json](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/package.json)

What should change:
- Decide whether the temporary PDF route should stay as-is or be replaced by a clear strategy.
- Remove or archive unused screens and code after confirming they are no longer part of the supported product.
- Add a proper test command for CI rather than the current watch-based Jest script.

What should not change:
- The supported user flows should continue to work while dead code is removed.

Tests/safety checks:
- Run the test suite and the main screens manually.
- Confirm that the supported routes still function.

Expected outcome:
- The project becomes easier to navigate and maintain.

Dependencies on previous phases:
- The data-access and orchestration boundaries should already be in place.

## 4. Risk assessment

### Highest-risk areas

- The Home screen and Prayer screen because they currently handle a large number of responsibilities.
- Notification scheduling because side effects are spread across multiple modules and tied to platform behavior.
- Persistence because favourites and settings are stored in a custom format with ad-hoc reads and writes.
- Provider integrations because the current code assumes particular payload shapes and may be sensitive to upstream changes.

### Behavior that is difficult to preserve

- The current date-based grouping and week-label behavior in [utils/dateUtils.ts](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/utils/dateUtils.ts).
- The exact rendering and timing behavior of events and saint notifications.
- The existing route transitions and screen-level navigation behavior from the current app.

### Areas lacking tests

- Hook logic for remote data fetching
- Storage logic for favourites and settings
- Notification schedule/cancel flows
- Date grouping and fast-day classification
- Error handling and empty-state behavior

### Potential breaking changes

- Moving away from inline AsyncStorage writes will require preserving the existing storage keys and data shape at first.
- Replacing the current hook-based fetch pattern may change the timing of data load events unless it is done carefully.
- Hard-coded secrets should be moved behind config, but that change should happen only after a safe rollout plan.

### Places where duplicated code may actually represent different behaviors

- The favourite persistence flow in [components/EventItem.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/components/EventItem.tsx) and the loading logic in [app/(tabs)/favourites.tsx](/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/app/(tabs)/favourites.tsx) look similar, but one is a write path and the other is a read/cleanup path. They should be unified carefully rather than blindly merged.
- The different remote integrations may look similar at first glance but likely have different response structures and error modes.

## 5. Recommended first steps

The safest and highest-leverage first changes are:

1. Extract the remote data access into small service modules.
   - This creates a seam around the current provider-specific code without changing the UI.

2. Create a single favourites/settings persistence layer.
   - This removes one of the most obvious cross-cutting concerns from the UI and components.

3. Move the Home screen’s data-loading and refresh orchestration out of the screen component.
   - This is the most obvious place where screen code is doing too much today.

4. Stop hard-coding secrets in source and move them behind a config layer.
   - This is a practical security improvement that also improves portability across environments.

5. Add a small set of tests around data normalization and persistence before further refactors.
   - This gives the team a safety net for later changes.
