# Contributing to Evyatar Monorepo

Thank you for contributing to this project! 

## 📋 Before You Start

1. Make sure you have the latest version of the code
2. Create a new branch for your feature/fix
3. Follow the commit message guidelines

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

```bash
# Work on your changes in a specific app
pnpm --filter web-portfolio dev

# Or if working on backend
pnpm --filter lev-hedva-api dev
```

### 3. Test Your Changes

```bash
# Run tests for your app
pnpm --filter web-portfolio test

# Type check
pnpm --filter web-portfolio type-check

# Lint
pnpm --filter web-portfolio lint
```

### 4. Format Your Code

```bash
# Format your changes
pnpm format

# Or specific app
pnpm --filter web-portfolio format
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve issue"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Commit Message Guidelines

Use conventional commits:

```
feat:     A new feature
fix:      A bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc)
refactor: Code refactoring without feature changes
test:     Adding or updating tests
chore:    Maintenance tasks, dependencies
```

Examples:
```bash
git commit -m "feat: add dark mode to web-portfolio"
git commit -m "fix: resolve TypeScript errors in lev-hedva-api"
git commit -m "docs: update README with new setup instructions"
```

## 🎯 Pull Request Process

1. **Fill out the PR template** with:
   - What changes you made
   - Why you made them
   - Any relevant issue numbers
   - Testing instructions

2. **Ensure CI passes**:
   - ✅ All checks pass
   - ✅ No linting errors
   - ✅ TypeScript builds successfully

3. **Request review** from relevant maintainers

4. **Address feedback** and push updates

## 🚫 What NOT to Do

- Don't commit `node_modules` or `.turbo`
- Don't hardcode environment variables
- Don't make breaking changes without discussion
- Don't update `pnpm-lock.yaml` manually
- Don't modify shared configs without PR discussion

## 📦 Adding Dependencies

### To a specific workspace

```bash
pnpm --filter web-portfolio add axios
pnpm --filter web-portfolio add -D typescript
```

### To shared packages

```bash
pnpm --filter @monorepo/shared-utils add lodash
```

### To root (dev tools only)

```bash
pnpm add -D -w turbo
```

## 🏗️ Project Structure Rules

- **Frontend apps**: `apps/frontend/{app-name}/`
- **Backend apps**: `apps/backend/{app-name}/`
- **Shared packages**: `packages/{package-name}/`
- **Configs**: `configs/{config-type}/`

## ✅ Code Standards

- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

## 🆘 Questions?

Check:
- [DEVELOPMENT.md](./DEVELOPMENT.md) for setup
- [README.md](./README.md) for overview
- Individual app READMEs for specific guidance

Happy coding! 🎉
