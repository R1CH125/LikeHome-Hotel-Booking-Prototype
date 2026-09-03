---
name: OpenAPI code generation
description: Codegen behavior and the intentional Zod barrel export constraint.
---

After regenerating the OpenAPI clients, the Zod generator rewrites its barrel file and exports both generated API validators and generated types, which currently collide on `GetHotelParams`. Keep the barrel limited to generated API validators after codegen.

**Why:** The workspace's generated Zod output uses overlapping names across its two generated modules, so a full barrel export breaks the library typecheck.

**How to apply:** Run codegen first, then restore the intentional narrow export in `lib/api-zod/src/index.ts` before running the workspace typecheck.