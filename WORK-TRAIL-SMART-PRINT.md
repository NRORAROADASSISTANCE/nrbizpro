# NR BizPro Smart Print — Work Trail

## Final commercial model
- Registration: ₹2,000 — 3 years
- Renewal: ₹1,000 — 1 year
- Applicable transaction platform fee: ₹200
- Legacy points/recharge model: retired

## Product scope
- WhatsApp/downloaded document cleanup
- Shadow and uneven-light removal
- Edge and perspective correction
- Clean xerox-style print output
- A4/A5 print preparation
- Premium passport photo workflow with 8-up DSLR-style output

## Integration rules
- Smart Print is a dedicated section on the NR BizPro main dashboard.
- Existing Billing and UPI functionality must remain intact.
- Existing print-processing pipeline must not be overwritten by commercial-model changes.
- Payment activation must be verified server-side in production.

## Change history
- Added final business rules and pricing UI.
- Added license lifecycle helpers.
- Added server-side transaction-fee contract.
- Added checkout summary contract.
- Added main-dashboard Smart Print entry point.
- Restored sequential loading of existing billing scripts after dashboard integration changes.
- Improved scanner-style document edge detection with contour closing, stronger candidate scoring, margin checks, and safer four-corner perspective selection.

## Next verification checklist
- Main dashboard loads normally.
- Smart Print Portal opens from main dashboard.
- Billing/new bill/products/customers/history still work.
- Existing UPI flow still loads.
- Smart Print image cleanup and passport 8-up workflow still work.
- Verify actual uploaded photo produces a tight document crop; if detection fails, add an interactive four-corner adjustment rather than returning an uncropped image.
- Production payment webhook/signature verification is required before real-money launch.
