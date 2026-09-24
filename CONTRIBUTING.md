# Contributing

Read the [build guide](docs/build.md), [capability registry](docs/capabilities.json)
and [code of conduct](CODE_OF_CONDUCT.md) before contributing.

Use a topic branch and a pull request with the problem, observable behavior,
relevant tests and any platform limitations. Preserve upstream license notices;
do not submit code or assets you cannot license for this repository.

Run `python3 scripts/public_policy.py --root . --format json` before proposing
public documentation changes. The bootstrap allowlist is exact: add a path to the
policy only when its purpose and public content have been reviewed. A successful
policy scan does not replace human review or runtime testing.

Write public-facing copy in English. Distinguish Available, Beta, Experimental,
Planned and Unsupported capabilities using the registry annotations documented in
[the documentation index](docs/README.md). Include targeted tests with code changes
and state explicitly which checks were run. Do not run a collector against another
person's data or include real activity in fixtures.

Public issues are for reproducible, non-sensitive bugs. Follow [SECURITY.md](SECURITY.md)
for vulnerabilities. Maintainer identities, payment arrangements and private contact
routes are not implied by inherited upstream documents.
