# api-chain 🔗

A small Node.js service that chains public APIs: calls one, validates the
response, and feeds data into the next — a mini service orchestrator,
built with its own automated test suite.

**Status:** 🚧 Work in progress — rebuilt as a portfolio project.

## Goals
- Build a REST service with Express
- Chain 2-3 public APIs into one useful response
- Automated testing (Supertest / Playwright)
- CI with GitHub Actions

## Roadmap
- [X] Basic Express server with a health endpoint
- [X] Integrate first public API
- [X] Migrate to Frankfurter v2 for wider currency coverage
- [X] Chain second API
- [ ] Automated tests
- [ ] GitHub Actions pipeline
