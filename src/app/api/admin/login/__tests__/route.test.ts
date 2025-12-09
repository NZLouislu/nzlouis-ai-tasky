/**
 * Integration tests for Admin Login API
 * Tests password verification, rate limiting, and token expiration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { clearAllRateLimits } from '@/lib/rate-limit';
import { POST } from '../route';

describe('Admin Login API', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('Input Validation', () => {
    it('should return 400 if username is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'test123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username and password are required');
    });
  });

  describe('Authentication', () => {
    it('should reject invalid username', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'wrong_user', password: 'test_password' }),
        headers: { 'x-forwarded-for': '192.168.1.10' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
      expect(data.remainingAttempts).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'wrong_password' }),
        headers: { 'x-forwarded-for': '192.168.1.11' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should accept valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'test_password' }),
        headers: { 'x-forwarded-for': '192.168.1.12' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.expiresAt).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should track failed attempts', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'wrong' }),
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.remainingAttempts).toBe(4);
    });

    it('should reset rate limit on successful login', async () => {
      // Failed attempt first
      const failRequest = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'wrong' }),
        headers: { 'x-forwarded-for': '192.168.1.200' },
      });
      await POST(failRequest);

      // Successful login
      const successRequest = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'test_password' }),
        headers: { 'x-forwarded-for': '192.168.1.200' },
      });
      const successResponse = await POST(successRequest);
      expect(successResponse.status).toBe(200);

      // Next failed attempt should have full attempts
      const nextRequest = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'wrong' }),
        headers: { 'x-forwarded-for': '192.168.1.200' },
      });
      const nextResponse = await POST(nextRequest);
      const nextData = await nextResponse.json();

      expect(nextData.remainingAttempts).toBe(4);
    });
  });

  describe('Token Generation', () => {
    it('should generate token with expiration time', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin', password: 'test_password' }),
        headers: { 'x-forwarded-for': '192.168.1.50' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expiresAt).toBeDefined();

      // Verify expiration is approximately 24 hours from now
      const expiresAt = new Date(data.expiresAt).getTime();
      const now = Date.now();
      const diff = expiresAt - now;
      const hours = diff / (60 * 60 * 1000);

      expect(hours).toBeGreaterThan(23.9);
      expect(hours).toBeLessThan(24.1);
    });
  });
});
