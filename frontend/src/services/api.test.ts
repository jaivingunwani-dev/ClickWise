/**
 * Tests for Click Wise API Client
 */

import { scanDocument, formatError } from './api';

describe('API Client', () => {
  const mockFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = mockFetch;
  });

  describe('scanDocument', () => {
    it('should send valid request to backend', async () => {
      const mockResponse = {
        content_hash: 'abc123',
        domain: 'example.com',
        doc_type: 'tos',
        summary: {
          executive_summary: 'Test summary',
          key_risks: ['Risk 1', 'Risk 2'],
          is_legal_advice: false,
        },
        risk_score: {
          score: 45,
          level: 'medium',
          flags: [],
        },
        ai_training_clause: false,
        dark_patterns_detected: [],
        created_at: '2026-07-29T00:00:00',
        cached: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await scanDocument(
        'This is a long document ' * 20,
        'tos',
        'example.com'
      );

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/scan',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should reject documents shorter than 100 characters', async () => {
      await expect(scanDocument('Too short', 'tos', 'example.com')).rejects.toMatchObject({
        status: 400,
        message: 'Document too short',
      });
    });

    it('should reject invalid doc types', async () => {
      await expect(
        scanDocument('A'.repeat(100), 'invalid_type', 'example.com')
      ).rejects.toMatchObject({
        status: 400,
        message: 'Invalid document type',
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(
        scanDocument('A'.repeat(100), 'tos', 'example.com')
      ).rejects.toMatchObject({
        status: 0,
        message: 'Network error',
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Backend error' }),
      });

      await expect(
        scanDocument('A'.repeat(100), 'tos', 'example.com')
      ).rejects.toMatchObject({
        status: 500,
        message: 'API Error (500)',
      });
    });
  });

  describe('formatError', () => {
    it('should format network errors', () => {
      const error = {
        status: 0,
        message: 'Network error',
      };
      expect(formatError(error)).toContain('Could not connect');
    });

    it('should format validation errors', () => {
      const error = {
        status: 400,
        message: 'Validation failed',
        detail: 'Document must be 100+ characters',
      };
      expect(formatError(error)).toBe('Document must be 100+ characters');
    });

    it('should format server errors', () => {
      const error = {
        status: 500,
        message: 'Server error',
      };
      expect(formatError(error)).toContain('Server error');
    });
  });
});
