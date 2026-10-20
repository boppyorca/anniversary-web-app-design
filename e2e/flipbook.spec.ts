import { test, expect } from '@playwright/test'

test.describe('E2E: Flipbook Stage Verification (390x844)', () => {
  test('unlocks envelope, flips through all 18 sheets, and completes stage', async ({ page }) => {
    // 1. Navigate to localhost
    await page.goto('/')

    // 2. Jump directly to flipbook stage via session & localStorage
    await page.evaluate(() => {
      localStorage.setItem('anniv:v1:progress', JSON.stringify({ index: 5, unlocked: 5 }))
      sessionStorage.setItem('anniv:v1:session_stage', '5')
      sessionStorage.removeItem('anniv:v1:flip-pos')
      location.reload()
    })

    // 3. Verify envelope is visible
    const sealButton = page.locator('button.wax-seal')
    await expect(sealButton).toBeVisible({ timeout: 10000 })

    // 4. Trigger hold-to-open on wax seal
    const box = await sealButton.boundingBox()
    expect(box).toBeTruthy()
    const cx = box!.x + box!.width / 2
    const cy = box!.y + box!.height / 2

    await page.mouse.move(cx, cy)
    await page.mouse.down()
    // Hold for 1.6s to crack the seal
    await page.waitForTimeout(1600)
    await page.mouse.up()

    // 5. Verify book stage opened, shows Sheet 1 (Cover) and counter "1 / 18"
    const counter = page.locator('p.page-counter')
    await expect(counter).toHaveText('1 / 18', { timeout: 5000 })
    await expect(page.locator('text=Một năm của mình')).toBeVisible()

    // 6. Flip through all sheets until reaching 18 / 18
    const nextBtn = page.locator('button:has-text("Sau →")')

    for (let sheet = 2; sheet <= 18; sheet++) {
      await page.keyboard.press('ArrowRight')
      await expect(counter).toHaveText(`${sheet} / 18`, { timeout: 5000 })
      await page.waitForTimeout(700)
    }

    // 7. Verify sheet 18 (Back Cover)
    await expect(page.locator('text=Hẹn năm sau')).toBeVisible()

    // 8. Click "Xem xong rồi" and assert transition to Finale stage
    const finishBtn = page.locator('button:has-text("Xem xong rồi")')
    await finishBtn.click({ force: true })

    // Should transition to Finale stage (index 6)
    await expect(page.locator('text=HÀNH TRÌNH CỦA CHÚNG MÌNH')).toBeVisible({ timeout: 5000 })
  })

  test('fresh visit to root / always starts at Gate stage even if localStorage has progress', async ({ page }) => {
    await page.goto('/')

    // Simulate returning visitor where localStorage previously had flipbook unlocked
    await page.evaluate(() => {
      localStorage.setItem('anniv:v1:progress', JSON.stringify({ index: 5, unlocked: 5 }))
      sessionStorage.clear()
      location.reload()
    })

    // Verify Gate stage is displayed
    const unlockBtn = page.locator('button:has-text("Mở khóa")')
    await expect(unlockBtn).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[placeholder*="YYYY"], input[placeholder*="yyyy"]')).toBeVisible()

    // Verify Flipbook stage is NOT displayed
    await expect(page.locator('button.wax-seal')).not.toBeVisible()
    await expect(page.locator('p.page-counter')).not.toBeVisible()
  })
})
