# Bug Report: Incorrect Synastry Aspect Line Rendering in v4.0.0

## 1. Summary
In biwheel charts (Natal + Transit or Synastry), cross-aspect lines (configured via `synastryAspectSettings`) are rendered incorrectly. They connect the outer circle planet directly to the inner circle planet, cutting across the zodiac and house rings. This creates visual clutter and violates the expected astrological chart layout.

## 2. Expected Behavior
According to standard biwheel chart rendering (and previous documentation):
1. The position of the planet on the **outer circle** should be projected onto the **inner circle**'s radius.
2. A marker (e.g., a hollow dot or "projection point") should be placed on the inner circle at this projected longitude.
3. The aspect line should be drawn from this **projection point** on the inner circle to the target planet on the **inner circle**.
4. **Crucial:** The entire aspect line should be contained within the inner circle area, never crossing the house or zodiac rings.

## 3. Actual Behavior
The library currently draws a straight line from the planet icon on the **outer circle** directly to the planet icon on the **inner circle**.
- **Result:** The line crosses the "gap" between circles, including the house and zodiac rings.
- **Visual Impact:** The chart looks cluttered, and lines obscure chart data (house cusps, signs).

## 4. Reproduction Configuration
Using `@eaprelsky/nocturna-wheel@4.0.0`.

```javascript
const chart = new NocturnaWheel.WheelChart({
  container: '#chart-container',
  // Inner circle (Transit)
  secondaryPlanets: {
    sun: { lon: 242.55 },
    moon: { lon: 289.72 }
    // ...
  },
  // Outer circle (Natal)
  planets: {
    sun: { lon: 262.37 },
    moon: { lon: 125.31 }
    // ...
  },
  config: {
    // Disable internal aspects for cleaner view
    primaryAspectSettings: { enabled: false },
    secondaryAspectSettings: { enabled: false },
    
    // Enable ONLY cross-aspects
    synastryAspectSettings: {
      enabled: true,
      orb: 3,
      types: {
        conjunction: { enabled: true },
        opposition: { enabled: true },
        trine: { enabled: true },
        square: { enabled: true },
        sextile: { enabled: true }
      }
    }
  }
});
```

## 5. Observed Output
- **Log Output:**
  ```
  ClientSideAspectRenderer: Calculated 26 cross-aspects (synastry).
  ClientSideAspectRenderer: Rendering 26 cross-aspects.
  Group group-synastryAspects: 52 children
  First child: line
  ```
- **Visuals:** Users report lines crossing from the outer ring inward, instead of starting from a projection point on the inner ring.

## 6. Suggested Fix
The `ClientSideAspectRenderer` (or `SynastryAspectRenderer`) needs to be updated to:
1. Calculate the `(x, y)` coordinates of the outer planet's longitude but at the **inner circle's radius**.
2. Use these projected coordinates as the start point for the SVG `<line>`.
3. Optionally render a small marker (circle) at these projected coordinates to indicate the aspect source.

---
*Report generated based on client logs and visual inspection of rendered output.*
