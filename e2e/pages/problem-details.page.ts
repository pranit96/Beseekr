// e2e/pages/problem-details.page.ts
// Problem details page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ProblemDetailsPage extends BasePage {
    // Header
    readonly backButton: Locator;
    readonly watchButton: Locator;
    readonly watchingButton: Locator;
    readonly title: Locator;
    readonly categoryBadge: Locator;

    // Score card
    readonly scoreCircle: Locator;
    readonly scoreValue: Locator;
    readonly verdict: Locator;
    readonly confidenceBadge: Locator;
    readonly warnings: Locator;

    // Sections
    readonly problemSection: Locator;
    readonly marketSection: Locator;
    readonly validationSection: Locator;
    readonly actionSection: Locator;
    readonly sourcesSection: Locator;

    // Market data
    readonly tamValue: Locator;
    readonly samValue: Locator;
    readonly somValue: Locator;

    // Error state
    readonly errorCard: Locator;

    constructor(page: Page) {
        super(page);

        // Header
        this.backButton = page.locator('button:has-text("Back")');
        this.watchButton = page.locator('button:has-text("Watch")');
        this.watchingButton = page.locator('button:has-text("Watching")');
        this.title = page.locator('h1');
        this.categoryBadge = page.locator('[class*="Badge"]').first();

        // Score
        this.scoreCircle = page.locator('[class*="rounded-full"][class*="border-4"]');
        this.scoreValue = page.locator('[class*="text-3xl"][class*="font-bold"]');
        this.verdict = page.locator('h2').filter({ hasText: /(Worth|Early|Needs|Strong)/i });
        this.confidenceBadge = page.locator('[class*="Badge"]').filter({ hasText: /confidence/i });
        this.warnings = page.locator('[class*="text-amber"]');

        // Sections
        this.problemSection = page.locator('section:has-text("The Problem")');
        this.marketSection = page.locator('section:has-text("Market")');
        this.validationSection = page.locator('section:has-text("Validation")');
        this.actionSection = page.locator('section:has-text("Next Steps")');
        this.sourcesSection = page.locator('section:has-text("Source Posts")');

        // Market values
        this.tamValue = page.locator('text=TAM').locator('..').locator('p[class*="font-bold"]');
        this.samValue = page.locator('text=SAM').locator('..').locator('p[class*="font-bold"]');
        this.somValue = page.locator('text=SOM').locator('..').locator('p[class*="font-bold"]');

        // Error
        this.errorCard = page.locator('[class*="destructive"]');
    }

    // Navigation
    async goto(problemId: string) {
        await this.page.goto(`/dashboard/problems/${problemId}`);
        await this.waitForLoadingToFinish();
    }

    async goBack() {
        await this.backButton.click();
        await this.page.waitForURL(/\/dashboard\/problems$/);
    }

    // Watchlist actions
    async toggleWatchlist() {
        const isWatching = await this.watchingButton.isVisible().catch(() => false);
        if (isWatching) {
            await this.watchingButton.click();
        } else {
            await this.watchButton.click();
        }
        // Wait for mutation to complete
        await this.page.waitForTimeout(500);
    }

    async addToWatchlist() {
        if (await this.watchButton.isVisible()) {
            await this.watchButton.click();
            await this.watchingButton.waitFor({ state: 'visible' });
        }
    }

    async removeFromWatchlist() {
        if (await this.watchingButton.isVisible()) {
            await this.watchingButton.click();
            await this.watchButton.waitFor({ state: 'visible' });
        }
    }

    // Assertions
    async expectProblemLoaded() {
        await this.waitForLoadingToFinish();
        await this.expectVisible(this.title);
        await this.expectVisible(this.scoreCircle);
    }

    async expectError() {
        await this.expectVisible(this.errorCard);
    }

    async expectInWatchlist() {
        await this.expectVisible(this.watchingButton);
    }

    async expectNotInWatchlist() {
        await this.expectVisible(this.watchButton);
    }

    async getScore(): Promise<number> {
        const text = await this.scoreValue.textContent();
        return parseInt(text || '0', 10);
    }

    async getTitle(): Promise<string> {
        return (await this.title.textContent()) || '';
    }

    async hasMarketData(): Promise<boolean> {
        return await this.marketSection.isVisible();
    }

    async hasValidationData(): Promise<boolean> {
        return await this.validationSection.isVisible();
    }
}
