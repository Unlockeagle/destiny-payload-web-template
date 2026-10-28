import { test, expect, Page } from '@playwright/test'

const baseURL = 'http://localhost:3000'

type TransitionInfo = {
  // Animaciones de ::view-transition-new(...) en curso: pseudo-elemento y duración en ms
  newAnimations: { pseudo: string; duration: number }[]
  // Total de animaciones de ::view-transition-* en curso
  total: number
  // Curva de ::view-transition-new(root); getTiming() siempre da 'linear' en animaciones CSS
  rootEasing: string
}

declare global {
  interface Window {
    __vtCalls: number
    __vtInfo: TransitionInfo[]
  }
}

// Envuelve document.startViewTransition para contar llamadas y, al resolverse
// transition.ready, guardar las animaciones de view transition en curso
const instrumentViewTransitions = (page: Page) =>
  page.addInitScript(() => {
    window.__vtCalls = 0
    window.__vtInfo = []
    const original = document.startViewTransition?.bind(document)
    if (!original) return
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      window.__vtCalls++
      const transition = original(arg)
      transition.ready
        .then(() => {
          const animations = document
            .getAnimations()
            .filter((a) =>
              ((a.effect as KeyframeEffect | null)?.pseudoElement ?? '').startsWith('::view-transition'),
            )
          window.__vtInfo.push({
            newAnimations: animations
              .filter((a) => (a.effect as KeyframeEffect).pseudoElement!.startsWith('::view-transition-new'))
              .map((a) => ({
                pseudo: (a.effect as KeyframeEffect).pseudoElement!,
                duration: Number(a.effect!.getTiming().duration),
              })),
            total: animations.length,
            rootEasing: getComputedStyle(document.documentElement, '::view-transition-new(root)')
              .animationTimingFunction,
          })
        })
        .catch(() => {})
      return transition
    }) as typeof document.startViewTransition
  })

const navigateWithLogo = async (page: Page) => {
  await page.goto(`${baseURL}/posts`)
  await page.locator('header a[href="/"]').click()
  await expect(page).toHaveURL(`${baseURL}/`)
  await expect.poll(() => page.evaluate(() => window.__vtInfo.length)).toBeGreaterThan(0)
  return page.evaluate(() => ({ calls: window.__vtCalls, info: window.__vtInfo }))
}

test.describe('View transitions', () => {
  test('navegar con un <Link> hace crossfade de 250ms ease-out', async ({ page }) => {
    await instrumentViewTransitions(page)
    const { calls, info } = await navigateWithLogo(page)

    expect(calls).toBeGreaterThanOrEqual(1)
    const [transition] = info
    expect(transition.newAnimations.length).toBeGreaterThan(0)
    for (const animation of transition.newAnimations) {
      expect(animation.duration).toBe(250)
    }
    expect(transition.rootEasing).toBe('ease-out')

    // Header y Footer no hacen fundido
    const pseudos = transition.newAnimations.map((a) => a.pseudo)
    expect(pseudos).not.toContain('::view-transition-new(site-header)')
    expect(pseudos).not.toContain('::view-transition-new(site-footer)')
  })

  test('con prefers-reduced-motion no hay animaciones de view transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await instrumentViewTransitions(page)
    const { info } = await navigateWithLogo(page)

    expect(info[0].total).toBe(0)
  })
})
