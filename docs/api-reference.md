# LikeHome API reference

All routes are under `/api`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/healthz` | API health |
| GET | `/hotels` | Search, filter, sort, and check availability |
| GET | `/hotels/:slug` | Hotel detail and rooms |
| GET | `/auth/session` | Current session |
| POST | `/auth/signup` | Create demo account |
| POST | `/auth/login` | Start session |
| POST | `/auth/logout` | End session |
| GET/POST | `/bookings` | List or create reservations |
| GET/PATCH | `/bookings/:id` | Read or change a reservation |
| POST | `/bookings/:id/cancel` | Apply cancellation policy |
| GET | `/rewards` | Balance and transaction history |

All booking writes are server-side validated. The client never supplies user ownership, authoritative prices, totals, or status.