# Issue drafts from the architecture review

Status: **drafts only. Nothing has been created on GitHub.**
Source: the architecture review in this session, re-checked against the code at `master` (`4aff8b1`), with `gh issue list --state all` run on 2026-10-02.

One review finding is withheld from this file on purpose (secrets rule). It is drafted separately in `issue-drafts-security.local`, which is git-ignored by the existing `*.local` pattern.

Draft IDs (`D01`, `E1`, ...) are placeholders. They become real issue numbers after approval.

---

## 0. Corrections to the review

Claims that did not hold, or held only partly, once I checked the code:

| Review claim | What I found | Effect on the backlog |
|---|---|---|
| "Close issues that look done: #75-77, #95, #96" | #75, #76, #95 and #96 are done. **#77 is not**: tests pinning #60, #62 and #63 still have no issue number in their names. | #77 stays open with a narrower scope (see section 2). |
| "Six production sites still use `new Date()`" | The count is **8 sites in 7 files** (`index.tsx:138`, `useDailySaint.ts:9`, `useHomeFeature.ts:29,66`, `usePrayerFeature.ts:17`, `GoogleCalendarService.ts:54,76`, `favouritesRepository.ts:47`). | D08 lists the right sites. |
| "`domain/calendarSources.ts` imports React Native, so `domain/` is not pure" | The import is `import type`, which is erased at runtime. The only real impurity is the `require()` of image assets. | **Dropped.** It is low impact and a pragmatic choice. |
| "Unused dependencies: `eventemitter3`, `react-native-paper`, `react-native-fs`, and others" | My "no imports" scan also flagged packages that are **peer dependencies** of used packages (`@react-native-picker/picker`, `@react-native-community/datetimepicker`, `@fortawesome/fontawesome-svg-core`, `react-native-svg`, `expo-linking`, `react-native-screens`, and others). `@types/he` is the type package for the used `he`. | D04 is split into safe and verify-first tiers. |
| "`HapticTab`, `TabBarBackground`, `eventBus`, `ThemedView` look orphaned" | `HapticTab`, both `TabBarBackground` files and `eventBus` have no importers. **`ThemedView` is used** by `app/+not-found.tsx`. `useColorScheme.web.ts` is picked up by platform resolution, so it is not an orphan either. | `ThemedView` and `useColorScheme.web.ts` are excluded from D03. |
| "One flaky test on master" | I saw **one** failed run (36946882155, `homeScreen.test.tsx` 5s timeout, suite took 21s on CI versus 6s locally). Every later run passed. The cause is an inference. | D01 says "investigate", not "fix flake". |
| "`expo lint` covers only `app/` and `components/`" | This rests on a behavioural comparison, not the Expo source. CI's `expo lint` reported 2 warnings in one file, while `npx eslint .` reports 41 problems across `hooks/`, `utils/`, `__tests__/` and more. It is still an inference. | D02 states it as such. |
| Credentials: "token in consts, client id and secret in the API client" | Confirmed. The review **missed a more serious item**, so it is in the private file. | See `issue-drafts-security.local`. |

Verified and kept:
- No production caller for `planNotifications` or `reconcileNotifications`.
- `services/notifications/calendarNotifications.ts:25` reads `events-*` keys that nothing writes.
- Four `false &&` blocks in `app/settings.tsx`.
- `prayer.tsx` is 851 lines, with 0% coverage and three copies of the reading card (`:290-469`) and of the alert (`:509`, `:615`, `:682`).
- `utils/notifications.ts:5` has a module-level `useState`. It throws outside a render (checked in Node); how it behaves inside Expo Router's route loading is unverified.
- `npx eslint .` has 10 errors: 1 parse error in `.yarn/`, 3 `set-state-in-effect`, 4 `display-name`, 1 `no-unresolved` (`index.js`), 1 `rules-of-hooks`.
- `npm test` is `jest --watchAll`.
- The coverage margin is 80.01% lines against an 80% threshold.

---

## 1. Classification of review findings

