import { test, expect } from '@playwright/test';

test.describe('Chatbot Image Upload', () => {
  test('should NOT auto-submit when pasting or uploading image', async ({ page }) => {
    await page.goto('http://localhost:3000/chatbot');
    
    await page.waitForTimeout(2000);
    
    const initialMessageCount = await page.locator('[data-testid="chat-message"]').count();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test image data'),
    });
    
    await page.waitForTimeout(1000);
    
    const hasThinkingMessage = await page.locator('text=AI is thinking').isVisible().catch(() => false);
    expect(hasThinkingMessage).toBe(false);
    
    const newMessageCount = await page.locator('[data-testid="chat-message"]').count();
    expect(newMessageCount).toBe(initialMessageCount);
    
    const previewExists = await page.locator('text=Image attached').isVisible();
    expect(previewExists).toBe(true);
    
    await page.locator('textarea').fill('What is in this image?');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForSelector('text=AI is thinking', { timeout: 5000 });
    
    const thinkingVisible = await page.locator('text=AI is thinking').isVisible();
    expect(thinkingVisible).toBe(true);
  });
});
