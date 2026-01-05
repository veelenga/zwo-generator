import { describe, it, expect } from 'vitest';
import { parseZwoContent, validateZwoFile } from './zwoImport';

const createZwoXml = (segments: string, options: { name?: string; description?: string; author?: string; sportType?: string; tags?: string[] } = {}) => {
  const { name = 'Test Workout', description = 'Test description', author = 'Test Author', sportType = 'bike', tags = [] } = options;
  const tagsXml = tags.length > 0 ? `<tags>${tags.map(t => `<tag name="${t}"/>`).join('')}</tags>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>${author}</author>
  <name>${name}</name>
  <description>${description}</description>
  <sportType>${sportType}</sportType>
  ${tagsXml}
  <workout>
    ${segments}
  </workout>
</workout_file>`;
};

describe('parseZwoContent', () => {
  describe('metadata parsing', () => {
    it('parses workout name', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { name: 'My Custom Workout' });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.name).toBe('My Custom Workout');
      }
    });

    it('parses workout description', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { description: 'A great workout' });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.description).toBe('A great workout');
      }
    });

    it('parses author', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { author: 'Coach Smith' });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.author).toBe('Coach Smith');
      }
    });

    it('parses bike sportType', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { sportType: 'bike' });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.sportType).toBe('bike');
      }
    });

    it('parses run sportType', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { sportType: 'run' });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.sportType).toBe('run');
      }
    });

    it('defaults unknown sportType to bike', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { sportType: 'swim' });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.sportType).toBe('bike');
      }
    });

    it('parses tags', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>', { tags: ['INTERVALS', 'HARD'] });
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.tags).toEqual(['INTERVALS', 'HARD']);
      }
    });
  });

  describe('warmup segment', () => {
    it('parses warmup with power range', () => {
      const xml = createZwoXml('<Warmup Duration="600" PowerLow="0.40" PowerHigh="0.70"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('warmup');
        if (segment.type === 'warmup') {
          expect(segment.duration).toBe(600);
          expect(segment.powerLow).toBe(0.4);
          expect(segment.powerHigh).toBe(0.7);
        }
      }
    });

    it('parses warmup with cadence', () => {
      const xml = createZwoXml('<Warmup Duration="600" PowerLow="0.40" PowerHigh="0.70" Cadence="85"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.segments[0].cadence).toBe(85);
      }
    });
  });

  describe('cooldown segment', () => {
    it('parses cooldown and swaps power values correctly', () => {
      const xml = createZwoXml('<Cooldown Duration="300" PowerLow="0.60" PowerHigh="0.40"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('cooldown');
        if (segment.type === 'cooldown') {
          expect(segment.duration).toBe(300);
          expect(segment.powerLow).toBe(0.4);
          expect(segment.powerHigh).toBe(0.6);
        }
      }
    });
  });

  describe('steadystate segment', () => {
    it('parses steadystate with power', () => {
      const xml = createZwoXml('<SteadyState Duration="300" Power="0.75"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('steadystate');
        if (segment.type === 'steadystate') {
          expect(segment.duration).toBe(300);
          expect(segment.power).toBe(0.75);
        }
      }
    });
  });

  describe('intervals segment', () => {
    it('parses intervals with all attributes', () => {
      const xml = createZwoXml('<IntervalsT Repeat="4" OnDuration="60" OffDuration="60" OnPower="1.00" OffPower="0.50"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('intervals');
        if (segment.type === 'intervals') {
          expect(segment.repeat).toBe(4);
          expect(segment.onDuration).toBe(60);
          expect(segment.offDuration).toBe(60);
          expect(segment.onPower).toBe(1.0);
          expect(segment.offPower).toBe(0.5);
        }
      }
    });
  });

  describe('ramp segment', () => {
    it('parses ramp with power range', () => {
      const xml = createZwoXml('<Ramp Duration="300" PowerLow="0.50" PowerHigh="1.00"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('ramp');
        if (segment.type === 'ramp') {
          expect(segment.duration).toBe(300);
          expect(segment.powerLow).toBe(0.5);
          expect(segment.powerHigh).toBe(1.0);
        }
      }
    });
  });

  describe('freeride segment', () => {
    it('parses freeride without flatroad', () => {
      const xml = createZwoXml('<FreeRide Duration="600"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('freeride');
        if (segment.type === 'freeride') {
          expect(segment.duration).toBe(600);
          expect(segment.flatRoad).toBe(false);
        }
      }
    });

    it('parses freeride with flatroad enabled', () => {
      const xml = createZwoXml('<FreeRide Duration="600" FlatRoad="1"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        if (segment.type === 'freeride') {
          expect(segment.flatRoad).toBe(true);
        }
      }
    });
  });

  describe('maxeffort segment', () => {
    it('parses maxeffort', () => {
      const xml = createZwoXml('<MaxEffort Duration="30"/>');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const segment = result.workout.segments[0];
        expect(segment.type).toBe('maxeffort');
        if (segment.type === 'maxeffort') {
          expect(segment.duration).toBe(30);
        }
      }
    });
  });

  describe('multiple segments', () => {
    it('parses workout with multiple segments in order', () => {
      const xml = createZwoXml(`
        <Warmup Duration="600" PowerLow="0.40" PowerHigh="0.70"/>
        <SteadyState Duration="300" Power="0.75"/>
        <IntervalsT Repeat="4" OnDuration="60" OffDuration="60" OnPower="1.00" OffPower="0.50"/>
        <Cooldown Duration="300" PowerLow="0.60" PowerHigh="0.40"/>
      `);
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.workout.segments.length).toBe(4);
        expect(result.workout.segments[0].type).toBe('warmup');
        expect(result.workout.segments[1].type).toBe('steadystate');
        expect(result.workout.segments[2].type).toBe('intervals');
        expect(result.workout.segments[3].type).toBe('cooldown');
      }
    });
  });

  describe('error handling', () => {
    it('returns error for invalid XML', () => {
      const result = parseZwoContent('not xml at all');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid XML');
      }
    });

    it('returns error for missing workout_file element', () => {
      const result = parseZwoContent('<?xml version="1.0"?><root></root>');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing workout_file');
      }
    });

    it('returns error for missing workout element', () => {
      const result = parseZwoContent(`<?xml version="1.0"?>
        <workout_file>
          <name>Test</name>
        </workout_file>`);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing workout element');
      }
    });

    it('returns error for empty workout', () => {
      const xml = createZwoXml('');
      const result = parseZwoContent(xml);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No valid workout segments');
      }
    });
  });

  describe('segment IDs', () => {
    it('assigns unique IDs to each segment', () => {
      const xml = createZwoXml(`
        <SteadyState Duration="300" Power="0.75"/>
        <SteadyState Duration="300" Power="0.75"/>
      `);
      const result = parseZwoContent(xml);

      expect(result.success).toBe(true);
      if (result.success) {
        const ids = result.workout.segments.map(s => s.id);
        expect(ids[0]).not.toBe(ids[1]);
        expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/);
      }
    });
  });
});

describe('validateZwoFile', () => {
  it('returns null for valid .zwo file', () => {
    const file = new File(['content'], 'workout.zwo', { type: 'application/xml' });
    expect(validateZwoFile(file)).toBeNull();
  });

  it('returns error for non-.zwo extension', () => {
    const file = new File(['content'], 'workout.xml', { type: 'application/xml' });
    expect(validateZwoFile(file)).toContain('.zwo');
  });

  it('returns error for file exceeding size limit', () => {
    const largeContent = 'x'.repeat(1024 * 1024 + 1);
    const file = new File([largeContent], 'workout.zwo', { type: 'application/xml' });
    expect(validateZwoFile(file)).toContain('too large');
  });

  it('accepts uppercase extension', () => {
    const file = new File(['content'], 'workout.ZWO', { type: 'application/xml' });
    expect(validateZwoFile(file)).toBeNull();
  });
});