| # | Review finding | Class | Where it lives |
|---|---|---|---|
| R1 | Delete the `utils/notifications.ts` shim and its module-level `useState` | **Duplicate** | #93, #94 (amend, see section 2) |
| R2 | Lint the whole repo; fix the real errors | **New** | D02 |
| R3 | `collectCoverageFrom` reports all source files | **Stale** | #75 is done |
| R4 | `tsc --noEmit` should pass locally and in CI | **Stale** | #76 is done |
| R5 | Name pinned-defect tests with issue numbers | **Duplicate** | #77 (narrow, see section 2) |
| R6 | CI timeout in `homeScreen.test.tsx` | **New** | D01 |
| R7 | `npm test` runs in watch mode; coverage margin is 0.01 points | **New** | D01 |
| R8 | Finish notifications: reconcile step, settings in the store, one pattern for all kinds, move root `notifications.tsx` | **New** (epic) | E1, D11-D14 |
| R8a | Saint toggle reset (#69) | **Duplicate** | #69 |
| R9 | Split the Prayer screen and add a screen test | **New** | D06, D07 |
| R10 | Orphaned files, `discarded/`, dead constants, deprecated helpers, tracked `.yarn/` | **New** | D03 |
| R11 | Unused dependencies | **New** | D04 |
| R12 | Stale docs and README | **New** | D05 (and #15, your call) |
| R13 | Parish clock only partly adopted | **New** | D08 |
| R14 | No error convention; Home ignores load and error state; saint fetch failure looks like "no saints" | **New** | D09 |
| R15 | `EventData` carries `data: never[]` and an untyped `source` | **New** (child of #34) | D10 |
| R16 | Settings screen unrefactored, with hidden `false &&` features | **Duplicate** + **New** | #54 (product scope) and D11 (state) |
| R17 | Committed credentials | **Withheld** | `issue-drafts-security.local` |
| R18 | `domain/calendarSources.ts` is not pure | **Dropped** | section 0 |
| R19 | Three test-location conventions | **Duplicate** | #27 (comment only, no new issue) |
| R20 | Nativity Fast label mismatch | **Stale** | #95 is done |
| R21 | Help `switch` fall-through | **Stale** | #96 is done |

---

## 2. Existing issues: stale list, supersessions, and amendments

### 2a. Stale: looks already done (for you to close; I will not close them)

| Issue | Evidence it is done |
|---|---|
| #75 Configure Jest `collectCoverageFrom` | `package.json:21-31` configures it. The coverage run lists 0% files (`prayer.tsx`, `about.tsx`, `DonateSection.tsx`). One residual gap: root `notifications.tsx` falls outside every glob. D14 fixes it by moving the file. |
| #76 `tsc --noEmit` consistent locally and in CI | `npx tsc --noEmit` exits 0 locally. CI run 36951337013 passes the typecheck step. `constants/consts.tsx:14-18` throws on a missing key, so the type is `string`. |
| #95 Nativity Fast label mismatch | `domain/fasting.ts:52-56` maps `"nativity fast"` to "The Nativity Fast". Covered by `domain/fasting.test.ts:123` and `__tests__/useFastDay.test.ts:99`. |
| #96 Help `switch` fall-through | `app/(tabs)/help.tsx:46-59` has a `break` per case. Fixed by d793d37 (PR #116, via #92). |
| #61 Keep all-day events on their local date *(outside the review; found while checking)* | `googleCalendarMapper.ts` uses `startOfParishDayFromKey` and sets `allDay`. Tests cover boundaries, DST and sort order (`googleCalendarMapper.test.ts:32,48,188`). The old UTC-midnight pin tests are gone. #78 (part of #61) is closed. |
| #64 Missing reading titles *(outside the review)* | `antiochianMapper.ts:22-32` omits readings without a title. Tests: `AntiochianLiturgicalService.network.test.ts:251,268`. The deprecated `getReadingTeasers` still throws, but nothing calls it (D03 deletes it). |

### 2b. Superseded (not "done", but their premise is gone)

| Issue | Why |
|---|---|
| #71 Notification scheduling records repository | No code reads or writes `notified-*` any more (grep of non-test source finds only comments). Expo's schedule is the record (`docs/notification-planner.md`). |
| #72 Cached calendar events repository | Its premise ("keys are written elsewhere") is false, as #94 already says. Nothing writes `events-*`. |
| #70 Read calendar notification settings through the repository | Superseded by E1 and D11. The module-level state it describes is deleted by #93, and the settings move into the store. |

Your call: **#15 "Add README.md"**. A README exists (18 lines) and D05 expands it. Close #15 or fold it into D05.

### 2c. Amendments to existing open issues (to post as comments after approval)

- **#93 and #94: land as one PR.** Their line references and function names are stale. `utils/notifications.ts` is now a 17-line re-export shim. The function named in #94 (`scheduleCalendarEventNotifications`) no longer exists. The `events-*` read now lives in `services/notifications/calendarNotifications.ts:25`. Deleting both requires edits the issues do not mention:
  - `app/settings.tsx:17-23` imports through the shim. It should import `@/services/notifications`.
  - `app/settings.tsx:371` calls `scheduleCategoryNotifications` inside a hidden `false &&` block. Drop only that call (the UI is tracked in #54).
  - `__tests__/settings.test.tsx:34` mocks `@/utils/notifications`.
  - `__tests__/useHomeFeature.test.ts:48` mocks `@/utils/notifications` although the hook no longer imports it. Delete that mock.
- **#69: add a first-launch inference** (from code reading; not run). `app/_layout.tsx:51` calls `scheduleSaintNotificationsForNext7Days()`, which checks `isDailySaintNotificationsEnabled()` (`settingsRepository.ts:61-65`). That returns true only for a stored `"true"`. The flag is only written when Settings first opens (`:94-95`). A fresh install may therefore schedule no saint notifications until the user opens Settings, while the Settings toggle shows "on". #69's "default on when unset" fix should also make the unset case consistent for the scheduler. D11 depends on this.
- **#77: narrow the scope and refresh the numbers.**
  - Already named: #59 (`AntiochianLiturgicalService.network.test.ts:432,448`), #62 feast title (`:262`), #64 (`:251,268`), #69 (`settingsRepository.test.ts:126`).
  - Still unnamed:
    - #60: `GoogleCalendarService.test.ts:254,276,298`
    - #62 anchor failure: `network.test.ts:369`
    - #63: `network.test.ts:382`
  - Cosmetic: `useFastDay.test.ts:99` and `fasting.test.ts:123` are tagged `(#77)` but relate to #95, which is fixed, so drop the tag.
  - The "all 190 tests" criterion is out of date. There are now 439.
- **#62: narrow.** The service now maps a missing day to `null` (test `network.test.ts:338`). Still open: `Antiochian.getLiturgicalDay` returns `undefined` for a body without `liturgicalDay`, and a missing anchor day throws a bare `TypeError` (test `:369`).
- **Cross-links only:** #54 gets a link to D11 (state) and D13 (product decision). #34 gets a link to D10 as a sub-task. #27 gets a comment that tests use three location conventions.
- **Still valid, untouched, good quick wins:** #97 (`eventDetails.tsx:110-111` still double-encodes), #60, #63.

---

## 3. New issues

Labels use the existing set (`bug`, `refactor`, `chore`, `test`, `documentation`, `epic`) plus three **priority labels that do not exist yet**: `priority: high`, `priority: medium`, `priority: low`. Creating them needs your OK (see section 5).

---

### D01: Make `npm test` non-watch and look into the `homeScreen` CI timeout

**Context**
- `package.json:11` defines `"test": "jest --watchAll"`. Any CI or script calling `npm test` hangs. `npm run coverage` works around this with `--watchAll=false`.
- CI run 36946882155 (master, PR #115 merge) failed when `__tests__/homeScreen.test.tsx` ("shows the saints of the day and the fast labels above the events") hit the 5s default timeout. The suite took 21s on CI versus 6.4s locally. It is the only failure in the last 12 runs, and the cause is an inference (cold CI start-up).
- The coverage gate sits at 80.01% lines against an 80% threshold (`package.json:14`). Any new untested file fails CI. Prayer (`prayer.tsx`, 0%) is the obvious headroom; D06 provides it.

**Scope**
- In: `"test": "jest"`, a separate `"test:watch": "jest --watchAll"`, and updating `coverage` to avoid the duplicated flag. Investigate the timeout (re-run the suite in CI-like conditions; check whether the first test pays a cold module-load cost) and either fix the cause or set an explicit, justified `testTimeout`.
- Out: raising coverage thresholds, adding tests (that is D06), and changing which files are collected.

**Acceptance criteria**
- [ ] `npm test` exits on its own without a TTY.
- [ ] `npm run test:watch` keeps the old watch behaviour.
- [ ] The timeout cause is written up in the PR (or the test is made robust), with no blanket timeout bump without a reason.
- [ ] `npm run coverage` and CI still pass.

**Effort / impact:** S / Medium-High (review rec #2)
**Labels:** `chore`, `test`, `priority: medium`
**Dependencies:** none. Better before D06 so the new tests do not trip the same timeout.

---

### D02: Lint the whole repo in CI and fix the existing errors

**Context**
- CI runs `expo lint` (`.github/workflows/ci.yml`), which reported **0 errors, 2 warnings** on master (run 36951337013). `npx eslint .` locally reports **10 errors and 31 warnings**. The gap suggests `expo lint` skips `hooks/`, `utils/`, `services/`, `__tests__/` and the repo root (inferred from the two outputs).
- The errors are real in places:
  - `utils/notifications.ts:5` `react-hooks/rules-of-hooks` (module-level `useState`; removed by #93).
  - `index.js:3` `import/no-unresolved` (imports a nonexistent `./App`; deleted by D03).
  - `hooks/useDailySaint.ts:21`, `hooks/useEvents.tsx:29`, `hooks/useFastDay.ts:34` `react-hooks/set-state-in-effect`.
  - 4× `react/display-name` in test mocks: `homeScreen.test.tsx:79`, `rootLayout.test.tsx:36`, `settings.test.tsx:63`, `tabLayout.test.tsx:20`.
  - `.yarn/releases/yarn-4.12.0.cjs` parse error (no ignore for vendored files; D03 untracks it).
- `eslint.config.js` ignores only `dist/*`.

**Scope**
- In:
  - Make the lint step cover the whole repo (`eslint .` or `expo lint .`; verify which works with the flat config).
  - Add ignores for `.yarn/`, `coverage/`, `ios/`, `android/`, `build/`, `.expo/`.
  - Fix the 4 `display-name` errors.
  - Decide the `set-state-in-effect` policy for the 3 data hooks. Recommended: a per-file disable with a one-line reason now, because fixing it properly means redesigning how the hooks fetch (D09 revisits). The alternative is to restructure them in this PR.
  - Silence `no-require-imports` in test and jest-setup files with a config override rather than 20+ inline disables.
  - Deal with the `FastKind` `no-redeclare` warning (value and type with the same name is idiomatic; use the TS-aware rule or a scoped disable).
- Out: zero warnings overall, and changing app code beyond what the rules require.

**Acceptance criteria**
- [ ] `npm run lint` exits 0 with the whole repo in scope; CI fails on any error.
- [ ] No lint errors remain in `hooks/`, `utils/`, `services/`, `domain/`, `__tests__/`, `components/`, `app/`.
- [ ] The `set-state-in-effect` decision is recorded in the PR and in the three files' comments.
- [ ] The `.yarn/` parse error is gone through ignores or D03, not by editing vendored code.

**Effort / impact:** M / High (review rec #2)
**Labels:** `chore`, `priority: high`
**Dependencies:** #93/#94 (removes the `rules-of-hooks` error) and D03 (removes the `index.js` and `.yarn/` errors). Otherwise this PR has to special-case them.

---

### D03: Delete dead code and files

**Context**: leftovers from the refactor that nothing uses (all confirmed by grep):
- `index.js` imports a nonexistent `./App`. The real entry is `expo-router/entry` (`package.json:3`). The `reset-project` script (`package.json:7`) points at a `scripts/` folder that does not exist.
- `utils/eventBus.ts` has no importers. After the theme moved into `settingsStore`, nothing emits or listens.
- `components/HapticTab.tsx`, `components/ui/TabBarBackground.tsx` and `TabBarBackground.ios.tsx` have no importers (the tab bar now uses Expo Router's `Tabs`).
- `discarded/` holds three unused screens (531 lines). Only its own files import them, and `__tests__/routeFiles.test.ts` guards against its coming back under `app/`. Git history keeps them.
- `constants/consts.tsx`: `DAILY_SAINTS_KEY` (`:59`) is unused. `CALENDLY_URL` (`:2`) is only used by `discarded/book.tsx`.
- `assets/dailySaints.json` is referenced nowhere (repo-wide grep).
- `api/AntiochianApi.ts:182-202`: the `@deprecated` `fetchAntiochian`, `getReadingTeasers`, `getReadingTexts` and `getFeastTitle` have no callers outside the API test. The matching class methods (`:153-177`) are only used by that test (`api/AntiochianApi.test.ts:89-106`). `getReadingTeasers` also still throws on missing titles (the original #64 failure).
- `.yarn/` is tracked (`install-state.gz`, a vendored release) although the package manager is npm (`package.json:108`) and there is no `.yarnrc.yml` or `yarn.lock`. `.vscode/settings.json` is an empty `{}`.
- Leftover debug logging: `app/_layout.tsx:68` logs on every render, `app/eventDetails.tsx:108` logs the platform, `app/pdfViewer.tsx:23` logs the URL.

**Scope**
- In: delete the items above, plus their tests (`api/AntiochianApi.test.ts` cases for the removed methods, and the now-empty `discarded/`). Untrack `.yarn/` and add it to `.gitignore`. Remove the debug logs.
- Out: anything credential-related (separate private item); `components/ThemedView.tsx` and `hooks/useColorScheme.web.ts` (both are used); the commented-out `react-native-pdf` block in `pdfViewer.tsx` (kept on purpose for #28); the duplicate `SplashScreen.preventAutoHideAsync()` and `import "expo-dev-client"` in `app/(tabs)/index.tsx` (they affect start-up and need a device check, so file separately if wanted).

**Acceptance criteria**
- [ ] Each deleted file has no importer (`grep` evidence in the PR).
- [ ] `npm test`, `tsc --noEmit` and lint pass.
- [ ] `npm run reset-project` is removed from `package.json`.
- [ ] `git ls-files .yarn` returns nothing; `.gitignore` covers `.yarn/`.
- [ ] No `console.log` remains in the render paths listed above.

**Effort / impact:** S / Medium (review rec #5; unblocks D02)
**Labels:** `chore`, `priority: medium`
**Dependencies:** none. Merge order matters with the private security item, because both edit `constants/consts.tsx`.

---

### D04: Remove unused dependencies (in two tiers)

**Context**: a scan for packages with no import in non-test, non-`discarded/` source found 22 candidates. Many are peers of used packages, so this is not a blind delete.

**Scope**
- **Tier 1, remove** (no imports, no installed package peer-requires them): `fs`, `i`, `react-native-paper`, `react-native-popup-menu`, `react-native-fs`, `@react-native-community/slider`, and `eventemitter3` (only `utils/eventBus.ts` used it; remove after D03). Also drop `react-native-fs` from `expo.doctor.reactNativeDirectoryCheck.exclude` (`package.json:110-118`).
- **Tier 2, verify before touching** (no imports, but part of Expo's expected set or autolinked): `expo-file-system`, `expo-web-browser`, `expo-asset`, `expo-system-ui`, `expo-modules-core`, `@react-navigation/stack`. Check each with `npx expo-doctor` and `npx expo install --check`, and remove only what is confirmed safe.
- **Move, don't remove:** `react-test-renderer` is a test-only package (`components/__tests__/ThemedText.test.tsx`) but sits in `dependencies`, and at `19.1.0` against `react` `19.2.3`. Move it to `devDependencies` and align the version if the test still passes.
- **Keep:** `@types/he`, `@fortawesome/fontawesome-svg-core`, `react-native-svg`, `@react-native-picker/picker`, `@react-native-community/datetimepicker`, `expo-linking`, `react-native-gesture-handler`, `react-native-screens`, `@react-navigation/native`, `react-dom` and `react-native-web` (peers of used packages or needed for the web script).
- Out: replacing libraries, such as the two HTML-entity packages or the two title-case helpers.

**Acceptance criteria**
- [ ] `npm ci`, tests, `tsc` and lint pass.
- [ ] `npx expo-doctor` shows no new failures.
- [ ] A fresh dev build launches and the Home, Prayer, Settings and PDF screens open. **Removing native modules (`slider`, `react-native-fs`) changes the native binary, so this needs a manual check; I did not run the app.**
- [ ] `package-lock.json` is regenerated in the same PR.

**Effort / impact:** S-M / Medium-Low (review rec #5)
**Labels:** `chore`, `priority: low`
**Dependencies:** D03 (for `eventemitter3`).

---

### D05: Refresh the architecture docs and README

**Context**
- `docs/current-architecture.md` has 54 absolute links into a deleted worktree (`/Users/edes/Developer/work/SPAOC.worktrees/add-readme-file/...`). `docs/refactoring-plan.md` has 29 and `docs/next-refactoring-steps.md` has 1.
- `current-architecture.md` is stale in several places:
  - §5 says "there is one visible Jest snapshot test" and lists notification scheduling as untested (there are now 41 suites and 439 tests, with gateway, planner and saint-notification tests).
  - §6.2-6.4 describe `notified-*` markers and module-level state that no longer exist.
  - §4 describes configuration that has since changed.
- `README.md` is 18 lines (env setup only). It does not mention the test, coverage, lint or typecheck commands, the layer layout, or the docs.
- `CLAUDE.md` is untracked and lists the project structure without `domain/`, `api/` and `test-utils/`.

**Scope**
- In: convert absolute links to relative ones; bring §4, §5 and §6 up to date; mark `refactoring-plan.md` and `next-refactoring-steps.md` as historical; expand the README (scripts, layer layout, link to the docs); update `CLAUDE.md` and decide whether to commit it.
- Out: documenting unfinished work as if done. Describe the notification state as it is when this lands.

**Acceptance criteria**
- [ ] `grep -r "SPAOC.worktrees" docs` returns nothing.
- [ ] Every link in `docs/` resolves (checked with a link checker or a short script).
- [ ] The README lists the install, test, coverage, lint and typecheck commands.
- [ ] §5 test counts and "what is not tested" match a fresh `npm run coverage` run.

**Effort / impact:** S / Medium-Low (review rec #5)
**Labels:** `documentation`, `priority: low`
**Dependencies:** best after E1, so the notification sections are written once. The link fix can go any time.

---

### D06: Add characterization tests for the Prayer screen

**Context**: `app/(tabs)/prayer.tsx` is 851 lines and has **0% coverage**. It has no screen test at all, so any refactor of it (D07) runs without a net. The repo's own method is tests first, then the refactor (#31 before #42).

**Scope**
- In: render the screen against a fake `usePrayerFeature` (the same approach `homeScreen.test.tsx` takes with `useHomeFeature`) and pin current behaviour:
  - loading state
  - error text ("Error loading prayers")
  - empty text ("There are no liturgical texts today.")
  - epistle, gospel and optional third reading cards
  - tapping a reading pushes `/dailyReadings` with the expected params
  - tapping a daily service shows the "Silence Your Phone!" alert, then pushes `/pdfViewer`
  - the same for the Services and Lenten Services lists
  - choosing a date calls `load(date)`
- Out: any change to `prayer.tsx` itself.

**Acceptance criteria**
- [ ] `prayer.tsx` line coverage is at least 70%.
- [ ] Tests assert the pushed route and params (checked against `DailyReadingsParams` and `PdfViewerParams`).
- [ ] No production code changed.
- [ ] `npm run coverage` passes, with headroom above 80% lines for the whole repo.

**Effort / impact:** M / Medium-High (review rec #4)
**Labels:** `test`, `priority: medium`
**Dependencies:** none. D01 first is helpful.

---

### D07: Split the Prayer screen into components

**Context**: `prayer.tsx` repeats the same markup and logic several times:
- three near-identical reading cards (`:290-351`, `:354-415`, `:418-469`);
- the "Silence Your Phone!" alert plus `router.push("/pdfViewer")` three times (`:509`, `:615`, `:682`);
- inline catalogues of prayers, services and Lenten services (`:59-138`), with their URLs in `constants/consts.tsx`.

**Scope**
- In:
  - extract a `ReadingCard` component;
  - extract one `openServicePdf` helper that owns the alert text;
  - extract one list component for the three service lists;
  - move the static catalogues to their own module.
- Out:
  - behaviour changes;
  - passing readings by reference instead of full text through route params (note as a follow-up);
  - unifying `titlecase` and `he` with the rest of the app.

**Acceptance criteria**
- [ ] D06's tests pass unchanged.
- [ ] The alert text exists in exactly one place.
- [ ] `prayer.tsx` is substantially smaller (target: under about 400 lines) and holds layout only.
- [ ] No visual difference on a manual check of light and dark mode (I have not run the app).

**Effort / impact:** M / Medium-High (review rec #4)
**Labels:** `refactor`, `priority: medium`
**Dependencies:** **D06 must land first.**

---

### D08: Use the parish clock everywhere, and decide how event times are displayed

**Context**
- `domain/parishTime.ts` defines the parish day and an injectable `now()`. Eight call sites still read the device clock with `new Date()`: `app/(tabs)/index.tsx:138`, `hooks/useDailySaint.ts:9`, `hooks/useHomeFeature.ts:29,66`, `hooks/usePrayerFeature.ts:17`, `services/calendar/GoogleCalendarService.ts:54,76`, `services/favourites/favouritesRepository.ts:47`. Tests for these cannot pin the time through `setNow`.
- Day grouping uses Melbourne time (`utils/dateUtils.ts`), but event row and detail times are formatted in the **device** zone (`utils/eventTimes.ts:15-16`, `components/EventItem.tsx:46`). For a device outside Melbourne, a row can show a time that falls on a different day from its section heading (inferred from the code, not observed).
- `app/(tabs)/prayer.tsx:240` formats the selected date in the device zone as well. (The notification bodies in `favouriteNotifications.ts` and `calendarNotifications.ts` are covered by D13.)

**Scope**
- In: replace the eight clock reads with `now()`. **Needs a product decision:** show event times in parish time (consistent with grouping; recommended) or device time. Apply the decision in `formatEventTimes`, `EventItem` and the Prayer date title.
- Out: the notification planner (it already formats in parish time), `useForegroundRefresh` (`Date.now()` for elapsed time is fine).

**Acceptance criteria**
- [ ] `grep -rn "new Date()" app hooks services` shows no zero-argument clock reads outside `parishTime.ts`.
- [ ] Tests use `setNow` instead of fake timers for the changed hooks.
- [ ] The display decision is recorded in the PR, with a test for a device zone different from Melbourne.

**Effort / impact:** M / Medium-Low
**Labels:** `refactor`, `priority: low`
**Dependencies:** none. D13 first avoids touching code it deletes.

---

### D09: Surface loading and error state on Home, and stop reporting a failed saint fetch as "no saints"

**Context**
- `useHomeFeature` returns only `fastLoading` for gating (`hooks/useHomeFeature.ts:71-86`). It ignores `useEvents().loading` and `useDailySaint().error`. Failures are logged and shown as empty.
- `GoogleCalendarService.getSaintsForDate` returns `[]` on failure (`services/calendar/GoogleCalendarService.ts:86-101`). A failed request and a day without saints look the same, and `useDailySaint` reports "No saints found for today." for both (`hooks/useDailySaint.ts:11-16`).
- `getParishEvents` skips a failing calendar silently, and `getFastingEvents` throws (`:54-84`). Offline, misconfigured and empty all look alike. Only Prayer shows an error to the user.
- This is also what the notification reconcile step needs (D12): a loader that **throws** on failure so a failed load never cancels the schedule.

**Scope**
- In:
  - agree one convention (for example `{ data, loading, error }` per source);
  - expose it from the three data hooks and `useHomeFeature`;
  - show a non-blocking message on Home when a source failed;
  - give the saint loader a throwing variant and use it from D12.
- Out: retries, backoff, offline caching, and redesigning Prayer's existing error text.

**Acceptance criteria**
- [ ] A failed saints request is distinguishable from an empty day in hook state and in the UI.
- [ ] Home shows a visible, non-blocking message when events or saints fail to load.
- [ ] Tests cover failure for each of the three sources in `useHomeFeature.test.ts`.
- [ ] No behaviour change when everything loads.

**Effort / impact:** M / Medium-Low
**Labels:** `refactor`, `priority: low`
**Dependencies:** D12 (shares the throwing saint loader; do that part once).

---

### D10: Narrow `EventData`: drop the `data: never[]` artefact and type `source`

**Context**
- `types/global.d.ts:2` declares `data: never[]` in `EventData`. It exists only because `SectionList` sections use a `data` key, and the mapper fills it with `[]` (`services/calendar/googleCalendarMapper.ts:62`). Section types already carry `data` (`utils/homeRules.ts:4-8`).
- `source` is a bare `string` (`types/global.d.ts:10`). It is the key of the calendar registry (`domain/calendarSources.ts`), plus `"fasting"` and `"saints"` from `googleCalendarConfig.ts`. Typos compile.
- This is the remaining part of #34 ("Normalize remote data"): fasting and liturgical data are done; events and saints are not.

**Scope**
- In: remove `data` from `EventData`; derive a `CalendarSourceName` type from the registry (`as const`) and use it for `source`; update the mapper, fixtures and tests.
- Out: `saints: string[]` as a model (separate decision), and changing the route-param contract.

**Acceptance criteria**
- [ ] `EventData` has no `never[]` field.
- [ ] `source` is a union type; an unknown name fails `tsc`.
- [ ] All tests, `tsc` and lint pass.

**Effort / impact:** S-M / Medium-Low
**Labels:** `refactor`, `priority: low`
**Dependencies:** none. Link as a sub-task of #34.

---

### E1: Epic: finish the notification refactor

**Context**
Notifications are mid-migration and three patterns coexist:
- Saints go through `domain/notificationPlanner.ts` and the gateway (`services/notifications/saintNotifications.ts`), but **nothing calls `planNotifications` or `reconcileNotifications`** (36 planner tests cover code with no production caller).
- Favourites and calendars use their own inline rules (`favouriteNotifications.ts`, `calendarNotifications.ts`). Calendar scheduling reads `events-*` keys that nothing writes and is unreachable (`settings.tsx:207-381` is behind `false &&`).
- Toggle state lives in `app/settings.tsx` local state (`:54-79`), not in `settingsStore`, so the planner cannot read it synchronously.
- `utils/notifications.ts` (a throwing shim) and a root `notifications.tsx` sit outside `services/`.

Design: `docs/notification-planner.md` (planner, gateway, reconcile loop, store changes).

**Sub-issues** (the order below is the build order)
- [ ] #93 + #94 delete the shim and the dead `events-*` path *(existing, one PR)*
- [ ] #69 fix the saint toggle reset *(existing)*
- [ ] D11 settings in the store
- [ ] D12 reconcile step for saints
- [ ] D14 move root `notifications.tsx` into the service *(independent; any time after #93)*
- [ ] D13 decide favourite and calendar notifications

**Superseded by this epic:** #70, #71, #72 (see section 2b).

**Done when:** one pattern schedules every notification kind that is still supported; the planner and reconcile step are the only scheduling path; nothing outside `services/notifications/` calls `expo-notifications`.

**Effort / impact:** M overall / High (review rec #3)
**Labels:** `epic`, `refactor`, `priority: high`

---

### D11: Move notification toggles and calendar preferences into `settingsStore`

**Context**
- `services/settings/settingsStore.ts` holds only `startOfWeek` and `themeChoice`. The planner needs the notification settings synchronously, and today they are readable only through async repository calls (`isDailySaintNotificationsEnabled`, `isFavouriteNotificationsEnabled`, `getCalendarNotificationSettings`).
- The Settings screen keeps its own copy in local state (`app/settings.tsx:54-79`) and calls the repository directly from handlers (`:187-190`, `:216`, `:93`). A switch and the schedule can disagree (see #69 and its amendment).
- Design: "What settingsStore needs to export" in `docs/notification-planner.md`.

**Scope**
- In:
  - add `dailySaintsEnabled`, `favouritesEnabled` and `calendarNotifications` state and their setters, loaded in `hydrate()` through the existing repository functions;
  - make the Settings screen read and write through the store;
  - define **one** default for "unset" and use it in both the store and the scheduler.
- Out: changing AsyncStorage keys or formats (the repository stays the only code that touches them), and reviving the hidden Settings UI (#54).

**Acceptance criteria**
- [ ] `settingsStore` exposes the three pieces of state and setters, with tests in `settingsStore.test.ts`.
- [ ] `app/settings.tsx` has no notification-related local state or direct repository calls.
- [ ] A fresh install, with Settings never opened, treats saint notifications exactly as the toggle will show them.
- [ ] `settings.test.tsx` still asserts that screens do not touch storage directly.

**Effort / impact:** M / High
**Labels:** `refactor`, `priority: high`
**Dependencies:** #69 (so the default is settled first).

---

### D12: Write the reconcile step and use it for saint notifications

**Context**
- The reconcile loop is specified in `docs/notification-planner.md` ("Reconcile loop") but not written. `app/_layout.tsx:51` still calls `scheduleSaintNotificationsForNext7Days()`, and the Settings toggle calls schedule or cancel directly (`app/settings.tsx:187-196`).
- That path does not cancel a saint that is no longer planned, because `getSaintsForDate` returns `[]` on a failed fetch (`saintNotifications.ts` comment at `:10-16` and `GoogleCalendarService.ts:86-101`).

**Scope**
- In:
  - a reconcile function that loads inputs, calls `planNotifications`, lists scheduled notifications through the gateway, runs `reconcileNotifications` for the kinds that loaded, and cancels before scheduling;
  - **one run at a time**: if another is requested during a run, run once more afterwards;
  - a saint loader that throws on failure (shared with D09);
  - call it from the root layout and after a Settings change, replacing the direct schedule and cancel calls;
  - remove the old `scheduleSaintNotificationsForNext7Days` scheduling logic.
- Out: favourite and calendar kinds (D13), planning beyond 7 days, and Settings UI changes.

**Acceptance criteria**
- [ ] `planNotifications` and `reconcileNotifications` each have a production caller.
- [ ] Idempotent: a second run with nothing changed cancels and schedules nothing.
- [ ] A failed saint load leaves the existing schedule untouched.
- [ ] Turning saints off cancels every saint notification, including legacy ones with no key.
- [ ] Overlapping runs do not double-schedule (test with two concurrent calls).
- [ ] Tests use `test-utils/fakeExpoNotifications.ts` and `setNow`, with no mocking of whole notification modules.

**Effort / impact:** M / High
**Labels:** `refactor`, `priority: high`
**Dependencies:** D11, #93.

---

### D13: Decide the fate of favourite and calendar notifications, then act on it

**Context**
- Both are hidden behind `false &&` in Settings and are not wired into the app. Favourites: `favouriteNotifications.ts` is reachable only from the hidden toggle, and `planFavouriteNotifications` is a stub returning `[]` (`domain/notificationPlanner.ts:147-153`). Calendars: `calendarNotifications.ts` reads keys nothing writes, and the planner's calendar plan is complete but unused.
- `docs/notification-planner.md` leaves this as an open product decision. #54 ("Flesh out settings page") lists calendar notification settings among removed features.

**Scope** (needs your decision, with two options)
- **(a) Delete (recommended until the product wants them):** remove `favouriteNotifications.ts`, `calendarNotifications.ts`, the stub `planFavouriteNotifications`, and the hidden Settings blocks that call them (the planner's calendar plan can stay, tested, for later). Closes #70, #71 and #72.
- **(b) Build on the planner:** source events and favourites for `planNotifications`, add the kinds to reconcile (D12), and unhide the Settings UI. This becomes its own epic, tied to #54, #13 and #16.

**Acceptance criteria** (for option a)
- [ ] The two services and their tests are removed; nothing imports them.
- [ ] No `AsyncStorage` import remains under `services/notifications/`.
- [ ] Settings still renders (hidden blocks removed or left as commented-free stubs).
- [ ] The decision is recorded in `docs/notification-planner.md`.

**Effort / impact:** S (option a) / Medium
**Labels:** `refactor`, `priority: medium`
**Dependencies:** D12.

---

### D14: Move root `notifications.tsx` into `services/notifications/` and drop its unused exports

**Context**
- `notifications.tsx` sits at the repo root and holds the foreground handler, permission request and listeners, imported by `app/_layout.tsx:11-15`.
- It exports `scheduleNotification` and `cancelAllNotifications`, which have no callers. They are a second way to schedule that bypasses the gateway.
- It is outside every `collectCoverageFrom` glob, so it never appears in the coverage report (the residual gap of #75).

**Scope**
- In: move it to `services/notifications/`, update `app/_layout.tsx`, `__tests__/notifications.test.ts` and `__tests__/rootLayout.test.tsx`, and delete the unused exports.
- Out: changing what the handler or listeners do.

**Acceptance criteria**
- [ ] No file at the repo root named `notifications.tsx`.
- [ ] `grep` shows `expo-notifications` imported only inside `services/notifications/` (plus tests and `test-utils/`).
- [ ] The moved file appears in the coverage report.
- [ ] `rootLayout.test.tsx` and `notifications.test.ts` pass.

**Effort / impact:** S / Medium
**Labels:** `refactor`, `priority: medium`
**Dependencies:** #93 (cleaner imports); otherwise independent.

---

## 4. Not proposed

- `domain/calendarSources.ts` purity (dropped, section 0).
- Tests for `about.tsx`, `DonateSection.tsx` and `+not-found.tsx`: static screens (coverage 0%) where tests add little. Revisit only if the coverage threshold pushes for it.
- Consolidating the two colour systems (`constants/Colors.ts` is used by `ThemedText` through `useThemeColor`, so it is not a deletion). Worth its own issue only when theming is touched again.
- Test-folder convention (three styles): left to #27.
- #26 (date filter cropping): #90 reworked the month picker. Whether it is fixed needs a device check, which I cannot do.

---

## 5. Suggested sequence

Follows the review's top-5 priorities. Existing issues are in **bold**.

**Step 0: security first (outside the issue flow).** Rotate before anything is filed. See `issue-drafts-security.local`.

**Phase 1: quick wins and gates (rec #1, #2).**
1. **#93 + #94** as one PR. Removes the throwing shim and the dead `events-*` path.
2. D03: dead code. Also clears the `index.js` and `.yarn/` lint errors.
3. D01 and D02 in parallel. D02 lands after steps 1 and 2.
4. Small bug fixes can slot in any time: **#97**, **#69**, **#60**, **#63**.

**Phase 2: notifications (rec #3).**
5. **#69** → D11 → D12.
6. D14 whenever convenient after step 1.
7. D13 once you have made the product call.

**Phase 3: Prayer (rec #4).**
8. D06 → D07. D06 also restores coverage headroom, so it is worth doing early if other work adds files.

**Phase 4: residue and consistency (rec #5).**
9. D04, D10, D08.
10. D09 (after D12).
11. D05 last, so the docs are written once. **#77** can be done any time.

**Approval checklist (what I will do once you approve; nothing happens before)**
1. Create three priority labels: `priority: high`, `priority: medium`, `priority: low`.
2. Create E1 first, then D01-D14 (these will be numbered by GitHub), linking sub-issues in E1's task list and recording each issue's dependencies in its body.
3. Post the section 2c amendments as comments on #93, #94, #69, #77 and #62, with the cross-links on #54, #34 and #27.
4. Report the new numbers. I will **not** close any stale issue (#75, #76, #95, #96, #61, #64, #70, #71, #72); I will list them again for you.
5. The security item is only filed if you decide to, and in the form you choose.
