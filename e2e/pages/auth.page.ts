// e2e/pages/auth.page.ts
// Auth page object for login/signup interactions

import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AuthPage extends BasePage {
    // Locators
    readonly loginTab: Locator;
    readonly signupTab: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly nameInput: Locator;
    readonly loginButton: Locator;
    readonly signupButton: Locator;
    readonly googleButton: Locator;
    readonly forgotPasswordLink: Locator;
    readonly errorText: Locator;
    readonly verificationPending: Locator;

    constructor(page: Page) {
        super(page);
        this.loginTab = page.getByRole('tab', { name: 'Login' });
        this.signupTab = page.getByRole('tab', { name: 'Sign Up' });
        this.emailInput = page.locator('input[type="email"]');
        this.passwordInput = page.locator('input[type="password"]');
        this.nameInput = page.locator('input#signup-name');
        this.loginButton = page.locator('button[type="submit"]:has-text("Login")');
        this.signupButton = page.locator('button[type="submit"]:has-text("Sign Up")');
        this.googleButton = page.locator('button:has-text("Google")');
        this.forgotPasswordLink = page.getByText('Forgot password?');
        this.errorText = page.locator('[class*="text-red"], [class*="destructive"]');
        this.verificationPending = page.getByText('Verification Email Sent');
    }

    // Actions
    async goto() {
        await this.page.goto('/auth');
    }

    async login(email: string, password: string) {
        await this.loginTab.click();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async signup(name: string, email: string, password: string) {
        await this.signupTab.click();
        await this.nameInput.fill(name);
        await this.emailInput.last().fill(email);
        await this.passwordInput.last().fill(password);
        await this.signupButton.click();
    }

    async clickGoogleLogin() {
        await this.googleButton.first().click();
    }

    async clickForgotPassword() {
        await this.forgotPasswordLink.click();
    }

    // Assertions
    async expectLoginError(message?: string) {
        await this.page.waitForSelector('[class*="text-red"], [class*="destructive"]');
        if (message) {
            await this.expectText(this.errorText.first(), message);
        }
    }

    async expectVerificationPending() {
        await this.expectVisible(this.verificationPending);
    }

    async expectRedirectToDashboard() {
        await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }
}
