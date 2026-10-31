# Trenio — pravila rada

Trenio je osobni organizator za jednog primarnog korisnika. Mobitel je primarni uređaj; laptop je sekundarni prikaz. Prednost imaju jednostavnost, brz unos i pregledno sučelje.

## Čitanje i autoritet

- Prati izričite upute korisnika. Prijedlog u dokumentaciji nije odobrena odluka.
- Na početku rada pročitaj `docs/CURRENT_STATE.md` i relevantni dio `docs/PRODUCT.md`.
- Za tehničke promjene pročitaj relevantni dio `docs/TECHNICAL.md`; za UI i `docs/DESIGN_SYSTEM.md`.
- Redoslijed rada prati `docs/ROADMAP.md`. Ne čitaj ponovno cijelu dokumentaciju za sitnu izmjenu.
- Sukob koji bitno mijenja opseg, sigurnost ili model podataka iznesi korisniku prije provedbe.

## Granice i način rada

- Korisnik je 25. 10. 2026. odobrio početni MVP, React + TypeScript + Vite + Supabase i početak implementacije. Nastavi unutar tog opsega bez ponovnog traženja istog odobrenja.
- Prije izmjene pregledaj postojeći kod, komponente i obrasce. Radi male, povezane promjene.
- Ne uvodi funkcionalnosti, biblioteke ni infrastrukturu bez stvarne potrebe.
- Domenska pravila i pristup podacima odvoji od prikaznih komponenti, bez suvišnih slojeva.
- Ne spremaj tajne u repozitorij niti privatni sadržaj u logove.
- Prije destruktivnih migracija ili nepovratnog brisanja provjeri utjecaj i traži odobrenje.

## Provjere i dokumentacija

- Provjeri izmijenjeno ponašanje i važne rubne slučajeve. Testiraj datume, arhivu, povezivanje i prava pristupa kada ih mijenjaš.
- Pokreni relevantne testove, lint, provjeru tipova i build kada postoje. Nepokrenute provjere jasno označi.
- UI provjeri na mobitelu i laptopu, uključujući tipkovnicu, prazne prikaze i greške spremanja.
- Ažuriraj dokumentaciju kada se značajno promijene ponašanje, tehničke odluke ili status.
- `PRODUCT.md` opisuje proizvod, `TECHNICAL.md` tehniku, `DESIGN_SYSTEM.md` sučelje, `ROADMAP.md` redoslijed, a `CURRENT_STATE.md` provjereno stanje.
- Ne stvaraj dodatne MD dokumente bez konkretne potrebe. Ne tvrdi da nešto radi ako nije provjereno.
