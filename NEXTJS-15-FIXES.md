# Next.js 15 Breaking Changes - Chat History Fixes

## Issue: Dynamic Route Params

### Error Message
```
Type error: Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
```

### Root Cause
In **Next.js 15**, dynamic route segment params are now **Promise-based** instead of direct objects.

### Migration Required

#### ❌ Before (Next.js 14)
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversationId = parseInt(params.id);
  // ...
}
```

#### ✅ After (Next.js 15)
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Must await!
  const conversationId = parseInt(id);
  // ...
}
```

## Files Fixed

### 1. `/api/chat/conversations/[id]/route.ts`
- ✅ GET handler - params awaited
- ✅ PUT handler - params awaited
- ✅ DELETE handler - params awaited

### 2. `/api/chat/conversations/[id]/messages/route.ts`
- ✅ GET handler - params awaited
- ✅ POST handler - params awaited

## Pattern for All Dynamic Routes

```typescript
// Template for any [id] route in Next.js 15

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Step 1: Await params
  const { id } = await params;
  
  // Step 2: Use id normally
  const numericId = parseInt(id);
  
  // Step 3: Continue with logic
  // ...
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

## Multiple Params

If route is like `/api/posts/[categoryId]/[postId]/route.ts`:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string; postId: string }> }
) {
  const { categoryId, postId } = await params;
  // Use both IDs
}
```

## Why This Change?

Next.js 15 made params async to support:
- Better streaming capabilities
- Improved server components performance
- Preparation for React Server Components optimizations

## Build Verification

After fixing, verify with:
```bash
npm run build
```

Should see:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

## Additional Next.js 15 Changes

### 1. Cookies API
```typescript
// Old (Next.js 14)
const token = request.cookies.get('token')?.value;

// New (Next.js 15) - Still works but async in some contexts
const cookieStore = await cookies();
const token = cookieStore.get('token')?.value;
```

### 2. Headers API
```typescript
// Old
const header = request.headers.get('authorization');

// New - Same but be aware of async contexts
const headersList = await headers();
const header = headersList.get('authorization');
```

### 3. SearchParams in Pages
```typescript
// app/page.tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const query = params.query;
  // ...
}
```

## Checklist for Migration

When migrating to Next.js 15:

- [ ] Update all `params` types to `Promise<{ ... }>`
- [ ] Add `await params` before accessing properties
- [ ] Check all dynamic routes: `[id]`, `[slug]`, etc.
- [ ] Test all API routes with `npm run build`
- [ ] Update page components with searchParams
- [ ] Consider async cookies/headers if needed
- [ ] Run full test suite
- [ ] Deploy to staging first

## References

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Upgrading Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Breaking Changes](https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis)

---

**Status:** ✅ All chat history routes fixed for Next.js 15  
**Date:** 2025-01-13  
**Version:** Next.js 15.3.3
