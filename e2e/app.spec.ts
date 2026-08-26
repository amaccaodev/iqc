import { test, expect } from "@playwright/test";

test.describe("IQC Production Management", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "COPEX" })).toBeVisible();
    await expect(page.getByTestId("login-submit")).toBeVisible();
  });

  test("director can login and see dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-employee-id").fill("NV001");
    await page.getByTestId("login-password").fill("123456");
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/director\/dashboard/);
    await expect(page.getByText("Tổng quan sản xuất")).toBeVisible();
  });

  test("supervisor navigation between pages", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-employee-id").fill("NV010");
    await page.getByTestId("login-password").fill("123456");
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/supervisor\/dashboard/);
    await page.getByRole("button", { name: /Lệnh SX/i }).click();
    await expect(page).toHaveURL(/\/supervisor\/orders/);
    await page.getByRole("button", { name: /Phân công/i }).click();
    await expect(page).toHaveURL(/\/supervisor\/assign/);
  });

  test("invalid login shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-employee-id").fill("INVALID");
    await page.getByTestId("login-password").fill("wrong");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  test("admin accounts page", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-employee-id").fill("NV000");
    await page.getByTestId("login-password").fill("admin123");
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await page.getByRole("button", { name: /Tài khoản/i }).click();
    await expect(page).toHaveURL(/\/admin\/accounts/);
    await expect(page.getByText("Quản lý Tài khoản")).toBeVisible();
  });

  test("worker entry form tabs and spec warning", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-employee-id").fill("NV030");
    await page.getByTestId("login-password").fill("123456");
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/worker\/dashboard/);
    await page.getByRole("button", { name: /Nhập dữ liệu kiểm tra/i }).first().click();
    await expect(page).toHaveURL(/\/worker\/task\//);

    await expect(page.getByText("Yêu cầu từ Giám đốc")).toBeVisible();
    await expect(page.getByText("File thông số & bản vẽ")).toBeVisible();
    await expect(page.getByText("ThongSoKyThuat_NOVO20.xlsx")).toBeVisible();

    await page.getByTestId("tab-Sản xuất").click();
    await page.getByTestId("dim-input-0").fill("19");
    await expect(page.getByTestId("spec-warning")).toBeVisible();
  });
});
