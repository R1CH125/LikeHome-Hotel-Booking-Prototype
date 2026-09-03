# LikeHome architecture

The workspace uses a React + Vite client and a shared Express API server routed under `/api`. The API currently includes an in-memory demonstration store so Preview is usable without external credentials; the Supabase migration and environment contract are included for the production-ready semester-project integration. Payment UI is intentionally labeled Demo Payment Mode until Stripe Test Mode credentials are configured.

```mermaid
flowchart LR
  Browser[LikeHome React client] -->|typed REST calls| API[Express API server]
  API --> Rules[Booking, pricing, reward rules]
  API --> Demo[(Demo in-memory store)]
  API -. configured deployment .-> Supabase[(Supabase Auth + PostgreSQL)]
  API -. test mode .-> Stripe[Stripe Test Mode]
```

```mermaid
flowchart TD
  Search[Search dates and guests] --> Details[Hotel and available rooms]
  Details --> Checkout[Server recalculates price]
  Checkout --> Conflict{Room or user conflict?}
  Conflict -- yes --> Error[Explain conflict]
  Conflict -- no --> Payment[Demo or Stripe payment]
  Payment --> Confirm[Confirmed reservation]
  Confirm --> Manage[Change or cancel]
```