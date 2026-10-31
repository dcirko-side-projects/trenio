# Trenio

Osobni organizator za zadatke, ideje, bilješke i planove, prvenstveno za mobitel, uz sekundarni prikaz na laptopu. Prva verzija radi uz internet.

## Status

MVP, stack i implementacija odobreni su. Lokalni frontend povezan je s projektom `trenio`; stvarna prijava vlasnika, spremanje, arhiva i sukob između dvaju prikaza provjereni su. Izvoz i probni oporavak podataka prolaze. Aplikacija je objavljena na https://trenio.pages.dev/; korisnik je 28. 10. potvrdio četiri kruga na Samsungu Galaxy S25 Plus i laptopu. Paleta i PWA metapodaci su primijenjeni. Bez Supabase postavki otvara se jasno označen **probni prikaz u memoriji**; izmjene u njemu nestaju nakon osvježavanja.

Stack: React, TypeScript, Vite, Supabase, Tiptap, CSS i Lucide. Provjere: ESLint, Vitest, Playwright. Točne instalirane verzije zaključane su u package-lock.json.

## Lokalno pokretanje

Potreban je Node.js koji podržava Vite (20.19+ ili 22.12+); projekt je provjeren na Nodeu 24.22.0.

```powershell
npm ci
npm run dev
```

Otvori adresu koju Vite ispiše, uobičajeno http://127.0.0.1:5173. Probni prikaz ne zahtijeva račun ni bazu. Razvojni server sluša samo na lokalnom računalu; još nije dostupan fizičkom mobitelu putem mreže.

## Povezivanje Supabasea

Projekt `trenio` već je povezan lokalnim `.env` postavkama, sve migracije su primijenjene i stvarni vlasnički račun je dodijeljen. Koraci ispod služe za novu okolinu; početnu migraciju ne pokretati ponovno na postojećoj bazi.

1. Kreiraj novi Supabase projekt za Trenio. Lozinku baze spremi u upravitelj lozinki; nije potrebna u frontend aplikaciji.
2. U SQL Editoru primijeni redom `supabase/migrations/202610250001_initial.sql`, `supabase/migrations/202610280001_plans.sql`, `supabase/migrations/202610280002_ideas.sql`, `supabase/migrations/202610280003_linked_tasks.sql`, `supabase/migrations/202610280004_content_text.sql` i `supabase/migrations/202610280005_canonical_links.sql`, svaku jednom, na novom projektu.
3. U Authentication kreiraj vlasnički račun s emailom i lozinkom. Isključi javnu registraciju u postavkama Autha.
4. Kopiraj ID tog Auth korisnika i u SQL Editoru upiši stvarni UUID umjesto oznake ispod:

```sql
insert into private.app_owner (user_id) values ('OVDJE-UUID-VLASNIKA');
```

5. Kopiraj `.env.example` u `.env` i postavi projektni URL i javni **publishable** ključ. U frontend ne upisuj administratorski/secret/service-role ključ.

```powershell
Copy-Item .env.example .env
```

6. Ponovno pokreni razvojni server. Umjesto probnog prikaza prikazuje se prijava vlasnika.

Prije stvarnih bilješki provjeri spremanje i ponovno otvaranje na dva uređaja, zabranu pristupa drugom i neprijavljenom računu te odbijanje spremanja zastarjele verzije. Baza dopušta samo jednog vlasnika. Primjeri iz probnog prikaza ne prenose se automatski u bazu.

