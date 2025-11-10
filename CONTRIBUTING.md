# Contributing to Nocturna Chart Service

Thank you for your interest in contributing to Nocturna Chart Service!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/nocturna-image.git`
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to your fork: `git push origin feature/my-feature`
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run in development mode
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Code Style

- Use ESLint configuration provided
- Format code with Prettier
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## Testing

- Write unit tests for services and utilities
- Write integration tests for API endpoints
- Maintain test coverage above 70%

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

## Pull Request Process

1. Update README.md with details of changes if needed
2. Update API documentation in docs/API.md
3. Add tests for new functionality
4. Ensure all tests pass
5. Update the version number if applicable
6. Request review from maintainers

## Commit Message Format

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add synastry chart rendering
fix(renderer): handle missing planet data
docs(readme): update installation instructions
```

## Reporting Bugs

Create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version)
- Relevant logs or screenshots

## Feature Requests

Create an issue with:
- Clear description of the feature
- Use cases and benefits
- Possible implementation approach

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

