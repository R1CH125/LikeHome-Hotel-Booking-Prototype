# LikeHome database design

`profiles` mirrors the Supabase Auth user and stores reward balance. `hotels` owns the searchable stay, `hotel_images` stores its gallery, and `rooms` stores capacity, pricing, and inventory. `reservations` connects a user, hotel, and room to travel dates and payment state. `reward_transactions` is an append-only points ledger. `payment_records` records charges, refunds, and cancellation charges without card data.

```mermaid
erDiagram
  profiles ||--o{ reservations : makes
  hotels ||--o{ hotel_images : has
  hotels ||--o{ rooms : offers
  hotels ||--o{ reservations : receives
  rooms ||--o{ reservations : booked
  profiles ||--o{ reward_transactions : owns
  reservations ||--o{ reward_transactions : explains
  reservations ||--o{ payment_records : records
```