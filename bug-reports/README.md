# Bug Reports

This directory contains bug reports for third-party services used in the nocturna-tg project.

## Active Bug Reports

### 1. Chart Orientation Bug

**File:** [`chart-orientation-bug.md`](./chart-orientation-bug.md)  
**Component:** Chart Service / nocturna-wheel library  
**Severity:** High  
**Status:** Reported 2025-12-21

**Summary:** Charts are rendered with incorrect orientation. MC (Midheaven) should be at the top (zenith), but charts use fixed zodiac orientation with ASC always on the right. The entire chart needs to be rotated based on MC position.

**Visual Evidence:**
- Mobile app screenshots (provided separately) - Correct orientation (reference)
- `test_chart_our_houses.png` - Current incorrect orientation
- `test_chart_doc_example.png` - Test with documentation example data

**Reproduction Scripts:**
- `../../scripts/debug_houses.py` - Debug house calculations
- `../../scripts/test_chart_service.py` - Generate test charts

---

### 2. House Labels Offset Bug

**File:** [`house-labels-offset-bug.md`](./house-labels-offset-bug.md)  
**Component:** nocturna-wheel library  
**Severity:** High  
**Status:** ✅ Fixed in nocturna-wheel 4.0.2

**Summary:** When using `astronomicalData` configuration to enable Placidus house rendering (unequal house sizes), house labels (Roman numerals I-XII) become offset and no longer align with their corresponding house sectors.

**Resolution:** Fixed in nocturna-wheel version 4.0.2. Updated library 2025-12-21.

---

## Directory Structure

```
bug-reports/
├── README.md                       # This file
├── chart-orientation-bug.md        # Bug: MC not at top
├── house-labels-offset-bug.md      # Bug: Labels offset with Placidus
├── test_chart_our_houses.png       # Chart Service output (incorrect)
└── test_chart_doc_example.png      # Test with documentation data
```

---

## How to Submit Bug Reports

When a bug is found in a third-party service (Chart Service, Nocturna API, etc.):

1. **Create detailed bug report** in this directory
2. **Include:**
   - Clear description of expected vs actual behavior
   - Visual evidence (screenshots, generated images)
   - Reproduction steps
   - Test data (API requests, parameters)
   - Environment details
3. **Add entry** to this README
4. **Share directory** with the service maintainers

---

## Bug Report Template

```markdown
# Bug Report: [Title]

**Component:** [Service/Library name]
**Severity:** [Low/Medium/High/Critical]
**Date:** [YYYY-MM-DD]
**Reporter:** [Your name/team]

## Summary
Brief description of the bug.

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Test Case
Specific parameters and data to reproduce.

## Visual Comparison
Screenshots/images showing the issue.

## Analysis
Technical analysis of the root cause.

## Reproduction Steps
1. Step one
2. Step two
3. ...

## Impact
How this affects the project.

## Suggested Solution
Possible fixes or workarounds.

## Environment
Versions, dependencies, etc.

## Contact
Your contact information.
```

---

## Notes

- Keep bug reports **detailed** and **actionable**
- Include **visual evidence** when possible
- Provide **reproduction scripts** if applicable
- Update status when bugs are resolved
- Archive old bug reports in `archived/` subdirectory

