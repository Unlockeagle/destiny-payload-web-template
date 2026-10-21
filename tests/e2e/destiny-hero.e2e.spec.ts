import { test, expect, Page } from '@playwright/test'

// La página home usa el hero "Destiny Hero"
const url = 'http://localhost:3000/'
const screenshotDir = process.env.SCREENSHOT_DIR

const collectErrors = (page: Page) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

test.describe('Destiny Hero', () => {
  test('renderiza richText, links, avión, curva y nube en desktop', async ({ page }) => {
    const errors = collectErrors(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(url)

    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
    expect(await heading.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(26, 31, 113)')

    const cta = page.getByRole('link', { name: 'Habla con un agente' })
    await expect(cta).toBeVisible()
    const ctaStyles = await cta.evaluate((el) => {
      const s = getComputedStyle(el)
      return { bg: s.backgroundColor, color: s.color }
    })
    expect(ctaStyles).toEqual({ bg: 'rgb(177, 38, 114)', color: 'rgb(255, 255, 255)' })
    await expect(cta.locator('svg.lucide-play')).toHaveCount(1)

    const plane = page.locator('img[alt="Avión de Destiny Trip"]')
    await expect(plane).toBeVisible()
    expect(await plane.getAttribute('src')).toContain('airplane.png')
    expect(await plane.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
    expect(await plane.evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none')

    const curve = page.locator('.animation-draw').first()
    expect(await curve.evaluate((el) => getComputedStyle(el).animationName)).toBe('draw')

    const cloud = page.locator('svg[fill="#2A1A87"]')
    const cloudBox = await cloud.boundingBox()
    expect(cloudBox?.x).toBe(0)
    expect(Math.round(cloudBox?.width ?? 0)).toBe(
      await page.evaluate(() => document.documentElement.clientWidth),
    )

    // Esperar a que terminen las animaciones (~2s)
    await page.waitForTimeout(2500)
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/desktop-1440.png` })

    expect(errors).toEqual([])
  })

  test('el botón Contacto navega al link configurado', async ({ page }) => {
    await page.goto(url)
    const cta = page.getByRole('link', { name: 'Habla con un agente' })
    const href = await cta.getAttribute('href')
    expect(href).toBeTruthy()
    await cta.click()
    await expect(page).toHaveURL(new URL(href!, url).toString())
  })

  test('respeta prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(url)

    const curve = page.locator('.animation-draw').first()
    const curveStyles = await curve.evaluate((el) => {
      const s = getComputedStyle(el)
      return { animation: s.animationName, offset: s.strokeDashoffset }
    })
    expect(curveStyles.animation).toBe('none')
    expect(parseFloat(curveStyles.offset)).toBe(0)

    const plane = page.locator('img[alt="Avión de Destiny Trip"]')
    expect(await plane.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  })

  test('a 375px el texto va arriba, el avión debajo y no hay scroll horizontal', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(url)

    const headingBox = await page.locator('h1').first().boundingBox()
    const ctaBox = await page.getByRole('link', { name: 'Habla con un agente' }).boundingBox()
    const planeBox = await page.locator('img[alt="Avión de Destiny Trip"]').boundingBox()
    expect(headingBox!.y).toBeLessThan(planeBox!.y)
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(planeBox!.y)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)

    await page.waitForTimeout(2500)
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/mobile-375.png`, fullPage: true })

    expect(errors).toEqual([])
  })
})
