import React from "react";
import "@testing-library/jest-dom";
import { vi } from 'vitest';

vi.mock("@/hooks/use-blog-data", () => ({
  useBlogData: () => ({
    posts: [],
    isLoading: false,
    error: null,
    addNewPost: vi.fn(),
    addNewSubPost: vi.fn(),
    updatePostTitle: vi.fn(),
    updatePostContent: vi.fn(),
    setPostIcon: vi.fn(),
    removePostIcon: vi.fn(),
    setPostCover: vi.fn(),
    removePostCover: vi.fn(),
    deletePost: vi.fn(),
    userId: "test-user-id",
    setUserId: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/supabase-client", () => ({
  supabase: null,
}));

vi.mock("@/lib/environment", () => ({
  getTaskySupabaseConfig: () => ({
    url: "test-url",
    anonKey: "test-key",
  }),
  getBlogSupabaseConfig: () => ({
    url: "test-blog-url",
    serviceRoleKey: "test-service-key",
  }),
}));

vi.mock("../../Sidebar", () => {
  return {
    default: function MockSidebar() {
      return <div>Sidebar</div>;
    }
  };
});

vi.mock("../../UnifiedChatbot", () => {
  return {
    default: function MockUnifiedChatbot() {
      return <div>Chatbot</div>;
    }
  };
});

vi.mock("../BlogHeader", () => {
  return {
    default: function MockBlogHeader() {
      return <div>Blog Header</div>;
    }
  };
});

vi.mock("../BlogContent", () => {
  return {
    default: function MockBlogContent() {
      return <div>Blog Content</div>;
    }
  };
});

vi.mock("../BlogCover", () => {
  return {
    default: function MockBlogCover() {
      return <div>Blog Cover</div>;
    }
  };
});

vi.mock("../IconSelector", () => {
  return {
    default: function MockIconSelector() {
      return <div>Icon Selector</div>;
    }
  };
});

vi.mock("../CoverOptions", () => {
  return {
    default: function MockCoverOptions() {
      return <div>Cover Options</div>;
    }
  };
});

vi.mock("../DeleteDropdown", () => {
  return {
    default: function MockDeleteDropdown() {
      return <div>Delete Dropdown</div>;
    }
  };
});

vi.mock("../ChatbotPanel", () => {
  return {
    default: function MockChatbotPanel() {
      return <div>Chatbot Panel</div>;
    }
  };
});

// Simple test to check if component can be imported without crashing

import BlogPage from "../BlogPage";

describe("BlogPage", () => {
  it("should be importable", () => {
    expect(BlogPage).toBeDefined();
  });
});
