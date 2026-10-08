# NR CHAT Mobile — Store Ready Structure

## Targets
- Android: Google Play Store
- iOS: Apple App Store
- Web: /nr-chat/
- Beta: /nr-chat-beta/

## Product identity
- App name: NR CHAT
- Publisher/brand: NR CONNECT
- Stable package ID placeholder: in.nrconnect.nrchat
- iOS Bundle ID placeholder: in.nrconnect.nrchat

## Architecture
Web and mobile clients use the same Supabase backend.
Authentication, profiles, conversations, messages, media, presence and notifications remain shared.

## Release channels
- Production: NR CHAT
- Beta: NR CHAT Beta
- Android testing: Play Console internal/closed testing
- iOS testing: TestFlight

## Store preparation checklist
1. Finalize legal publisher/company details.
2. Create Google Play Console developer account.
3. Create Apple Developer Program account.
4. Configure Android signing/upload key.
5. Configure iOS bundle ID, certificates and provisioning.
6. Prepare privacy policy and terms URLs.
7. Prepare app icon, splash screen and screenshots.
8. Configure push notifications.
9. Connect Supabase production project.
10. Run internal Android and TestFlight iOS testing.
11. Submit production builds for store review.

## Important
Do not publish credentials, private keys, service-role keys, signing certificates or API secrets in the repository.
