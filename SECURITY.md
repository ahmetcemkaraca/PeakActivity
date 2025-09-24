# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.4.0   | :white_check_mark: |
| < 0.4.0 | :x:                |

## Reporting a Vulnerability

If you discover a vulnerability, please report it immediately through our
dedicated security channel. Send an encrypted email with full details to
[ackaraca07@gmail.com](mailto:ackaraca07@gmail.com).

**Response Time:** We aim to acknowledge all security reports within 24 hours
and provide a preliminary assessment within 72 hours. For critical
vulnerabilities, our response will be immediate.

**Disclosure Policy:** We follow a responsible disclosure policy. Please provide
us with a reasonable time (e.g., 90 days) to address the vulnerability before
public disclosure. We commit to transparency and will keep you informed of our
progress.

## Our Security Measures

PeakActivity is committed to protecting user data through a multi-layered
security approach:

### 1. Data Encryption

- All sensitive user data is encrypted at rest and in transit using AES-256-GCM.
- Client-side encryption ensures that your private data is encrypted before it
  leaves your device, and only you hold the key.
- Key derivation for master passwords uses Argon2id with strong parameters
  (minimum 3 passes, 64MB memory).

### 2. Key Management

- User master keys are securely stored in OS-native keychains (Windows
  Credential Store, macOS Keychain, Linux Secret Service).
- Automated key rotation is implemented to regularly refresh encryption keys,
  enhancing forward secrecy.
- Multiple key recovery options (security questions, backup codes, email
  recovery) are available.

### 3. Authentication and Authorization

- Firebase Authentication is used for robust user identity management.
- All API endpoints are protected by strong authentication and authorization
  middleware, ensuring only authorized users can access their data.
- Firestore and Storage security rules are strictly enforced to prevent
  unauthorized data access.

### 4. Data Privacy and Anonymization

- We adhere to a strict data minimization policy, collecting only necessary
  data.
- Granular user consent is obtained for different data collection levels,
  allowing you full control.
- Data anonymization techniques are applied for analytical data to protect
  privacy.

### 5. Secure Development Practices

- All code undergoes rigorous security reviews and static/dynamic analysis.
- Dependencies are regularly scanned for vulnerabilities and kept up-to-date.
- Input validation and sanitization are implemented across all user-facing
  components.

### 6. Incident Response Plan

- We have a documented incident response plan to quickly identify, contain,
  eradicate, recover from, and post-analyze security incidents.
- Our team is trained to handle security breaches with urgency and transparency.

### 7. Compliance

- PeakActivity complies with GDPR and other relevant data protection
  regulations.
- Our security practices are aligned with industry standards like OWASP Top 10
  and NIST Cybersecurity Framework.

## Security Contact

For any security-related inquiries or to report a vulnerability, please contact
[ackaraca07@gmail.com](mailto:ackaraca07@gmail.com).
