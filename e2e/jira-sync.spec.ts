import { test, expect } from "@playwright/test";

test.describe("Jira Sync E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stories");
  });

  test("should display Jira connect button", async ({ page }) => {
    const connectButton = page.getByRole("button", { name: /connect.*jira/i });
    await expect(connectButton).toBeVisible();
  });

  test("should open Jira connect dialog", async ({ page }) => {
    const connectButton = page.getByRole("button", { name: /connect.*jira/i });
    await connectButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    await expect(page.getByLabel(/jira url/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/api token/i)).toBeVisible();
  });

  test("should create new project with story document", async ({ page }) => {
    const newProjectButton = page.getByRole("button", { name: /new project/i });
    await newProjectButton.click();

    const projectNameInput = page.getByLabel(/project name/i);
    await projectNameInput.fill("Test Project");

    const createButton = page.getByRole("button", { name: /create/i });
    await createButton.click();

    await expect(page.getByText(/test project/i)).toBeVisible();
  });

  test("should display sync panel when connected", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("jira_connected", "true");
    });

    await page.reload();

    const syncPanel = page.getByText(/jira sync/i);
    await expect(syncPanel).toBeVisible();
  });

  test("should show sync to jira button", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("jira_connected", "true");
    });

    await page.reload();

    const syncButton = page.getByRole("button", { name: /sync to jira/i });
    await expect(syncButton).toBeVisible();
  });

  test("should show sync from jira button", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("jira_connected", "true");
    });

    await page.reload();

    const syncButton = page.getByRole("button", { name: /sync from jira/i });
    await expect(syncButton).toBeVisible();
  });

  test("should toggle dry run mode", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("jira_connected", "true");
    });

    await page.reload();

    const dryRunCheckbox = page.getByLabel(/dry run/i);
    await expect(dryRunCheckbox).toBeVisible();
    
    await dryRunCheckbox.click();
    await expect(dryRunCheckbox).toBeChecked();
  });

  test("should show error when syncing without connection", async ({ page }) => {
    const syncButton = page.getByRole("button", { name: /sync to jira/i });
    
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await expect(page.getByText(/connect to jira/i)).toBeVisible();
    }
  });

  test("should display AI assistant button", async ({ page }) => {
    const aiButton = page.getByRole("button", { name: /ai assistant/i });
    await expect(aiButton).toBeVisible();
  });

  test("should open AI chat panel", async ({ page }) => {
    const aiButton = page.getByRole("button", { name: /ai assistant/i });
    await aiButton.click();

    const chatPanel = page.getByText(/stories assistant/i);
    await expect(chatPanel).toBeVisible();
  });
});
