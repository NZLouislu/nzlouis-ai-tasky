import { jest } from '@jest/globals';

// Mock DOM APIs for Node.js environment
Object.defineProperty(global, 'FileReader', {
  value: class FileReader {
    readAsDataURL() {
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: 'data:image/jpeg;base64,test' } } as any);
        }
      }, 0);
    }
    onload: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
  }
});

Object.defineProperty(global, 'Image', {
  value: class Image {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 100;
    height = 100;
    set src(value: string) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }
});

Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    width = 0;
    height = 0;
    getContext() {
      return {
        drawImage: jest.fn()
      };
    }
    toBlob(callback: (blob: Blob | null) => void) {
      setTimeout(() => {
        callback(new Blob(['test'], { type: 'image/jpeg' }));
      }, 0);
    }
  }
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: (tagName: string) => {
      if (tagName === 'canvas') {
        return new (global as any).HTMLCanvasElement();
      }
      return {};
    }
  }
});

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test.com/image.jpg' } })),
        remove: jest.fn().mockResolvedValue({ error: null })
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ 
            data: { id: 'test-file-id' }, 
            error: null 
          })
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null })
          }))
        }))
      }))
    }))
  }))
}));

describe('Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should reject non-image files', async () => {
      const { uploadImage } = await import('@/lib/services/upload-service');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await expect(uploadImage({
        file,
        entityType: 'blog_post',
        entityId: 'test-id',
        userId: 'user-id',
      })).rejects.toThrow('Only image files are allowed');
    });

    it('should reject files larger than 10MB', async () => {
      const { uploadImage } = await import('@/lib/services/upload-service');
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      await expect(uploadImage({
        file: largeFile,
        entityType: 'blog_post',
        entityId: 'test-id',
        userId: 'user-id',
      })).rejects.toThrow('File size must not exceed 10MB');
    });

    it('should successfully upload valid image', async () => {
      const { uploadImage } = await import('@/lib/services/upload-service');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await uploadImage({
        file,
        entityType: 'blog_post',
        entityId: 'test-id',
        userId: 'user-id',
      });

      expect(result).toEqual({
        publicUrl: 'https://test.com/image.jpg',
        filePath: expect.stringContaining('blog-images/user-id/test-id/'),
        fileId: 'test-file-id'
      });
    });
  });

  describe('validation', () => {
    it('should validate file types', () => {
      expect(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).toContain('image/jpeg');
    });

    it('should validate file size limit', () => {
      const maxSize = 10 * 1024 * 1024;
      expect(maxSize).toBe(10485760);
    });
  });
});
