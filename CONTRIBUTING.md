# Contributing to Moha Gaming Lab

Thank you for your interest in contributing to Moha Gaming Lab! We welcome bug reports, feature suggestions, documentation improvements, and code contributions.

## Code of Conduct

Please treat everyone with respect and courtesy. Harassment, discrimination, or abusive behavior of any kind is not tolerated.

## Development Workflow

1. **Fork or Branch**: Create a branch off `main` with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Fill in local development variables
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate --schema=./prisma/schema.prisma
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

## Quality Checklist Before Submitting PRs

Before opening a pull request, ensure all validation checks pass cleanly:

```bash
# 1. Lint
npm run lint

# 2. Type Check
npm run type-check

# 3. Test Suites
npm run test:all

# 4. Production Build
npm run build
```

## Commit Convention

Please use conventional commit prefixes to keep git history clean and understandable:

- `feat:` New user-facing feature or enhancement
- `fix:` Bug fix or error resolution
- `docs:` Documentation updates or additions
- `refactor:` Code restructuring without behavioral change
- `perf:` Performance improvements
- `test:` Test additions or modifications
- `chore:` Dependency bumps, build configs, or maintenance

## Submitting Pull Requests

- Keep pull requests focused on a single change or feature.
- Use the pull request template and fill in all applicable sections.
- Ensure automated CI checks pass.
