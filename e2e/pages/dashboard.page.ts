// e2e/pages/dashboard.page.ts
// Dashboard layout page object

import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
    // Header locators
    readonly logo: Locator;
    readonly userMenuButton: Locator;
    readonly userMenuDropdown: Locator;
    readonly settingsLink: Locator;
    readonly signOutButton: Locator;
    readonly themeToggle: Locator;
    readonly mobileMenuButton: Locator;

    // Sidebar locators
    readonly sidebar: Locator;
    readonly navProblems: Locator;
    readonly navWatchlist: Locator;
    readonly navSearch: Locator;
    readonly navFeed: Locator;
    readonly navValidate: Locator;
    readonly navPricing: Locator;
    readonly navAgents: Locator;

    // User info in dropdown
    readonly userName: Locator;
    readonly userEmail: Locator;

    constructor(page: Page) {
        super(page);

        // Header
        this.logo = page.locator('a[href="/"]').first();
        this.userMenuButton = page.locator('button[aria-label="User menu"]');
        this.userMenuDropdown = page.locator('[role="menu"]');
        this.settingsLink = page.locator('a[href="/dashboard/profile"]');
        this.signOutButton = page.getByText('Sign Out');
        this.themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Toggle"]');
        this.mobileMenuButton = page.locator('button[aria-label*="menu"]').first();

        // Sidebar navigation - use flexible selectors
        this.sidebar = page.locator('nav, aside').first();
        this.navProblems = page.locator('a[href="/dashboard/problems"], a:has-text("Problems")').first();
        this.navWatchlist = page.locator('a[href="/dashboard/watchlist"], a:has-text("Watchlist")').first();
        this.navSearch = page.locator('a[href="/dashboard/search"], a:has-text("Search")').first();
        this.navFeed = page.locator('a[href="/dashboard/feed"], a:has-text("Feed")').first();
        this.navValidate = page.locator('a[href="/dashboard/validate"], a:has-text("Validate")').first();
        this.navPricing = page.locator('a[href*="/pricing"], a:has-text("Pricing")').first();
        this.navAgents = page.locator('a[href="/dashboard/agents"], a:has-text("Agents")').first();

        // User info
        this.userName = page.locator('[role="menu"] p').first();
        this.userEmail = page.locator('[role="menu"] p.text-xs');
    }

    // Navigation actions
    async goto() {
        await this.page.goto('/dashboard/problems');
    }

    async navigateToProblems() {
        await this.navProblems.click();
        await this.page.waitForURL(/\/dashboard\/problems/);
    }

    async navigateToWatchlist() {
        await this.navWatchlist.click();
        await this.page.waitForURL(/\/dashboard\/watchlist/);
    }

    async navigateToSearch() {
        await this.navSearch.click();
        await this.page.waitForURL(/\/dashboard\/search/);
    }

    async navigateToFeed() {
        await this.navFeed.click();
        await this.page.waitForURL(/\/dashboard\/feed/);
    }

    async navigateToValidate() {
        await this.navValidate.click();
        await this.page.waitForURL(/\/dashboard\/validate/);
    }

    async navigateToPricing() {
        await this.navPricing.click();
        await this.page.waitForURL(/\/pricing/);
    }

    async navigateToProfile() {
        await this.openUserMenu();
        await this.settingsLink.click();
        await this.page.waitForURL(/\/dashboard\/profile/);
    }

    // User menu actions
    async openUserMenu() {
        await this.userMenuButton.click();
        await this.userMenuDropdown.waitFor({ state: 'visible' });
    }

    async logout() {
        await this.openUserMenu();
        await this.signOutButton.click();
        await this.page.waitForURL('/');
    }

    async toggleTheme() {
        await this.themeToggle.click();
    }

    // Mobile actions
    async openMobileMenu() {
        await this.mobileMenuButton.click();
    }

    // Assertions
    async expectUserLoggedIn(name?: string, email?: string) {
        await this.openUserMenu();
        if (name) {
            await this.expectText(this.userName, name);
        }
        if (email) {
            await this.expectText(this.userEmail, email);
        }
        // Close menu
        await this.page.keyboard.press('Escape');
    }

    async expectOnDashboard() {
        await this.expectUrl('/dashboard');
    }
}
