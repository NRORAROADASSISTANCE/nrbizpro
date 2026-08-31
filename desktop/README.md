# NR BizPro Desktop

Windows desktop client foundation.

## Safety requirements
- Do not store plaintext customer backups.
- Desktop data must be encrypted at rest.
- Cloud backup must be encrypted before upload.
- Restore must require business-account authentication and explicit user confirmation.
- Desktop must continue billing during temporary network outages.
- Sync must use conflict-safe server APIs; never overwrite newer server data blindly.

## Build roadmap
1. Secure local database adapter.
2. Offline billing queue and idempotent sync.
3. Encrypted backup/restore UI.
4. Windows NSIS and portable builds.
5. Production QA before release.
