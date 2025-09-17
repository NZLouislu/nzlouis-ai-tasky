import React from "react";
import "@testing-library/jest-dom";

// Mock all the dependencies that might cause issues in tests
jest.mock("@/hooks/use-blog-data", () => ({
  useBlogData: () => ({
    posts: [],
    isLoading: false,
    error: null,
    addNewPost: jest.fn(),
    addNewSubPost: jest.fn(),
    updatePostTitle: jest.fn(),
    updatePostContent: jest.fn(),
    setPostIcon: jest.fn(),
    removePostIcon: jest.fn(),
    setPostCover: jest.fn(),
    removePostCover: jest.fn(),
    deletePost: jest.fn(),
    userId: "test-user-id",
    setUserId: jest.fn(),
  }),
}));

// Mock the supabase client
jest.mock("@/lib/supabase/supabase-client", () => ({
  supabase: null,
}));

// Mock the environment config
jest.mock("@/lib/environment", () => ({
  getTaskySupabaseConfig: () => ({
    url: "test-url",
    anonKey: "test-key",
  }),
  getBlogSupabaseConfig: () => ({
    url: "test-blog-url",
    serviceRoleKey: "test-service-key",
  }),
}));

// Mock child components
jest.mock("../../Sidebar", () => {
  return function MockSidebar() {
    return <div>Sidebar</div>;
  };
});

jest.mock("../../UnifiedChatbot", () => {
  return function MockUnifiedChatbot() {
    return <div>Chatbot</div>;
  };
});

jest.mock("../BlogHeader", () => {
  return function MockBlogHeader() {
    return <div>Blog Header</div>;
  };
});

jest.mock("../BlogContent", () => {
  return function MockBlogContent() {
    return <div>Blog Content</div>;
  };
});

jest.mock("../BlogCover", () => {
  return function MockBlogCover() {
    return <div>Blog Cover</div>;
  };
});

jest.mock("../IconSelector", () => {
  return function MockIconSelector() {
    return <div>Icon Selector</div>;
  };
});

jest.mock("../CoverOptions", () => {
  return function MockCoverOptions() {
    return <div>Cover Options</div>;
  };
});

jest.mock("../DeleteDropdown", () => {
  return function MockDeleteDropdown() {
    return <div>Delete Dropdown</div>;
  };
});

jest.mock("../ChatbotPanel", () => {
  return function MockChatbotPanel() {
    return <div>Chatbot Panel</div>;
  };
});

// Simple test to check if component can be imported without crashing

import BlogPage from "../BlogPage";

describe("BlogPage", () => {
  it("should be importable", () => {
    expect(BlogPage).toBeDefined();
  });
});
