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

  test("tablet navbar is available for every role", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const accounts = [
      { emp: "NV001", pwd: "123456", item: "Lệnh SX" },
      { emp: "NV010", pwd: "123456", item: "Phân công" },
      { emp: "NV020", pwd: "123456", item: "Phân công" },
      { emp: "NV030", pwd: "123456", item: "Sản xuất" },
      { emp: "NV040", pwd: "123456", item: "Kiểm tra" },
      { emp: "NV050", pwd: "123456", item: "Ghi ca" },
      { emp: "NV000", pwd: "admin123", item: "Danh mục SP" },
      { emp: "NV060", pwd: "123456", item: "Phê duyệt" },
    ];
    for (const a of accounts) {
      await page.goto("/login");
      await page.getByTestId("login-employee-id").fill(a.emp);
      await page.getByTestId("login-password").fill(a.pwd);
      await page.getByTestId("login-submit").click();
      await expect(page).not.toHaveURL(/\/login/);
      const tablet = page.getByRole("navigation", { name: "Điều hướng tablet" });
      await expect(tablet).toBeVisible();
      await expect(tablet.getByRole("button", { name: a.item })).toBeVisible();
      await tablet.getByRole("button", { name: a.item }).click();
      await page.getByRole("button", { name: /Đăng xuất/i }).click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