## Provjere i build

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:connected
npm run check:public-access
npm run build
npm run preview
```

Playwright koristi instalirani Microsoft Edge, automatski pokreće zaseban testni Vite server na portu 4185 i provjerava prikaze 320 px, 390 px i desktop. Konfiguracija isključuje Supabase varijable za taj server, tako da UI provjera koristi probne podatke i ne zapisuje u stvarnu bazu. Na sustavu bez Edgea instaliraj Playwright Chromium i prilagodi `channel` u konfiguraciji.

`npm run check:public-access` koristi lokalni `.env` i stvarni javni API, bez zapisivanja: provjerava odbijanje anonimnog pristupa tablicama i zabranu javne registracije. SQL provjera `supabase/tests/initial_security.sql` pokriva vlasnika, drugog korisnika, verzije i kategorije unutar transakcije koja se poništava; namijenjena je provjeri nove baze prije dodjele stvarnog vlasnika. Provedena je uspješno. Prijava stvarnog vlasnika i rad s podacima dodatno su provjereni kroz aplikaciju u dvije kartice; to nije provjera dvaju fizičkih uređaja.

`npm run test:connected` pokreće izolirani server na portu 4186 i presreće sve API pozive prema sintetičkom Supabase projektu. Provjerava spremanje i ponovno otvaranje, odbijanje zastarjele verzije, čuvanje unosa kod greške, poruku nakon uspješnog zapisa/neuspješnog dohvata i svježi izvoz s arhivom. Ne koristi stvarni vlasnički račun.

Build se nalazi u `dist/`. Preview nije produkcijski server. Manifest i ikone pripremljeni su za instalaciju aplikacije, uz isti projekt hostan na korijenskoj putanji `/`. Hosting i HTTPS su provjereni; korisnik je potvrdio instalaciju na Samsungu Galaxy S25 Plus. Offline uređivanje i predmemorija privatnih podataka nisu uvedeni.

## Produkcija i nove objave

Cloudflare Pages Direct Upload projekt `trenio` objavljen je na https://trenio.pages.dev/. Prijava, spremanje i arhiva provjereni su na produkciji. Usporedba planova i ograničenja nalazi se u `docs/TECHNICAL.md`. Provjereni postupak objave koristi postojeću Wrangler prijavu i prenosi samo produkcijski frontend:

```powershell
npm run build
npx --yes wrangler@4.154.0 pages deploy dist --project-name trenio --branch main
npm run check:release
npm run check:public-access
```

`check:release` provjerava HTTPS i jednakost svih objavljenih datoteka s lokalnim buildom. Prijava za objavu koristi OS spremište vjerodajnica; token ne spremati u projekt. Prenosi se samo `dist/`, bez `.env`, izvornog koda ili privatnih kopija. Dashboard Direct Upload ostaje alternativa.

Nakon objave provjeri HTTPS adresu, vlasničku prijavu i spremanje na oba uređaja, arhivu, izvoz i instalaciju na početni zaslon mobitela. Otvaranje mobilne tipkovnice i rad na dva fizička uređaja ostaju ručne provjere.

## Podaci i izvoz

Izbornik s tri točke dohvaća svježe podatke i priprema JSON izvoz formata 4 s vrstom bilješke/plana/ideje, uključujući arhivu, verziju formata i oznaku probnih podataka. Kod greške dohvata ili validacije ne stvara se prazna kopija. Datoteka sadrži privatni sadržaj pa je čuvaj na sigurnom mjestu odvojenom od uređaja na kojem radiš.

Za pripremu provjere oporavka koristi Node 24, na kojem je alat provjeren:

```powershell
npm run backup:prepare -- 'C:\putanja\trenio-kopija.json'
```

Alat provjerava format i veze pa izrađuje `.local/rehearse-recovery.sql`. Pokretanje tog SQL-a u Supabase SQL Editoru vraća sadržaj u privremene tablice, provjerava ga i poništava transakciju. Taj postupak uspješno je izveden sa stvarnim izvozom koji sadrži arhivu. Izvorne tablice ostaju nepromijenjene.

Za stvarno vraćanje u **prazan, već konfiguriran projekt**:

```powershell
npm run backup:prepare -- 'C:\putanja\trenio-kopija.json' --restore-empty
```

Nastaje `.local/restore-empty.sql`. Prije njegova ručnog pokretanja provjeri odredišni projekt i vlasnika. Skripta odbija neprazne tablice i ne briše ni prepisuje postojeće podatke. Stvarni oporavak u produkcijsku bazu nije izvođen; provjerena je njegova varijanta s privremenim tablicama. Korisnički datumi, arhiva, verzije i sadržaj se čuvaju; tehnička vremena nastanka redaka ponovno postavlja baza.

Mapa `.local/` isključena je iz verzioniranja. Generirani SQL također sadrži privatni sadržaj i ne treba ga dijeliti. Granica kopije u ovoj verziji je 10 MB. Automatski backup i uvoz kroz UI nisu uvedeni.

## Svakodnevno korištenje i završna korisnička provjera

Zadaci, bilješke, planovi, ideje, povezani zadaci i pretraga objavljeni su na istoj adresi aplikacije. Nakon nadogradnje ponovno učitaj stare otvorene kartice ili zatvori i ponovno otvori instaliranu aplikaciju prije rada s planovima i izvoza.

Plan se dodaje radnjom **Novi plan** u pregledu ili kategoriji. Naziv je dovoljan; tekst je slobodan, a naredba **Pretvori redak u korak plana** dodaje checkbox korak. Napredak se računa samo kada postoje koraci. Plan se može prikvačiti, arhivirati i vratiti, bez zasebne glavne navigacije. Spremljeni checkbox ili korak može izričito stvoriti povezani zadatak. Nakon objave nadogradnje ponovno učitaj stare otvorene kartice prije rada s planovima ili izvoza. Novi alat čita stare kopije formata 1, 2 i 3; oporavak zahtijeva sve migracije.

Aplikacija: https://trenio.pages.dev/. Koristi postojeći vlasnički račun. Danas uključuje današnje i ranije planirane zadatke te dospjele rokove; Trenutno prikazuje ručno prikvačene stavke. Dovršeni zadaci i ručno arhivirane bilješke nalaze se u arhivi. Brisanje kategorije čuva njezin sadržaj u Bez kategorije. Danas uvijek prati zonu Europe/Zagreb, i tijekom putovanja (potvrđeno 29. 10.). Ostala početna pravila ostaju dostupna za korisnički pregled.

Dogovorena rutina kopiranja (29. 10.): izvezi JSON jednom tjedno i prije većeg brisanja ili reorganizacije. Spremi ga na **privatni OneDrive → Trenio → Sigurnosne kopije**, bez dijeljenja mape. Fakultetski OneDrive se ne koristi. Čuvaj posljednjih 8 tjednih kopija i po jednu mjesečnu za posljednjih 6 mjeseci; stare kopije pregledavaj ručno, alat ih ne briše. Prvu kopiju validiraj, a probni oporavak provjeri svaka 3 mjeseca. Microsoft račun zaštiti provjerom u dva koraka; stanje te zaštite nije automatski provjereno.

Za sigurnu pohranu preuzetog izvoza na ovom laptopu koristi:

```powershell
npm run backup:store -- 'C:\putanja\trenio-2026-10-29.json'
```

Alat provjerava kopiju, odbija demo podatke, koristi isključivo `OneDriveConsumer`, dodaje naziv prema vremenu izvoza u Zagrebu i provjerava jednakost spremljenih bajtova. Ne prepisuje postojeću različitu datoteku, ne koristi fakultetski račun kao zamjenu i ne briše stare kopije. Prva svježa kopija provjerena je 29. 10.: preuzeta je s privatnog OneDrivea, validirana i potpuno se podudara s izvornim izvozom po SHA-256. Nakon svakog sljedećeg spremanja provjeri u OneDriveu da je datoteka sinkronizirana i vidljiva na webu/drugom uređaju: sama lokalna datoteka nije potvrda cloud kopije. Na mobitelu izvoz ručno prenesi u istu privatnu mapu. Automatski izvoz i podsjetnici nisu postavljeni.

Za Android Chrome otvori aplikaciju pa u izborniku odaberi instalaciju web aplikacije i prati prikazane korake. Google trenutno opisuje putanju More → Install and create shortcut → Install u [službenim uputama](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en), provjereno 27. 10. 2026. Nazivi ovise o jeziku i verziji preglednika. Instalacija ne dodaje offline uređivanje: Trenio i dalje traži internet.

Kada bude vrijeme za tvoj dio, dovoljno je proći ove provjere:

1. Na mobitelu dodaj zadatak samo s nazivom i bilješku s checkboxom. Provjeri hrvatska slova, otvaranje tipkovnice, pomicanje obrasca i dosezanje gumba Spremi.
2. Otvori iste stavke na laptopu; izmijeni ih pa se vrati u mobilnu aplikaciju. Provjeri da se prikazuje novija verzija i da otvoreni nespremljeni tekst ostaje sačuvan.
3. Na oba uređaja otvori istu bilješku. Spremi promjenu na jednom, zatim pokušaj spremiti staru verziju na drugom. Očekuje se upozorenje i očuvan lokalni unos.
4. Instaliraj aplikaciju na početni zaslon, zatvori je i ponovno otvori. Provjeri ikonu, izgled, prijavu i unos; provjeri i ponašanje nakon povratka iz druge mobilne aplikacije.
5. Ocijeni odgovaraju li ti kategorije, Danas/Trenutno, arhiva, početna pravila i brzina unosa. Za problem zabilježi uređaj, preglednik, korake, očekivano i dobiveno ponašanje; bez lozinke ili privatnog sadržaja.

## Dokumentacija

- [Pravila rada](AGENTS.md)
- [Proizvod i MVP](docs/PRODUCT.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Tehnička arhitektura](docs/TECHNICAL.md)
- [Redoslijed razvoja](docs/ROADMAP.md)
- [Trenutačno stanje](docs/CURRENT_STATE.md)

Ideju dodaj radnjom **Nova ideja**, uz naziv i opcionalni opis/kategoriju. Pronađi je u **Kategorije → odabrana kategorija → Ideje**, odnosno **Bez kategorije** ako kategorija nije odabrana. U Danas se ideje ne prikazuju; u Trenutno se prikazuju samo prikvačene. Ako sadržaj nije vidljiv u Pregledu nakon spremanja, potvrda pokazuje kategoriju i gumb za njezino otvaranje. Nakon spremanja radnja **Pretvori u plan** čuva isti zapis i sav opis, uključujući izmjene unesene prije pretvorbe. Ideja se može prikvačiti, arhivirati i vratiti. Nakon nadogradnje ponovno učitaj otvorenu aplikaciju prije rada s idejama ili izvoza.

Povezivanje: spremi plan/bilješku s checkboxom pa u odjeljku **Zadaci iz checkboxa** odaberi **Stvori povezani zadatak** uz željeni redak. Radnja sprema i trenutačne izmjene izvora. **Otvori povezani zadatak** i **Otvori izvor** vode na isti par zapisa. Naslov zadatka možeš uređivati zasebno. Promjena checkboxa sinkronizira zadatak pri spremanju; dovršavanje/vraćanje zadatka odmah ažurira izvor i napredak. Uklanjanje checkboxa ili izvora ostavlja zadatak; brisanje zadatka ostavlja lokalni checkbox s posljednjim stanjem.

Pretraga: otvori povećalo uz naslov. Pretražuju se nazivi, tekst sadržaja i kategorije bez razlikovanja velikih slova i dijakritike. Arhiva je zadano isključena; uključi **Uključi arhivu** za dovršene i arhivirane stavke. Rezultati iz arhive imaju oznaku Arhivirano. Nakon nadogradnje ponovno učitaj sve otvorene kartice i PWA prije uređivanja ili izvoza. Fizička provjera novih veza/pretrage još nije provedena.

Za završnu provjeru novih mogućnosti na Samsungu i laptopu ponovno učitaj aplikaciju, spremi neprikvačenu ideju i otvori je gumbom iz potvrde. Pretvori je u plan s korakom, poveži korak sa zadatkom te provjeri dovršavanje i vraćanje u oba smjera. Potraži sadržaj bez dijakritike i provjeri uključivanje arhive. Otvaranje tipkovnice, pomicanje editora i pristup gumbu Spremi treba potvrditi na fizičkom mobitelu; automatizirani testovi to ne zamjenjuju.
