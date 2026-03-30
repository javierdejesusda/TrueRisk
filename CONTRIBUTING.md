# Contributing to TrueRisk

Thank you for your interest in contributing to TrueRisk.

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Set up the development environment following the [README](README.md#getting-started)

## Development Workflow

### Branch Naming

- `feat/` — New features
- `fix/` — Bug fixes
- `refactor/` — Code restructuring
- `docs/` — Documentation changes
- `test/` — Test additions or fixes

### Code Standards

**Frontend (TypeScript):**
- Run `npx tsc --noEmit` — no type errors
- Run `npx eslint .` — no lint errors
- Run `npm test` — all tests pass

**Backend (Python 3.12):**
- Run `ruff check .` — no lint errors (line-length=100)
- Run `mypy app` — no type errors
- Run `pytest` — all tests pass

### Commit Messages

Use [Conventional Commits](https://conventionalcommits.org):

```
feat(scope): add new feature
fix(scope): fix specific bug
docs: update documentation
refactor(scope): restructure code
test(scope): add or fix tests
chore: maintenance tasks
```

## Pull Requests

1. Ensure all checks pass locally before opening a PR
2. Target the `main` branch
3. Provide a clear description of what changed and why
4. Link related issues if applicable

## Database

- Use PostgreSQL-compatible SQL — no SQLite-specific syntax
- Use timezone-aware datetimes (`datetime.now(timezone.utc)`)
- Test migrations with `alembic upgrade head`

## Internationalization

When adding user-facing strings, update both translation files:
- `messages/en.json`
- `messages/es.json`

## Reporting Issues

Use [GitHub Issues](https://github.com/javierdejesusda/TrueRisk/issues) to report bugs or request features. Include:
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (OS, browser, Node/Python version)
