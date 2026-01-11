const { z } = require('zod');

// Planet data schema
const planetSchema = z.object({
  lon: z.number().min(0).max(360),
  lat: z.number().min(-90).max(90).optional().default(0),
  retrograde: z.boolean().optional().default(false),
});

// House cusp schema
const houseSchema = z.object({
  lon: z.number().min(0).max(360),
});

// Aspect type settings
const aspectTypeSchema = z.object({
  enabled: z.boolean().optional().default(true),
  orb: z.number().min(0).max(10).optional(),
  angle: z.number().optional(),
  color: z.string().optional(),
  lineStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
  strokeWidth: z.number().optional(),
});

// Aspect settings schema
const aspectSettingsSchema = z.object({
  enabled: z.boolean().optional().default(true),
  orb: z.number().min(0).max(10).optional().default(6),
  types: z
    .object({
      conjunction: aspectTypeSchema.optional(),
      opposition: aspectTypeSchema.optional(),
      trine: aspectTypeSchema.optional(),
      square: aspectTypeSchema.optional(),
      sextile: aspectTypeSchema.optional(),
    })
    .optional(),
});

// Render options schema
const renderOptionsSchema = z.object({
  format: z.enum(['png', 'svg', 'jpeg']).optional().default('png'),
  width: z.number().min(400).max(2000).optional().default(800),
  height: z.number().min(400).max(2000).optional().default(800),
  quality: z.number().min(1).max(100).optional().default(90),
  theme: z.enum(['light', 'dark']).optional().default('light'),
  showHouses: z.boolean().optional().default(true),
  showLabels: z
    .object({
      natal: z.boolean().optional(),
      transit: z.boolean().optional(),
      datetime: z.boolean().optional(),
      person1Name: z.boolean().optional(),
      person2Name: z.boolean().optional(),
      legend: z.boolean().optional(),
    })
    .optional(),
});

// Planets object with all supported planets
// Classical planets (required for backward compatibility)
const planetsSchema = z.object({
  sun: planetSchema,
  moon: planetSchema,
  mercury: planetSchema,
  venus: planetSchema,
  mars: planetSchema,
  jupiter: planetSchema,
  saturn: planetSchema,
  uranus: planetSchema,
  neptune: planetSchema,
  pluto: planetSchema,
  // Additional planets (optional, supported since nocturna-wheel 4.1.0)
  rahu: planetSchema.optional(),
  ketu: planetSchema.optional(),
  selena: planetSchema.optional(),
  lilith: planetSchema.optional(),
});

// Houses array (12 houses)
const housesSchema = z.array(houseSchema).length(12);

// Natal chart request schema
const natalChartSchema = z.object({
  planets: planetsSchema,
  houses: housesSchema,
  aspectSettings: aspectSettingsSchema.optional(),
  renderOptions: renderOptionsSchema.optional().default({}),
});

// Transit chart request schema
const transitChartSchema = z.object({
  natal: z.object({
    planets: planetsSchema,
    houses: housesSchema,
  }),
  transit: z.object({
    planets: planetsSchema,
    datetime: z.string().optional(),
  }),
  aspectSettings: z
    .object({
      natal: aspectSettingsSchema.optional(),
      transit: aspectSettingsSchema.optional(),
      natalToTransit: aspectSettingsSchema.optional(),
    })
    .optional(),
  renderOptions: renderOptionsSchema.optional().default({}),
});

// Synastry chart request schema
const synastryChartSchema = z.object({
  person1: z.object({
    name: z.string().optional(),
    planets: planetsSchema,
    houses: housesSchema,
  }),
  person2: z.object({
    name: z.string().optional(),
    planets: planetsSchema,
    houses: housesSchema,
  }),
  synastrySettings: z
    .object({
      useHousesFrom: z.enum(['person1', 'person2', 'both']).optional().default('person1'),
      aspectSettings: z
        .object({
          person1: aspectSettingsSchema.optional(),
          person2: aspectSettingsSchema.optional(),
          interaspects: aspectSettingsSchema.optional(),
        })
        .optional(),
    })
    .optional()
    .default({}),
  renderOptions: renderOptionsSchema.optional().default({}),
});

// Biwheel chart request schema (generic dual chart)
const biwheelChartSchema = z.object({
  inner: z.object({
    name: z.string().optional(),
    planets: planetsSchema,
    houses: housesSchema,
  }),
  outer: z.object({
    name: z.string().optional(),
    planets: planetsSchema,
    houses: housesSchema.optional(), // Outer houses are optional - can use inner houses
  }),
  biwheelSettings: z
    .object({
      useHousesFrom: z.enum(['inner', 'outer']).optional().default('inner'),
      aspectSettings: z
        .object({
          inner: aspectSettingsSchema.optional(),
          outer: aspectSettingsSchema.optional(),
          crossAspects: aspectSettingsSchema.optional(),
        })
        .optional(),
    })
    .optional()
    .default({}),
  renderOptions: renderOptionsSchema.optional().default({}),
});

module.exports = {
  natalChartSchema,
  transitChartSchema,
  synastryChartSchema,
  biwheelChartSchema,
};

