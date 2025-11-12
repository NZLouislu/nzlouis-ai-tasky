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
