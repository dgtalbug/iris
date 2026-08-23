# Security policy

## Supported versions

Iris is released from `main` as a single line. The most recent published version
receives security fixes; older versions do not.

| Version | Supported |
| ------- | --------- |
| 0.3.x   | yes       |
| < 0.3   | no        |

## Reporting a vulnerability

Report suspected vulnerabilities privately through GitHub's
[security advisory form](https://github.com/dgtalbug/iris/security/advisories/new).
Please do not open a public issue for an unfixed vulnerability.

Include the Iris version (`iris --version`), the Node.js version, the platform, and
the smallest reproduction you have. You can expect an acknowledgement within seven
days and, once a fix exists, a patch release with the advisory published alongside it.

## Scope

Iris is a local-first CLI. It writes into the repository it is run in, reads its own
packaged templates, and renders offline HTML pages. The areas most worth reporting on:

- Writes that escape the repository the command was run in, or that follow a symlink
  out of it.
- Content that reaches a generated page unescaped and executes in a browser.
- A generated page that loads anything over the network; pages are `file://`-safe and
  offline by contract.
- Overwriting user-authored content that the managed-ownership rules say is preserved.

`iris vendor` is the only command that fetches from the network, and it pins what it
copies. Everything else is expected to work with no network access at all.
