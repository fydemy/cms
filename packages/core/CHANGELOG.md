# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-06

### Added

- Initial stable release of @fydemy/cms
- File-based CMS for Next.js with markdown support
- GitHub integration for production deployments
- Simple authentication with username/password from environment variables
- TypeScript support with full type definitions
- Local and GitHub storage providers
- API handlers for content management (CRUD operations)
- Authentication middleware for protecting admin routes
- Session management with JWT
- File upload functionality
- Collection and directory listing utilities

### Security

- Timing-safe password comparison using `crypto.timingSafeEqual` to prevent timing attacks
- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Input validation and sanitization for all user inputs
- Path validation to prevent directory traversal attacks
- File size limits (10MB maximum)
- Frontmatter sanitization to prevent injection attacks
- Secure session cookies with httpOnly, sameSite, and secure flags
- Length limits on username (100 chars) and password (1000 chars) inputs
- Generic error messages to prevent username enumeration

### Documentation

- Comprehensive README with installation and usage instructions
- JSDoc documentation for all public APIs
- Security policy and vulnerability reporting guidelines
- MIT License

## [0.1.0] - 2024-12-05

### Added

- Initial development release
- Basic file-based CMS functionality
- Simple authentication
- Markdown file operations
