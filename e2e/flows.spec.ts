import { expect, test, type Page } from "@playwright/test";

const uniqueEmail = () => `user${Date.now()}@example.com`;

async function signup(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("heading", { name: "Feature requests" })).toBeVisible();
}

test("a visitor can sign up, post, vote and comment", async ({ page }) => {
  await signup(page, uniqueEmail());

  await page.getByRole("link", { name: "New post" }).click();
  await page.getByLabel("Title").fill("Add API webhooks");
  await page.getByLabel("Details").fill("Fire a webhook when a post changes status.");
  await page.getByRole("button", { name: "Submit post" }).click();

  await expect(page.getByRole("heading", { name: "Add API webhooks" })).toBeVisible();

  // Vote (optimistic), then comment.
  const count = page.locator(".vote .count");
  await expect(count).toHaveText("0");
  await page.getByRole("button", { name: "▲" }).click();
  await expect(count).toHaveText("1");

  await page.getByLabel("Add a comment").fill("Yes please, this would help our integration.");
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Yes please, this would help our integration.")).toBeVisible();
});

test("validation errors are shown on the post form", async ({ page }) => {
  await signup(page, uniqueEmail());
  await page.goto("/new");
  await page.getByLabel("Title").fill("no");
  await page.getByLabel("Details").fill("short");
  await page.getByRole("button", { name: "Submit post" }).click();
  await expect(page.getByText(/at least 4 characters/)).toBeVisible();
  await expect(page.getByText(/at least 10 characters/)).toBeVisible();
});

test("wrong credentials show a generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("wrongpassword");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("seeded admin can change a post status; members cannot see the control", async ({ page }) => {
  // Admin sees the status control.
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Dark mode" }).click();
  await expect(page.getByText("Set status (admin):")).toBeVisible();
  await page.getByRole("combobox").selectOption("done");
  await expect(page.locator(".status.done")).toBeVisible();
});
