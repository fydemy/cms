# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in @fydemy/cms, please report it by emailing security@fydemy.com (or create a private security advisory on GitHub).

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

We will acknowledge your email within 48 hours and send a more detailed response within 7 days indicating the next steps in handling your report.

## Security Best Practices

When using @fydemy/cms, follow these security best practices:

### Environment Variables

- Use strong, random values for `CMS_SESSION_SECRET` (minimum 32 characters)
- Use strong passwords for `CMS_ADMIN_PASSWORD`
- Never commit `.env` files to version control
- Rotate credentials regularly

### GitHub Token

- Use GitHub Personal Access Tokens with minimal required permissions (only `repo` scope)
- Use fine-grained personal access tokens when possible
- Store tokens securely in your deployment platform's secret management

### Network Security

- Always use HTTPS in production
- Configure your Next.js app behind a reverse proxy or CDN
- Enable security headers (CSP, HSTS, X-Frame-Options, etc.)

### Rate Limiting

- The built-in rate limiter is memory-based and resets on server restart
- For production, consider implementing Redis-based rate limiting
- Monitor failed login attempts

### File Uploads

- The default file size limit is 10MB
- Validate file types on the client and server
- Consider implementing virus scanning for uploaded files
- Use Content Security Policy headers to prevent XSS from uploaded content

### Session Security

- Session cookies are httpOnly, sameSite=lax, and secure in production
- Sessions expire after 7 days
- Consider shorter session duration for sensitive applications

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release new versions as soon as possible
5. Credit the reporter (unless they prefer to remain anonymous)
