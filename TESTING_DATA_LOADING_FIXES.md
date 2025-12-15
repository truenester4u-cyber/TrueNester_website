# Data Loading Fixes - Quick Testing Guide

## 🚀 Quick Start
Dev server is running on **http://localhost:8082**

## ✅ What's Fixed

| Issue | Fix | Test Link |
|-------|-----|-----------|
| Properties not loading on refresh | Added retry logic + React Query caching | [/buy](http://localhost:8082/buy) |
| Rental properties disappearing | Exponential backoff retry mechanism | [/rent](http://localhost:8082/rent) |
| Locations page empty | Converted to React Query | [/locations](http://localhost:8082/locations) |
| Reviews not showing | React Query + proper loading states | [/ (scroll down)](http://localhost:8082/) |
| Stale data after tab switch | Page focus detection hook | Any page after switching tabs |

## 🧪 Testing Steps

### Test 1: Properties Load After Refresh
1. Go to http://localhost:8082/buy
2. Wait for properties to load (should see grid of 12+ properties)
3. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
4. **✅ PASS**: Properties load after 1-2 seconds
5. **❌ FAIL**: Properties don't appear or see loading indefinitely

### Test 2: Rental Properties with Filters
1. Go to http://localhost:8082/rent
2. Wait for rentals to load
3. Try using location dropdown filter
4. Refresh the page
5. **✅ PASS**: Rentals load and filters still work
6. **❌ FAIL**: Rentals don't appear or filters broken

### Test 3: Locations Page Loading
1. Go to http://localhost:8082/locations
2. **✅ PASS**: See loading spinner, then locations by city
3. **❌ FAIL**: No spinner, blank page, or "Loading locations..." forever

### Test 4: Reviews Section
1. Go to http://localhost:8082/
2. Scroll down to "Trusted by Homeowners" section
3. Wait for carousel to load
4. **✅ PASS**: See 4-5 review cards in carousel
5. **❌ FAIL**: Section stays blank or shows error

### Test 5: Tab Switch Refetch
1. Load properties on /buy page (http://localhost:8082/buy)
2. Open DevTools Console (F12)
3. Switch to another browser tab
4. Wait 10 seconds
5. Switch back to this tab
6. Check console for "👁️ Page focused" message
7. **✅ PASS**: See refetch message, properties might flash/update
8. **❌ FAIL**: No refetch message in console

### Test 6: Offline Simulation
1. Go to http://localhost:8082/buy
2. Properties should load
3. Open DevTools > Network tab
4. Find the "Offline" checkbox and check it
5. Refresh page
6. Properties won't load (expected - offline)
7. Uncheck "Offline" to go back online
8. Properties should auto-refetch
9. **✅ PASS**: Properties reappear after going online
10. **❌ FAIL**: Properties don't return after reconnecting

## 📊 Console Logging

Open DevTools Console (F12) to see detailed logging:

```
✅ fetchBuyProperties success: { count: 48 }
✅ fetchBuyProperties success (filtered): { count: 12 }
⏳ Retry attempt 1/3 after 100ms...
👁️ Page focused - invalidating stale queries
👁️ Page became visible - refetching data
```

**How to filter**: In Console input, type:
```javascript
monitorEvents(window, 'focus', 'visibilitychange')
```

## 🔍 Expected Behavior

### Normal Load
1. Component mounts
2. React Query caches `queryKey` (e.g., `["properties"]`)
3. If not in cache or stale → fetches data
4. Shows loading spinner
5. Data appears

### Retry on Network Error
1. Query fails (network error)
2. ⏳ Waits 100ms
3. Retries query
4. Logs: `⏳ Retry attempt 1/3 after 100ms...`
5. Repeats up to 3 times with exponential backoff (100ms, 200ms, 400ms)
6. If all fail → Shows error message

### Tab Switch
1. You're on `/buy` page
2. Data loaded and cached
3. Switch to another tab
4. Switch back after 2+ minutes (data is now stale)
5. Layout's `usePageFocus` hook detects visibility change
6. Triggers `queryClient.refetchQueries({ stale: true })`
7. Data refreshes in background

## 📱 Mobile Testing

Same tests work on mobile. Use browser DevTools device emulation:
1. Press F12 to open DevTools
2. Click device icon (or Ctrl+Shift+M)
3. Select mobile device
4. Run tests above

## 🐛 Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Properties still don't load | Cache issue | Clear localStorage: DevTools > Application > Clear All, then refresh |
| Retry messages disappear from console | Console limit reached | Clear console or reload page |
| Locations page still blank | DOM not updated | Hard refresh (Ctrl+F5) |
| Reviews show "No reviews yet" | API returns empty array | Check Supabase reviews table has approved reviews |
| "No properties found" on /buy | No buy/sale properties in DB | Check Supabase properties table, ensure some have `purpose` = 'buy' or 'sale' |

## ✨ Advanced Debugging

### See all queries being cached:
```javascript
// In Console
import { useQueryClient } from '@tanstack/react-query'
queryClient.getQueryData(['properties'])
```

### Force refetch:
```javascript
// In Console (after loading the page)
queryClient.refetchQueries({ queryKey: ['properties'] })
```

### Check if data is stale:
```javascript
queryClient.getQueryState(['properties'])
// Returns: { status: 'success', dataUpdatedAt: 123456789, ... }
```

## ✅ Sign-Off Checklist

- [ ] Properties load on /buy page refresh
- [ ] Rentals load on /rent page refresh  
- [ ] Locations show with proper spinner on /locations
- [ ] Reviews appear in carousel on homepage
- [ ] Console shows retry messages on failures
- [ ] Data refetches when returning to tab after 2+ minutes
- [ ] Error messages display clearly if loading fails
- [ ] Mobile version works correctly
- [ ] No TypeScript errors in console
- [ ] No ESLint errors: `npm run lint`

## 📝 Notes

- First load might take 2-3 seconds due to Supabase cold start
- Retry delays use exponential backoff: 100ms → 200ms → 400ms
- Data stale after 2 minutes, cache cleared after 5 minutes
- All queries automatically retry on network reconnect
- Page visibility changes trigger refetch of stale data
- Reviews subscribe to real-time changes (still active)

**Deployed by**: AI Coding Agent
**Date**: December 13, 2025
**Version**: 1.0
