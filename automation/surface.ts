import type { Browser, BrowserContext, Locator as PWLocator, Page } from "@playwright/test";
import { chromium } from "@playwright/test";
import type { Locator } from "./types";

export class WebSurface {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;

  async start(headless = true) {
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({ recordVideo: headless ? undefined : { dir: "evidence/video" } });
    this.page = await this.context.newPage();
    return this;
  }
  private candidate(locator: Locator): PWLocator {
    const page = this.page!;
    if (locator.role && locator.name) return page.getByRole(locator.role as never, { name: locator.name });
    if (locator.label) return page.getByLabel(locator.label);
    if (locator.text) return page.getByText(locator.text, { exact: false });
    if (locator.css) return page.locator(locator.css);
    throw new Error("LOCATOR_EMPTY");
  }
  async locate(locator: Locator): Promise<PWLocator> {
    const options = [locator, ...(locator.fallbacks || [])];
    for (const option of options) {
      const candidate = this.candidate(option);
      try {
        await candidate.first().waitFor({ state: "attached", timeout: 750 });
        return candidate.first();
      } catch { /* try the next deterministic fallback */ }
    }
    throw new Error(`TARGET_NOT_FOUND:${JSON.stringify(locator)}`);
  }
  async observe() {
    return this.page!.locator("body").ariaSnapshot();
  }
  async screenshot(file: string) { await this.page!.screenshot({ path: file, fullPage: true }); }
  async close() { await this.context?.close(); await this.browser?.close(); }
}
