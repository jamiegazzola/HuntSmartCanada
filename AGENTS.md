# Repository release and Netlify credit policy

These instructions apply to human and AI-assisted development. Optimize Netlify credits without reducing correctness, security, or verification.

## Release rules
- Confirm repository, target branch, environment, current main HEAD, and published deployment before changes.
- Develop a coherent task or batch on a short-lived feature branch; inspect, fix, and test there. Do not push incremental app fixes to production main. Keep unrelated projects separate.
- Prefer one push of a validated batch and one pull request. Run build, unit/static checks and targeted browser tests in CI using locally built assets wherever supported. Use the Netlify Deploy Preview for necessary hosted integration and final responsive checks, not every intermediate edit.
- Merge only after relevant tests pass, unless an explicitly authorized urgent hotfix requires a narrow exception. Complete a requested production change on main; do not postpone it without agreement. Never silently combine unrelated production changes.
- One production deploy per completed release batch. After merging, verify the actual deployed application commit, deploy readiness, and a focused live smoke test. Run full live QA when the change warrants it; do not repeatedly run unrelated suites or refresh the live site unnecessarily.
- For changes strictly limited to CI, documentation, or agent instructions that do not affect deployed output, use `[skip netlify]` in the commit message (not `[skip ci]`). Do not use this on app code, build/runtime configuration, data, or security changes. Verify the prior published application commit remains live when applicable; distinguish docs-only HEAD from the deployed application SHA.
- Do not disable required security, privacy, build, or regression checks to save credits. Fix genuine failures, rerun affected tests, and only repeat full suites when their scope demands it. Avoid starting multiple redundant QA runs against the same candidate.
- While credits are constrained, aim for at most one planned production release per project per day where practical; critical fixes or explicit release requests take precedence. Reconcile credit usage periodically; do not claim unmeasured savings.
- After work, state what was changed, the verified CI/deployment status, and any real limitations. Use Conventional Commits.

## HuntSmart Canada
- Preserve BC and Alberta data separation, existing UI conventions, and map/LEH/GOS behavior.
- The Release Preflight workflow builds the actual Netlify preview command in GitHub CI and performs local HTTP asset checks; this does not deploy anything. The Mobile Browser and Distribution QA workflow runs comprehensive Chromium/WebKit journeys for relevant PRs and can be dispatched when a significant release requires a full production check.
- Run the existing targeted production QA for the affected areas (e.g., mobile, map, PWA, hunt details). For full map production audit, run on the app release commit rather than a later workflow-only commit. For protected species data, verify the authorized production path and keep private data private; local preview builds are not a substitute for production-only integration.
