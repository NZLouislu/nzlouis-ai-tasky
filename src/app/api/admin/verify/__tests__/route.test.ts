/**
 * Integration tests for Admin Verify API
 * Tests token expiration validation
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('Admin Verify API', () => {
  describe('Token Validation', () => {
    it('should return 401 if no token provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('No authentication token provided');
    });

    it('should return 401 for username mismatch', async () => {
      const token = Buffer.from('wrong_user:1234567890').toString('base64');
      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('Token Expiration', () => {
    it('should accept valid non-expired token', async () => {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      const token = Buffer.from(`test_admin:${expiresAt}`).toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.expiresAt).toBeDefined();
      expect(data.hoursRemaining).toBeDefined();
      expect(data.hoursRemaining).toBeGreaterThanOrEqual(23);
    });

    it('should reject expired token', async () => {
      const expiresAt = Date.now() - 1000; // Expired 1 second ago
      const token = Buffer.from(`test_admin:${expiresAt}`).toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Session expired, please login again');
      expect(data.expiredAt).toBeDefined();
    });

    it('should accept token expiring soon but still valid', async () => {
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now
      const token = Buffer.from(`test_admin:${expiresAt}`).toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.hoursRemaining).toBeGreaterThanOrEqual(0);
      expect(data.hoursRemaining).toBeLessThanOrEqual(1);
    });

    it('should handle old token format without expiration (backward compatibility)', async () => {
      const token = Buffer.from('test_admin').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.warning).toBeDefined();
      expect(data.warning).toContain('does not have expiration');
    });

    it('should reject token with invalid expiration timestamp', async () => {
      const token = Buffer.from('test_admin:invalid_timestamp').toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Invalid token format');
    });
  });

  describe('Response Format', () => {
    it('should return correct response format for valid token', async () => {
      const expiresAt = Date.now() + 10 * 60 * 60 * 1000; // 10 hours
      const token = Buffer.from(`test_admin:${expiresAt}`).toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('authenticated');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('hoursRemaining');
      expect(data.authenticated).toBe(true);
      expect(typeof data.expiresAt).toBe('string');
      expect(typeof data.hoursRemaining).toBe('number');
    });

    it('should return correct error format for expired token', async () => {
      const expiresAt = Date.now() - 1000;
      const token = Buffer.from(`test_admin:${expiresAt}`).toString('base64');

      const request = new NextRequest('http://localhost:3000/api/admin/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('authenticated');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('expiredAt');
      expect(data.authenticated).toBe(false);
      expect(typeof data.error).toBe('string');
      expect(typeof data.expiredAt).toBe('string');
    });
  });
});
