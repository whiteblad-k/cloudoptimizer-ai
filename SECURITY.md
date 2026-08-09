# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability in **cloudoptimizer-ai**, please **DO NOT** open a public GitHub issue. Instead, please email us with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any proof-of-concept code

We will acknowledge your report within 48 hours and work with you to understand and resolve the issue.

---

## Security Guidelines

### 1. Authentication & Authorization

#### Google OAuth Implementation
- **Redirect URI Validation**: Always validate the redirect URI against a whitelist
  ```typescript
  const ALLOWED_REDIRECT_HOSTS = process.env.ALLOWED_REDIRECT_HOSTS?.split(',') || [];
  
  const getRedirectUri = (req: any): string => {
    const host = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : `${(req.headers["x-forwarded-proto"] as string) || req.protocol || "http"}://${req.get('host')}`;
    
    // Validate host against whitelist
    const urlHost = new URL(`${host}/`).hostname;
    if (!ALLOWED_REDIRECT_HOSTS.includes(urlHost)) {
      throw new Error('Invalid redirect host');
    }
    
    return `${host}/auth/google/callback`;
  };
  ```

- **Authorization Code Handling**
  - Validate authorization code format before use
  - Implement timeout for code exchange (codes expire after 10 minutes)
  - Use PKCE (Proof Key for Code Exchange) when applicable

- **Token Storage**
  - Store refresh tokens securely (encrypted in database)
  - Never expose tokens in URLs or logs
  - Implement token rotation for long-lived sessions

#### Session Management
- Use HTTPS only (enforce with HSTS headers)
- Implement secure session cookies:
  ```typescript
  sessionOptions = {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
  ```
- Set appropriate cookie flags in production
- Implement session timeout and re-authentication for sensitive operations

---

### 2. Input Validation & Sanitization

#### Data Validation
- Validate all user inputs on the server side
- Use strict type checking with TypeScript
- Implement request schema validation (e.g., Joi, Zod)

#### SQL Injection Prevention
- Use parameterized queries for all database operations
- Example with parameterized query:
  ```typescript
  // ✅ CORRECT
  await db.query('SELECT * FROM users WHERE email = ?', [userEmail]);
  
  // ❌ AVOID
  await db.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
  ```

#### XSS Prevention
- Sanitize all user-generated content before rendering
- Use templating engines with auto-escaping enabled
- Implement Content Security Policy (CSP) headers

#### CSRF Prevention
- Implement CSRF tokens for state-changing operations
- Use SameSite cookie attribute (`sameSite: 'strict'`)
- Validate origin/referer headers

---

### 3. Environment & Secrets Management

#### Secret Handling
- **Never commit secrets** to version control
- Use environment variables for all sensitive data:
  ```
  GOOGLE_CLIENT_ID=<your-client-id>
  GOOGLE_CLIENT_SECRET=<your-client-secret>
  DATABASE_URL=<database-connection-string>
  JWT_SECRET=<strong-random-secret>
  RAILWAY_PUBLIC_DOMAIN=<domain>
  ALLOWED_REDIRECT_HOSTS=<comma-separated-hosts>
  ```

- Use `.env.example` with placeholder values
- Implement `.gitignore` to exclude:
  ```
  .env
  .env.local
  .env.*.local
  node_modules/
  *.log
  dist/
  build/
  ```

#### Secret Rotation
- Rotate secrets regularly (especially `JWT_SECRET` and OAuth credentials)
- Implement graceful secret migration for zero-downtime rotations
- Monitor for leaked secrets using tools like:
  - git-secrets
  - TruffleHog
  - GitHub's secret scanning

---

### 4. HTTPS & Transport Security

#### SSL/TLS Configuration
- Always use HTTPS in production
- Enforce HTTPS redirect for all HTTP requests
- Implement HSTS (HTTP Strict-Transport-Security):
  ```typescript
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  ```

#### Certificate Management
- Use valid SSL/TLS certificates (Railway handles this)
- Monitor certificate expiration dates
- Implement certificate pinning for API clients if needed

---

### 5. API Security

#### Rate Limiting
- Implement rate limiting on authentication endpoints
  ```typescript
  import rateLimit from 'express-rate-limit';
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts'
  });
  
  app.get("/api/auth/google/url", authLimiter, (req, res) => {
    // ...
  });
  ```

#### CORS Configuration
- Implement strict CORS policy:
  ```typescript
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  ```

#### API Versioning
- Use API versioning to manage breaking changes securely
- Deprecate old API versions gradually
- Document API security requirements

---

### 6. Database Security

#### Connection Security
- Use connection strings with credentials over encrypted channels
- Implement connection pooling with appropriate timeouts
- Use SSL/TLS for database connections:
  ```typescript
  const dbUrl = process.env.DATABASE_URL;
  // Ensure SSL is enforced in production
  const sslMode = process.env.NODE_ENV === 'production' ? 'require' : 'allow';
  ```

#### Data Protection
- Hash passwords with strong algorithms (bcrypt, scrypt, Argon2):
  ```typescript
  import bcrypt from 'bcrypt';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  const isValid = await bcrypt.compare(inputPassword, hashedPassword);
  ```

- Encrypt sensitive data at rest (OAuth tokens, API keys)
- Implement field-level encryption for PII data
- Use parameterized queries to prevent SQL injection

#### Access Control
- Apply principle of least privilege to database users
- Implement row-level security where applicable
- Audit database access and modifications

---

### 7. Dependency Management

#### Security Audits
- Run regular security audits:
  ```bash
  npm audit
  npm audit fix
  yarn audit
  ```

- Use automated tools:
  - Dependabot
  - Snyk
  - npm's built-in audit

#### Version Management
- Keep dependencies up-to-date
- Monitor security advisories
- Pin major versions in `package.json`
- Review dependency licenses

#### Vulnerable Dependencies
- Remove or replace known vulnerable packages immediately
- Monitor for deprecated packages
- Use lockfiles (`package-lock.json` or `yarn.lock`)

---

### 8. Error Handling & Logging

#### Error Responses
- Never expose sensitive information in error messages
  ```typescript
  // ❌ BAD
  res.status(400).json({ error: 'User not found in database at table xyz' });
  
  // ✅ GOOD
  res.status(400).json({ error: 'Invalid credentials' });
  ```

- Implement custom error classes
- Log detailed errors internally only

#### Logging
- Log security-relevant events:
  - Authentication attempts (success/failure)
  - Unauthorized access attempts
  - API rate limit violations
  - Data access and modifications

- Implement structured logging:
  ```typescript
  logger.info('User login', {
    userId: user.id,
    timestamp: new Date(),
    ip: req.ip
  });
  ```

- Exclude sensitive data from logs:
  ```typescript
  // ❌ BAD
  logger.info('OAuth token:', tokens);
  
  // ✅ GOOD
  logger.info('OAuth token exchanged successfully');
  ```

---

### 9. OAuth 2.0 Security Best Practices

#### Authorization Code Flow
- Implement proper state parameter validation:
  ```typescript
  // Generate state
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  
  // Validate state on callback
  if (req.query.state !== req.session.oauthState) {
    return res.status(400).send('State mismatch - CSRF attack detected');
  }
  ```

- Validate authorization code before exchange
- Implement code expiration handling
- Secure token storage (encrypted, server-side)

#### Token Security
- Use appropriate token types (Bearer tokens)
- Implement token refresh mechanism
- Set reasonable token expiration times
- Invalidate tokens on logout

---

### 10. Modular Architecture Security

#### Module Isolation
- Keep authentication logic separate from business logic
- Use dependency injection for security services
- Implement clear security boundaries between modules

#### Configuration Management
- Centralize security configuration
- Use environment-specific configurations
- Implement feature flags for security features

---

## Development & Deployment Checklist

### Before Deployment
- [ ] All environment variables are set and validated
- [ ] Secrets are NOT committed to version control
- [ ] HTTPS/SSL is properly configured
- [ ] Rate limiting is enabled on sensitive endpoints
- [ ] CORS policy is configured correctly
- [ ] Security headers are set (HSTS, CSP, X-Frame-Options, etc.)
- [ ] Dependencies are audited and up-to-date
- [ ] Input validation is implemented on all endpoints
- [ ] Error handling doesn't expose sensitive information
- [ ] Logging is configured to exclude sensitive data
- [ ] Database connections use SSL/TLS

### During Deployment
- [ ] Verify environment variables on deployment platform (Railway)
- [ ] Test OAuth flow end-to-end
- [ ] Verify SSL certificate validity
- [ ] Test rate limiting functionality
- [ ] Monitor initial requests for anomalies

### Post-Deployment
- [ ] Monitor error logs for security-related issues
- [ ] Set up alerts for suspicious activities
- [ ] Regularly review access logs
- [ ] Implement penetration testing
- [ ] Establish incident response procedures

---

## Security Headers Configuration

Implement the following security headers in your Express application:

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HSTS - enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

---

## Incident Response

### Security Incident Procedure
1. **Identify**: Detect and confirm the security incident
2. **Isolate**: Contain the threat to prevent further damage
3. **Investigate**: Determine scope, cause, and impact
4. **Remediate**: Fix the vulnerability and patch systems
5. **Review**: Post-incident analysis and prevention measures
6. **Communicate**: Notify affected users if necessary

### Reporting
- For production incidents: Follow your organization's incident response plan
- For vulnerabilities: See "Reporting Security Vulnerabilities" section above

---

## Resources & References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [OAuth 2.0 Security Best Current Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Railway Documentation](https://docs.railway.app/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-08-09 | Initial security policy document |

---

**Last Updated**: 2026-08-09

For questions or concerns about security, please contact the project maintainers privately.
