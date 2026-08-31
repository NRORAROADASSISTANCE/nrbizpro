# NR BizPro Desktop

Windows desktop foundation for NR BizPro.

## Design goals

- Use the existing NR BizPro web application as the authenticated UI.
- Keep customer/business data private from NR BizPro support/admin users.
- Keep the server as the source of truth for authenticated business data.
- Add encrypted local backup/export and authenticated restore.
- Later add offline-first local storage and conflict-safe synchronization.
- Do not replace the live web application until desktop flows are tested.

## Recovery model

1. Business signs in on a new/repaired PC.
2. Existing server data is fetched after authentication.
3. If required, the business selects its encrypted `.nrbak` backup.
4. The user supplies the backup password locally.
5. The decrypted data is sent only through the authenticated data API for restore.
6. The app reloads from the server source of truth.

The current desktop shell intentionally does not expose Node integration to the website.
