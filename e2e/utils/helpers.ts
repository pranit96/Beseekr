// e2e/utils/helpers.ts
// Common test helper functions

import { Page, expect } from "@playwright/test";

// Wait for network to be idle
export async function waitForNetworkIdle(
  page: Page,
  timeout = 5000,
): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
}

// Wait for element to be stable (not moving)
export async function waitForStable(
  page: Page,
  selector: string,
  timeout = 5000,
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: "visible", timeout });

  // Wait for position to stabilize
  let lastBox = await element.boundingBox();
  let stable = false;
  const startTime = Date.now();

  while (!stable && Date.now() - startTime < timeout) {
    await page.waitForTimeout(100);
    const currentBox = await element.boundingBox();
    if (lastBox && currentBox) {
      stable = lastBox.x === currentBox.x && lastBox.y === currentBox.y;
    }
    lastBox = currentBox;
  }
}

// Take timestamped screenshot
export async function screenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `e2e/reports/${name}-${timestamp}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

// Mock API response
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: unknown,
  status = 200,
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

// Intercept and log API requests
export async function interceptApiRequests(
  page: Page,
  urlPatterns: (string | RegExp)[],
): Promise<Map<string, any[]>> {
  const requests = new Map<string, any[]>();

  for (const pattern of urlPatterns) {
    const key = pattern.toString();
    requests.set(key, []);

    await page.route(pattern, async (route, request) => {
      const data = {
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON(),
        timestamp: new Date(),
      };
      requests.get(key)?.push(data);
      await route.continue();
    });
  }

  return requests;
}

// Check if element exists (without failing)
export async function elementExists(
  page: Page,
  selector: string,
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: "visible", timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Get all visible text content from page
export async function getVisibleText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}

// Scroll to bottom of page
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);
}

// Scroll to element
export async function scrollToElement(
  page: Page,
  selector: string,
): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

// Check console for errors
export async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  return errors;
}

// Retry action with exponential backoff
export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Generate random test email
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

// Assert element count
export async function expectElementCount(
  page: Page,
  selector: string,
  count: number,
): Promise<void> {
  const elements = page.locator(selector);
  await expect(elements).toHaveCount(count);
}

// Assert element visible with timeout
export async function expectVisibleWithTimeout(
  page: Page,
  selector: string,
  timeout = 10000,
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}
