/**
 * Default welcome posts
 * Automatically created when new users first login
 */

export const defaultWelcomePosts = [
  {
    title: '👋 Welcome to Your Blog!',
    content: [
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Welcome to Your Personal Blog Space', styles: {} }],
        props: { level: 1 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Congratulations! You\'ve just created your personal blog. This is your space to write, organize ideas, and express yourself.',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: '✨ Getting Started', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Here are some things you can do:',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Click on any text to start editing',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Use the "New Page" button to create more posts',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Add icons and covers to make your posts stand out',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Organize posts with sub-pages using the + button',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: '💡 Tips', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Your changes are automatically saved',
            styles: { bold: true },
          },
          {
            type: 'text',
            text: ' - no need to worry about losing your work!',
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Feel free to delete this welcome post once you\'re comfortable with the interface.',
            styles: { italic: true },
          },
        ],
      },
    ],
    icon: '👋',
    cover: { type: 'color', value: 'bg-gradient-to-r from-blue-500 to-purple-500' },
  },
  {
    title: '📝 How to Write',
    content: [
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Writing Tips', styles: {} }],
        props: { level: 1 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This blog supports rich text formatting. Here are some features you can use:',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Text Formatting', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Bold text',
            styles: { bold: true },
          },
          {
            type: 'text',
            text: ' for emphasis',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Italic text',
            styles: { italic: true },
          },
          {
            type: 'text',
            text: ' for subtle emphasis',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [
          {
            type: 'text',
            text: 'Underlined text',
            styles: { underline: true },
          },
          {
            type: 'text',
            text: ' to highlight',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Structure', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Use headings to organize your content:',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'This is a Heading 1', styles: {} }],
        props: { level: 1 },
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'This is a Heading 2', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'This is a Heading 3', styles: {} }],
        props: { level: 3 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Create lists to organize information:',
            styles: {},
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'Bullet point 1', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'Bullet point 2', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'Bullet point 3', styles: {} }],
      },
    ],
    icon: '📝',
    cover: null,
  },
  {
    title: '🎨 Customization',
    content: [
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Make It Your Own', styles: {} }],
        props: { level: 1 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Personalize your blog posts with icons and covers!',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Adding Icons', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Click the icon button (😀) in the header to add an emoji icon to your post. Icons help you quickly identify posts in the sidebar.',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Adding Covers', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Click the cover button to add a colorful background or image to your post. This makes your blog more visually appealing!',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: 'Organizing Posts', styles: {} }],
        props: { level: 2 },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Use the + button next to each post in the sidebar to create sub-pages. This helps you organize related content together.',
            styles: {},
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Example structure:',
            styles: { bold: true },
          },
        ],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '📚 Learning Resources', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '  ↳ 📖 Books', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '  ↳ 🎥 Videos', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [{ type: 'text', text: '  ↳ 🔗 Articles', styles: {} }],
      },
    ],
    icon: '🎨',
    cover: { type: 'color', value: 'bg-gradient-to-r from-pink-500 to-orange-500' },
  },
];
