import { formatDate, formatDateWithDay, getDuration } from '../../utils/dateUtils';

describe('Date Utility Functions', () => {
  describe('formatDate', () => {
    test('formats date string correctly', () => {
      expect(formatDate('2023-01-15')).toMatch(/Jan 2023/);
    });

    test('handles null date', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('formatDateWithDay', () => {
    test('formats date with day correctly', () => {
      expect(formatDateWithDay('2023-01-15')).toMatch(/Jan 15, 2023/);
    });
  });

  describe('getDuration', () => {
    test('calculates duration correctly for past dates', () => {
      const start = '2020-01-15';
      const end = '2022-07-15'; // 2 years 6 months

      const result = getDuration(start, end);
      expect(result).toBe('2 yrs 6 mos');
    });

    test('calculates duration correctly with only years', () => {
      const start = '2020-01-15';
      const end = '2022-01-15'; // Exactly 2 years

      const result = getDuration(start, end);
      expect(result).toBe('2 yrs');
    });

    test('calculates duration correctly with only months', () => {
      const start = '2022-01-15';
      const end = '2022-07-15'; // 6 months

      const result = getDuration(start, end);
      expect(result).toBe('6 mos');
    });

    test('handles current date when end date is not provided', () => {
      // This test is time-dependent, so we need to mock the current date
      const RealDate = Date;
      
      // Mock the current date to be fixed at "2023-01-15"
      global.Date = class extends RealDate {
        constructor() {
          super();
          if (arguments.length === 0) {
            return new RealDate('2023-01-15T00:00:00Z');
          }
          // @ts-ignore
          return new RealDate(...arguments);
        }
      };

      const start = '2022-01-15'; // 1 year before our fixed current date
      const result = getDuration(start, null);
      
      // Restore the real Date constructor
      global.Date = RealDate;
      
      expect(result).toBe('1 yr');
    });
  });
});