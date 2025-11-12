export async function handleImageUpload(file: File, postId: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'blog_post');
    formData.append('entityId', postId);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const data = await res.json();
    return data.publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
}
