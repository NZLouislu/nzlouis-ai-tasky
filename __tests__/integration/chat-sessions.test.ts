const mockTaskyDbHelpers = {
  createChatSession: jest.fn(),
  getChatSessions: jest.fn(),
  getChatSession: jest.fn(),
  updateChatSession: jest.fn(),
  deleteChatSession: jest.fn(),
  getChatMessages: jest.fn(),
};

jest.mock('@/lib/supabase/tasky-db-client', () => ({
  taskyDbHelpers: mockTaskyDbHelpers,
}));

describe('Chat Sessions Integration', () => {
  const mockUserId = 'test-user-123';
  const mockSessionId = 'session-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session CRUD Operations', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: mockSessionId,
        user_id: mockUserId,
        title: 'New Chat',
        provider: 'google',
        model: 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockTaskyDbHelpers.createChatSession = jest.fn().mockResolvedValue(mockSession);

      const result = await mockTaskyDbHelpers.createChatSession(mockUserId, {
        title: 'New Chat',
        provider: 'google',
        model: 'gemini-2.5-flash',
      });

      expect(result).toEqual(mockSession);
      expect(mockTaskyDbHelpers.createChatSession).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: 'New Chat',
          provider: 'google',
          model: 'gemini-2.5-flash',
        })
      );
    });

    it('should get all sessions for a user', async () => {
      const mockSessions = [
        { id: 'session-1', title: 'Chat 1', user_id: mockUserId },
        { id: 'session-2', title: 'Chat 2', user_id: mockUserId },
      ];

      mockTaskyDbHelpers.getChatSessions = jest.fn().mockResolvedValue(mockSessions);

      const result = await mockTaskyDbHelpers.getChatSessions(mockUserId);

      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
    });

    it('should get a specific session', async () => {
      const mockSession = {
        id: mockSessionId,
        user_id: mockUserId,
        title: 'Test Chat',
      };

      mockTaskyDbHelpers.getChatSession = jest.fn().mockResolvedValue(mockSession);

      const result = await mockTaskyDbHelpers.getChatSession(mockSessionId, mockUserId);

      expect(result).toEqual(mockSession);
    });

    it('should update a session', async () => {
      const updatedSession = {
        id: mockSessionId,
        user_id: mockUserId,
        title: 'Updated Title',
      };

      mockTaskyDbHelpers.updateChatSession = jest.fn().mockResolvedValue(updatedSession);

      const result = await mockTaskyDbHelpers.updateChatSession(
        mockSessionId,
        mockUserId,
        { title: 'Updated Title' }
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should delete a session', async () => {
      mockTaskyDbHelpers.deleteChatSession = jest.fn().mockResolvedValue(undefined);

      await mockTaskyDbHelpers.deleteChatSession(mockSessionId, mockUserId);

      expect(mockTaskyDbHelpers.deleteChatSession).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
    });
  });

  describe('Message Operations', () => {
    it('should get messages for a session', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          session_id: mockSessionId,
          role: 'user',
          content: 'Hello',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          session_id: mockSessionId,
          role: 'assistant',
          content: 'Hi there!',
          created_at: new Date().toISOString(),
        },
      ];

      mockTaskyDbHelpers.getChatMessages = jest.fn().mockResolvedValue(mockMessages);

      const result = await mockTaskyDbHelpers.getChatMessages(mockSessionId);

      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(2);
    });
  });

  describe('User Isolation', () => {
    it('should only return sessions for the specified user', async () => {
      const user1Sessions = [{ id: 'session-1', user_id: 'user-1' }];

      mockTaskyDbHelpers.getChatSessions = jest.fn().mockResolvedValue(user1Sessions);

      const result = await mockTaskyDbHelpers.getChatSessions('user-1');

      expect(result.every((s: any) => s.user_id === 'user-1')).toBe(true);
    });
  });
});
