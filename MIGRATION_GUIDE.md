# Migration Guide: API v1 to v2

## Overview

API v2 fixes the wheel order issue where natal/person1/inner data was incorrectly displayed on the outer circle and transit/person2/outer data on the inner circle.

## Changes

### Transit Charts (`/api/v1/chart/render/transit` → `/api/v2/chart/render/transit`)

**v1 (Legacy):**
- Natal chart: **Outer circle**
- Transit chart: **Inner circle**

**v2 (Correct):**
- Natal chart: **Inner circle** ✅
- Transit chart: **Outer circle** ✅

### Synastry Charts (`/api/v1/chart/render/synastry` → `/api/v2/chart/render/synastry`)

**v1 (Legacy):**
- Person1 chart: **Outer circle**
- Person2 chart: **Inner circle**

**v2 (Correct):**
- Person1 chart: **Inner circle** ✅
- Person2 chart: **Outer circle** ✅

### Biwheel Charts (`/api/v1/chart/render/biwheel` → `/api/v2/chart/render/biwheel`)

**v1 (Legacy):**
- Inner chart: **Outer circle**
- Outer chart: **Inner circle**

**v2 (Correct):**
- Inner chart: **Inner circle** ✅
- Outer chart: **Outer circle** ✅

## How to Migrate

### Step 1: Update your API endpoint URLs

Replace `/api/v1/` with `/api/v2/` in all requests:

```bash
# Old (v1)
POST /api/v1/chart/render/transit

# New (v2)
POST /api/v2/chart/render/transit
```

### Step 2: Request format remains the same

No changes to request body structure. The same JSON payload works for both versions.

```json
{
  "natal": {
    "planets": { ... },
    "houses": [ ... ]
  },
  "transit": {
    "planets": { ... }
  },
  "aspectSettings": { ... },
  "renderOptions": { ... }
}
```

### Step 3: Response format

v2 responses include additional `wheelOrder` information in `chartInfo`:

```json
{
  "status": "success",
  "data": {
    "image": "base64...",
    "chartInfo": {
      "type": "transit",
      "wheelOrder": {
        "inner": "natal",
        "outer": "transit"
      }
    }
  },
  "meta": {
    "version": "2.0.0"
  }
}
```

## Backward Compatibility

### v1 API Status

- **Status:** Deprecated
- **Availability:** Maintained for backward compatibility
- **Behavior:** Continues to render charts with legacy wheel order (natal/person1 on outer)
- **Recommendation:** Migrate to v2 as soon as possible

### Timeline

- **v1:** Available indefinitely for backward compatibility
- **v2:** Current stable version (recommended)

## Testing Both Versions

You can test both versions side-by-side:

```bash
# Test v1 (legacy wheel order)
curl -X POST http://localhost:3011/api/v1/chart/render/transit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @request.json

# Test v2 (correct wheel order)
curl -X POST http://localhost:3011/api/v2/chart/render/transit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @request.json
```

## FAQ

**Q: Will my existing v1 integrations break?**
A: No, v1 endpoints continue to work with the same behavior for backward compatibility.

**Q: What happens to my v1 requests?**
A: They continue to work exactly as before with natal/person1 on outer circle.

**Q: Do I need to change my request format?**
A: No, the request format is identical for both v1 and v2.

**Q: How do I know which version I'm using?**
A: Check the `meta.version` field in the response or the API path (`/api/v1/` vs `/api/v2/`).

**Q: When will v1 be removed?**
A: v1 will remain available indefinitely for backward compatibility. There are no plans to remove it.

## Support

For questions or issues during migration, please check the logs which include debug information about wheel order:

```
Transit chart (API v1) - natal on outer, transit on inner
Transit chart (API v2) - natal on inner, transit on outer
```
