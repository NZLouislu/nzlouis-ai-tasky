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
            text: 'Use the "New Blog" button to create more posts',
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
            text: 'Organize posts with sub-blog using the + button',
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
];
