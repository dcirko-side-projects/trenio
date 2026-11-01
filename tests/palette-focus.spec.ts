import { expect, test } from '@playwright/test'

test('otvaranje i ponovno otvaranje svih vrsta sadržaja ne fokusira unos', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    document.documentElement.dataset.editableFocusCount = '0'
    document.addEventListener('focusin', event => {
      const target = event.target as HTMLElement
      if (target.matches('input:not([type=checkbox]),select,textarea,[contenteditable=true]')) document.documentElement.dataset.editableFocusCount = String(Number(document.documentElement.dataset.editableFocusCount) + 1)
    })
  })
  for (const [action, label, body] of [
    ['Dodaj zadatak', 'Naziv zadatka', ''],
    ['Nova bilješka', 'Naslov bilješke', 'Sadržaj bilješke'],
    ['Novi plan', 'Naziv plana', 'Sadržaj plana'],
    ['Nova ideja', 'Naziv ideje', 'Sadržaj ideje'],
  ]) {
    await page.evaluate(() => { document.documentElement.dataset.editableFocusCount = '0' })
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(page.locator('#draft-heading')).toBeFocused()
    if (body) {
      await expect(page.getByRole('textbox', { name: body, exact: true })).toBeVisible()
      await expect(page.getByRole('textbox', { name: body, exact: true })).not.toBeFocused()
      await page.getByRole('button', { name: 'Podebljano', exact: true }).click()
      await expect(page.getByRole('textbox', { name: body, exact: true })).not.toBeFocused()
    }
    await expect(page.locator('html')).toHaveAttribute('data-editable-focus-count', '0')
    await expect(page.getByLabel(label, { exact: true })).not.toBeFocused()
    await page.getByLabel(label, { exact: true }).click()
    await expect(page.getByLabel(label, { exact: true })).toBeFocused()
    await page.getByLabel(label, { exact: true }).fill(`Provjera ${label}`)
    await page.getByRole('checkbox', { name: 'Prikvači u Trenutno', exact: true }).check()
    await page.getByRole('button', { name: 'Spremi', exact: true }).click()
    await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
    await page.evaluate(() => { document.documentElement.dataset.editableFocusCount = '0' })
    await page.getByRole('button', { name: new RegExp(`^Provjera ${label}`) }).click()
    await expect(page.locator('html')).toHaveAttribute('data-editable-focus-count', '0')
    await expect(page.locator('#draft-heading')).toBeFocused()
    if (body) await expect(page.getByRole('textbox', { name: body, exact: true })).not.toBeFocused()
    await page.getByRole('button', { name: 'Zatvori uređivanje', exact: true }).click()
  }
})

test('kategorija, birač ikona i pretraga čekaju korisnikov odabir polja', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: /Glavna navigacija|Mobilna navigacija/ }).getByRole('button', { name: 'Kategorije', exact: true }).click()
  await page.getByRole('button', { name: 'Nova kategorija', exact: true }).click()
  const category = page.getByRole('dialog')
  await expect(category.getByRole('heading', { name: 'Nova kategorija', exact: true })).toBeFocused()
  await category.locator('summary').click()
  await expect(category.getByLabel('Pretraži ikone')).not.toBeFocused()
  await category.getByLabel('Naziv', { exact: true }).fill('Fokus kategorije')
  await category.getByRole('button', { name: 'Dodaj', exact: true }).click()
  await page.getByRole('button', { name: /^Fokus kategorije/ }).click()
  await page.getByRole('button', { name: 'Uredi kategoriju', exact: true }).click()
  await expect(category.getByRole('heading', { name: 'Uredi kategoriju', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Otvori pretragu', exact: true }).click()
  await expect(page.getByLabel('Pretraži sadržaj', { exact: true })).not.toBeFocused()
  await page.getByLabel('Pretraži sadržaj', { exact: true }).click()
  await expect(page.getByLabel('Pretraži sadržaj', { exact: true })).toBeFocused()
})

test('poveznica čuva odabrani tekst bez automatskog fokusa editora', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nova bilješka', exact: true }).click()
  await page.getByLabel('Naslov bilješke').fill('Poveznice bez zatvaranja')
  const body = page.getByRole('textbox', { name: 'Sadržaj bilješke' })
  await body.fill('Odabrani tekst')
  await body.press('Control+a')
  await page.getByRole('button', { name: 'Dodaj ili ukloni link' }).click()
  await expect(page.getByLabel('Adresa linka', { exact: true })).not.toBeFocused()
  await page.getByLabel('Adresa linka', { exact: true }).fill('https://example.com')
  await page.getByLabel('Adresa linka', { exact: true }).press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Dodaj ili ukloni link' })).toBeFocused()
  await expect(body.locator('a')).toHaveText('Odabrani tekst')
  await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com')
  await expect(body).not.toBeFocused()
  await body.click()
  await body.press('Control+a')
  await page.getByRole('button', { name: 'Dodaj ili ukloni link' }).click()
  await page.getByLabel('Adresa linka', { exact: true }).fill('')
  await page.getByRole('button', { name: 'Primijeni link', exact: true }).click()
  await expect(body.locator('a')).toHaveCount(0)
  await expect(body).toHaveText('Odabrani tekst')
  await page.getByRole('button', { name: 'Dodaj ili ukloni link' }).click()
  await page.getByLabel('Adresa linka', { exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Adresa linka', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toBeVisible()
})
