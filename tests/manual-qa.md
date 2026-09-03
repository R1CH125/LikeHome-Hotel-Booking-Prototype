# LikeHome manual QA checklist

Use a fresh browser session for each scenario. Fill in Actual result and Pass/fail during the team demo.

| Test | Feature | Preconditions | Steps | Expected result | Actual result | Pass/fail |
| --- | --- | --- | --- | --- | --- | --- |
| QA-01 | Signup/login | Logged out | Create an account, log out, log back in | Account is created, session persists, logout ends access |  |  |
| QA-02 | Hotel browsing | None | Open home and search pages | Featured and matching stays render with images, prices, ratings, and fallback copy |  |  |
| QA-03 | Search/filter/sort | None | Search by location, set price/rating filters, change sort | Results update and show empty state when nothing matches |  |  |
| QA-04 | Room availability | Valid dates | Open a hotel and select guests | Only rooms that fit guests and dates are reservable |  |  |
| QA-05 | Create reservation | Logged in, valid dates | Select room, continue to checkout, submit Demo Payment | Confirmation number, total, and paid status appear |  |  |
| QA-06 | Price calculation | Hotel and dates selected | Compare nightly price × nights with checkout total | Total equals server-calculated nights and price |  |  |
| QA-07 | Overlap prevention | Existing confirmed booking | Try another stay with overlapping dates | Server rejects the second overlapping reservation |  |  |
| QA-08 | My Bookings access | Logged in | Open bookings, refresh, open confirmation | Only the current user's bookings appear |  |  |
| QA-09 | Change reservation | Existing upcoming booking | Change dates, guests, or room | Availability is checked and recalculated booking is shown |  |  |
| QA-10 | Cancellation | Existing upcoming booking | Start cancel flow and confirm | Policy and charge are shown; reservation becomes cancelled |  |  |
| QA-11 | Cancellation charge | Booking within 48 hours | Cancel a near-term booking | 20% charge and partial refund status are shown |  |  |
| QA-12 | Payment failure | Checkout open | Use the demo failure control | Booking is not silently marked paid and an understandable error appears |  |  |
| QA-13 | Reward earning/redemption | Completed demo stay or seeded points | Open rewards and apply points at checkout | Balance and history update; balance never goes negative |  |  |
| QA-14 | Mobile/accessibility | Desktop and mobile viewport | Keyboard through forms and resize to phone | Labels, focus states, readable layout, and no horizontal overflow |  |  |