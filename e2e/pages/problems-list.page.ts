// e2e/pages/problems-list.page.ts
// Problems list page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ProblemsListPage extends BasePage {
    // Tab locators
    readonly freeProblemsTab: Locator;
    readonly premiumProblemsTab: Locator;

    // List locators
    readonly problemCards: Locator;
    readonly problemTitles: Locator;
    readonly problemScores: Locator;
    readonly problemCategories: Locator;

    // Empty/loading states
    readonly emptyState: Locator;
    readonly loadingSkeleton: Locator;

    // Filters and sorting
    readonly sortDropdown: Locator;
    readonly categoryFilter: Locator;
    readonly searchInput: Locator;

    // Guest prompts
    readonly signUpPrompt: Locator;
    readonly upgradePrompt: Locator;

    constructor(page: Page) {
        super(page);

        // Tabs
        this.freeProblemsTab = page.getByRole('tab', { name: /free/i });
        this.premiumProblemsTab = page.getByRole('tab', { name: /premium/i });

        // Problem cards
        this.problemCards = page.locator('[data-testid="problem-card"], article, [class*="Card"]').filter({ has: page.locator('h3, h4') });
        this.problemTitles = page.locator('[data-testid="problem-title"], h3, h4');
        this.problemScores = page.locator('[data-testid="score"], [class*="score"]');
        this.problemCategories = page.locator('[data-testid="category"], [class*="Badge"]');

        // States
        this.emptyState = page.getByText(/no problems found/i);
        this.loadingSkeleton = page.locator('[class*="Skeleton"]');

        // Filters
        this.sortDropdown = page.locator('select, [role="combobox"]').first();
        this.categoryFilter = page.locator('[data-testid="category-filter"]');
        this.searchInput = page.locator('input[placeholder*="search" i]');

        // Guest/upgrade prompts
        this.signUpPrompt = page.getByText(/sign up|create account/i);
        this.upgradePrompt = page.getByText(/upgrade|unlock/i);
    }

    // Navigation
    async goto() {
        await this.page.goto('/dashboard/problems');
        await this.waitForLoadingToFinish();
    }

    // Tab actions
    async selectFreeProblemsTab() {
        await this.freeProblemsTab.click();
        await this.waitForLoadingToFinish();
    }

    async selectPremiumProblemsTab() {
        await this.premiumProblemsTab.click();
        await this.waitForLoadingToFinish();
    }

    // Problem interactions
    async clickProblem(index: number = 0) {
        const cards = await this.problemCards.all();
        if (cards.length > index) {
            await cards[index].click();
            await this.page.waitForURL(/\/dashboard\/problems\/.+/);
        }
    }

    async clickProblemByTitle(title: string) {
        await this.page.locator(`text="${title}"`).click();
        await this.page.waitForURL(/\/dashboard\/problems\/.+/);
    }

    async hoverProblem(index: number = 0) {
        const cards = await this.problemCards.all();
        if (cards.length > index) {
            await cards[index].hover();
        }
    }

    // Filter/sort actions
    async sortBy(option: string) {
        await this.sortDropdown.click();
        await this.page.locator(`text="${option}"`).click();
        await this.waitForLoadingToFinish();
    }

    async searchProblems(query: string) {
        await this.searchInput.fill(query);
        await this.page.keyboard.press('Enter');
        await this.waitForLoadingToFinish();
    }

    // Assertions
    async expectProblemsLoaded(minCount: number = 1) {
        await this.waitForLoadingToFinish();
        const count = await this.problemCards.count();
        if (count < minCount) {
            throw new Error(`Expected at least ${minCount} problems, found ${count}`);
        }
    }

    async expectEmptyState() {
        await this.expectVisible(this.emptyState);
    }

    async getProblemsCount(): Promise<number> {
        return await this.problemCards.count();
    }

    async getProblemTitles(): Promise<string[]> {
        const titles: string[] = [];
        const cards = await this.problemCards.all();
        for (const card of cards) {
            const title = await card.locator('h3, h4').first().textContent();
            if (title) titles.push(title.trim());
        }
        return titles;
    }
}
