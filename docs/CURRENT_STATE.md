# Trenio — trenutačno stanje

Ažurirano: 31. 10. 2026.

## Checkbox unos i ručno proširivanje kategorija — 31. 10. 2026.

- Korisnik ponovno prijavljuje povremeno uključivanje velikih slova pri tipkanju uz checkbox. Editor sada koristi `autocapitalize=off` umjesto `sentences`, za bilješke, planove i ideje. Provjera pravopisa i ručni Shift ostaju dostupni. To uklanja aplikacijski zahtjev za automatskom kapitalizacijom; fizička Samsung tipkovnica nije dostupna za konačnu potvrdu otklanjanja simptoma.
- Popis Kategorije počinje sa sažetim podkategorijama. Korisnik ih otvara i zatvara zasebnom strelicom; povratak u popis ponovno počinje sa sažetim podkategorijama. Otvaranje roditelja i pristup njegovu sadržaju ostaju zasebne radnje.
- Prolaze lint, TypeScript/build, 25 domenskih testova, 54 UI provjere na 320/390/1366 px i 16 izoliranih API/UI provjera. Provjereni su početno sažimanje, ručno proširivanje mišem i tipkovnicom, povratak u popis, atribut kapitalizacije nakon ponovnog otvaranja te stabilnost fokusa/kursora i unos više checkboxova. Mobilni i desktop prikazi kategorija/editora vizualno su pregledani. Prvi sandbox pokušaji nisu imali pristup lokalnom serveru; provjere ponovljene s potrebnim pristupom prolaze.
- Objavljeno na https://trenio.pages.dev/, deployment https://28c5f55c.trenio.pages.dev/. HTTPS usporedba svih 8 datoteka s buildom prolazi; glavni JS `index-faTgK1O_.js`, editor `NoteEditor-DGk3qkNV.js`. Baza i korisnički sadržaj nisu mijenjani.

## Objavljena hijerarhija i odobreno čišćenje — 30. 10. 2026.

- Korisnik je izričito odobrio produkcijsku transakcijsku vježbu, migraciju i objavu te zatražio brisanje postojećih stvari iz aplikacije. Opseg čišćenja obuhvatio je sve kategorije, zadatke, bilješke, planove i ideje, uključujući arhivu; Auth račun i vlasništvo su sačuvani.
- Prije brisanja preuzet je novi izvoz u `.local/trenio-prije-brisanja-2026-10-30.json`, validiran: 10 kategorija, 8 zadataka i 10 zapisa sadržaja. To je lokalna kopija, bez automatskog slanja na OneDrive.
- Produkcijska migracijska vježba prošla je uz ROLLBACK i potvrdu `migration_rehearsal_passed = true`, `existing_data_preserved = true`. Migracija `202610300001_category_hierarchy.sql` zatim je trajno primijenjena, uz potvrđeno očuvanje svih izvornih podataka. Prvi unos trajnog upita u web SQL editoru zadržao je dio prethodnog dokumenta te je odbijen sintaksnom greškom prije izvođenja; cijeli je dokument potom zamijenjen preko select-all/paste, pročitan kroz clipboard i uspoređen s pripremljenim SQL-om prije uspješne primjene.
- Wrangler 4.154.0 objavio je frontend na https://trenio.pages.dev/, deployment https://5d3a283f.trenio.pages.dev/. Svih 8 HTTPS datoteka odgovara lokalnom buildu. Glavni JS `index-BlcLCLqP.js`, editor `NoteEditor-CS4HwT0R.js`, CSS `index-ZMs_3SPm.css`.
- Na stvarnoj bazi prošla je dodatna transakcijska provjera: vlasnički zapis, ikone i boje, redoslijed djece, premještanje, zabrana treće razine, odbijanje zastarjele verzije, očuvanje sadržaja pri brisanju roditelja/podkategorije te zabrana drugom i anonimnom korisniku. Sve testne promjene te provjere poništene su ROLLBACK-om. Javni API vraća 401 za sve tri tablice; registracija i anonimna prijava ostaju isključene.
- Stvarni frontend potvrdio je novu kategoriju s ikonom Posao i plavom bojom na prvom mjestu, podkategoriju, prikvačeni plan s dva checkboxa i napretkom 1/2, povezani zadatak i očuvanje svega nakon osvježavanja. Izvoz formata 5 `.local/trenio-hijerarhija-produkcija-2026-10-30.json` potvrđuje roditelja, ikonu/boju/redoslijed, kategoriju plana, checked i taskId. Usporedba je potvrdila da izvorni zadaci i sadržaj nisu promijenjeni prije odobrenog brisanja.
- Nakon testova obrisano je svih 12 kategorija, 9 zadataka i 11 zapisa sadržaja (uključujući 2 kategorije, 1 zadatak i 1 plan iz provjere). Brisanje je bilo atomsko, ograničeno na vlasnika i zaštićeno provjerom broja zapisa prema prethodno validiranom izvozu. SQL potvrđuje `categories_remaining = 0`, `tasks_remaining = 0`, `content_remaining = 0`, `owner_preserved = true`. Nije brisan račun, shema, pristup ni sigurnosne kopije.
- Aplikacija nakon osvježavanja potvrđuje prazne Kategorije, Trenutno, Arhivu i pretragu s uključenom arhivom. Završni izvoz `.local/trenio-nakon-ciscenja-2026-10-30.json` validiran je kao format 5 s praznim zbirkama. Snimka produkcije: `.local/trenio-clean-production-2026-10-30.jpg`. U otvorenom SQL editoru destruktivni upit zamijenjen je sigurnim SELECT-om brojeva zapisa.
- Nova verzija je objavljena i aplikacija je spremna za unos novih podataka. Fizička Samsung tipkovnica nije ponovno testirana; povremeni Caps problem ostaje provjera na uređaju, bez tvrdnje da ga automatizacija može konačno potvrditi.

## Povijest lokalne pripreme — 30. 10. 2026. (naknadno objavljeno iznad)

- Korisnik je zatražio dvije razine kategorija, ikone/boje, redoslijed, premještanje sadržaja, pregled checkboxova i cjelovit QA. Implementirani su roditelji/podkategorije, sažimanje/proširivanje, uređivanje roditelja i redoslijeda te pretraživ birač 16 Lucide ikona sa 6 prigušenih boja. Iste oznake koriste popisi, podkategorije, pretraga i metapodaci. Obrasci sadržaja prikazuju puni put kategorije; premještanje čuva ID, arhivu, prikvačivanje i veze.
- Brisanje roditelja čuva djecu kao samostalne kategorije; samo njegov izravni sadržaj prelazi u Bez kategorije. Sudar naziva dobiva kratak ID dodatak. Duplikati naziva dopušteni su pod različitim roditeljima. Novi ekran vraća pomicanje na vrh i fokus na naslov; pretraga zadržava fokus polja.
- Editor sada ima stabilan početni dokument, proširenja i editorProps. Alatna traka pri dodiru ne oduzima fokus aktivnom editoru. Ostaje normalna kapitalizacija rečenica, bez isključivanja mobilnih jezičnih mogućnosti. Instrumentirani testovi potvrđuju nula poziva setOptions i nula blur događaja pri unosu/pretvaranju checkboxova; DOM i položaj teksta ostaju stabilni. Izvorni povremeni Caps problem Samsung tipkovnice nije reproduciran na fizičkom uređaju i ne proglašava se konačno potvrđeno riješenim.
- Dodatno je ispravljen naslijeđeni taskId pri Enteru u povezanom checkboxu (`keepOnSplit: false`). Za kategorije se očekivana verzija pamti pri otvaranju obrasca, pa osvježavanje u pozadini ne može omogućiti prepisivanje novijeg naziva starim nacrtom.
- Migracija `202610300001_category_hierarchy.sql` je pripremljena, ali NIJE primijenjena na produkciji. Dodaje roditelja, ikonu, boju, redoslijed i verzije; ograničava dubinu i vlasništvo, serijalizira operacije postojećim graph lockom te uvodi atomski `save_category`. Prethodno primijenjene migracije nisu mijenjane.
- Format kopije 5 čuva novu strukturu; parser prihvaća stare formate 1–4. Oporavak zahtijeva i novu migraciju. Svježi izvoz postojeće produkcije preuzet je u `.local/trenio-prije-hijerarhije-2026-10-30.json` i validiran. Kopija sadrži 10 kategorija, 8 zadataka i 10 zapisa sadržaja. Nije poslana drugom servisu ni automatski spremljena na OneDrive.
- Provjere: ESLint i TypeScript/build prolaze; 25 Vitest testova, 54 UI provjere na 320/390/1366 px i 16 izoliranih API/UI provjera prolaze. Nakon posljednje zaštite verzije dodatno je ponovljeno svih 12 novih UI provjera i 16 API/UI provjera. Vizualni pregled i odsustvo horizontalnog prelijevanja obuhvaćaju 320/390/800/1366 px, uključujući novi obrazac i editor. Snimke su u `.local/ui-review/`.
- U izoliranom PostgreSQL/PGlite okruženju prošlo je svih 7 migracija i 5 SQL skripti (početna sigurnost, planovi, ideje, veze, hijerarhija). Postojeća produkcijska kopija učitana je u staru shemu, zatim nadograđena i uspoređena: postojeći podaci ostaju jednaki. Prošli su oporavak hijerarhijske kopije u privremenim tablicama i praznoj izoliranoj bazi te oporavak stvarne kopije u izoliranim privremenim tablicama. PGlite je samo privremeni lokalni testni alat u ignoriranoj `.local/sql-validation/`; nema novih projektnih ovisnosti ni infrastrukture.
- Produkcijska transakcijska vježba zaustavljena je prije izvođenja: automatska provjera odobrenja odbila je potvrdu SQL DDL-a na postojećoj bazi, unatoč planiranom ROLLBACK-u. Potrebno je izričito odobrenje za tu konkretnu vježbu, primjenu migracije i objavu frontenda. U SQL editoru ostala je pripremljena vježba s usporedbom postojećih podataka i ROLLBACK-om; upozorenje je otkazano. Produkcija i dalje koristi prethodni frontend i shemu. Provjera novog stvarnog spremanja i nove produkcijske objave nije izvedena. Fizička Samsung tipkovnica ostaje otvorena provjera.

## Sažetak prethodno objavljenog stanja — 29. 10.

- Početni MVP, planovi, ideje, povezani zadaci i pretraga su završeni i objavljeni. Završni UI i dorada pronalaženja spremljenog sadržaja objavljeni su kao `74ef153f`; svih 8 datoteka odgovara lokalnom buildu preko HTTPS-a.
- Korisnik je 29. 10. izričito odobrio objavu i nastavak preostalih poslova unutar dogovorenog proizvoda. Danas uvijek prati Europe/Zagreb, i tijekom putovanja.
- Korisnik je zatim prihvatio privatni OneDrive i ručnu rutinu kopiranja; pohrana i preuzimanje iz oblaka potvrđeni su u posljednjem odjeljku. Automatizirani backup nije uveden.
- Na fizičkom Samsungu preostaje korisnička provjera novih ideja/planova/veza/pretrage i nove UI dorade, uključujući tipkovnicu. Četiri potvrđena kruga odnose se na početni MVP. Sadašnja produkcijska kartica nema aktivnu prijavu; novo stvarno spremanje u ovoj završnoj provjeri nije izvedeno.
- Povijesne bilješke ispod opisuju redoslijed rada; starije rečenice o sljedećim fazama zamjenjuje ovaj sažetak i posljednji odjeljak.

## Potvrđeno

- Naziv Trenio; mobitel je primarni uređaj, laptop sekundarni.
- Početna verzija radi uz internet.
- Korisnik je odobrio MVP, React + TypeScript + Vite + Supabase i početak implementacije.
- Korisnik je odobrio pristup prijavljenoj Supabase nadzornoj ploči i pripremu projekta. Izrađena je osobna organizacija Trenio na Free planu; obrazac projekta `trenio` pripremljen je za Europe, s Data API-jem, automatskim RLS-om i bez automatskog izlaganja novih tablica.
- Supabase projekt `trenio` (`rjjcdcksipfiwhyuxsyl`, eu-west-1) provjeren je u nadzornoj ploči i aktivan je. Uz izričito odobrenje korisnika primijenjena je početna migracija.
- Lokalni `.env` povezuje projektni URL i postojeći javni publishable ključ; datoteka je isključena iz verzioniranja. Administratorski ključ i lozinka baze nisu korišteni.
- Javna registracija je isključena. Korisnik je kreirao Auth račun; uz njegovu izričitu potvrdu postavljen je kao jedini vlasnik u `private.app_owner`. SQL je potvrdio `owner_configured = true`. Lozinka aplikacije nije zatražena niti pohranjena u repozitoriju.
- Prema korisnikovoj doradi `#03313A` je dominantna pozadina aplikacije, a `#8FFFE0` koristi se samo za male naglaske. Tamna tema primijenjena je na navigaciju, obrasce, dijaloge i PWA pozadinu.
- Korisnikov nalog „Kreni dalje” 27. 10., nakon preporuke hostinga, nastavljen je kao odobrenje objave na Cloudflare Pages Free. Nakon korisničke prijave objavljen je Direct Upload projekt `trenio`: https://trenio.pages.dev/. Početni deployment: `598bc3fa-cc68-4684-a39f-29f557ac197c`.

## Implementirano

- React/TypeScript/Vite projekt, zaključane ovisnosti, ESLint, Vitest i Playwright.
- Mobilna donja navigacija, desktop bočna navigacija i Danas/Trenutno.
- Dodavanje, uređivanje i brisanje zadataka; planirani dan i rok; prikvačivanje, dovršavanje, arhiva i vraćanje.
- Stvaranje, preimenovanje i brisanje kategorije uz očuvanje sadržaja u Bez kategorije.
- Tiptap bilješke s formatiranjem, listama, linkovima, pretvaranjem retka u checkbox, prikvačivanjem i arhiviranjem.
- Izvoz JSON podataka uključujući arhivu. Probni prikaz označen je kao demo, bez trajnog spremanja.
- Obrazac prijave i povezan Supabase klijent. Početna migracija ručno je primijenjena kroz SQL Editor: samo vlasnik, RLS na aplikacijskim tablicama i privatnoj tablici vlasnika, verzije zapisa, atomsko brisanje kategorije. Ne pokretati je ponovno na istoj bazi.
- Editor se učitava zasebno radi manjeg početnog preuzimanja.
- Manifest za samostalan prikaz, favicon i PNG ikone 192/512 px pripremljeni su za PWA instalaciju. Aplikacija i dalje traži internet; offline uređivanje i predmemorija podataka nisu uvedeni.
- Ispravljena je poruka nakon uspješnog zapisa i greške naknadnog dohvata: upozorenje o neosvježenom prikazu ostaje vidljivo.
- Izvoz ponovno dohvaća podatke iz baze i provjerava format, datume, identifikatore, veze kategorija i sadržaj bilješki prije preuzimanja. Greška dohvata ne stvara praznu kopiju.
- Dodani su validacija kopije i alat `npm run backup:prepare`: zadano priprema SQL za probni oporavak u privremenim tablicama; stvarni oporavak moguć je samo u praznom prostoru. Privatne datoteke ostaju u ignoriranoj mapi `.local/`.
- Checkboxi u editoru pravilno su poravnati s tekstom i u Tiptapovu aktivnom prikazu.
- Dijalozi zadatka, bilješke i kategorije imaju pristupačne nazive. Pri otvaranju zadatka/kategorije fokus postavlja polje naziva nakon otvaranja modalnog dijaloga.
- Upozorenje o prekidu veze prikazuje se i unutar otvorenog editora/kategorije, gdje ga modalni dijalog ne skriva.
- Pripremljeni su usporedba službenih besplatnih planova i upute za Direct Upload. Na Cloudflare Pages preneseno je svih 8 datoteka iz `.local/trenio-web.zip`, koji sadrži samo produkcijski frontend.

## Provjereno

- Build i TypeScript: prolaze; produkcijski build izrađen.
- ESLint: prolazi.
- Vitest: 13 testova prolazi (datumi, aktivni zadaci, sigurni URL protokoli, izvoz, validacija kopije i priprema oporavka).
- Playwright: 27 provjera prolazi (9 tokova na 320 px, 390 px i desktopu): zadaci/arhiva, bilješke/checkboxi, kategorije/očuvanje sadržaja, nespremljeni unos te nazivi dijaloga, početni fokus, modalnost, Tab/Shift+Tab, Escape i povratak fokusa.
- Vizualno pregledane mobilna i desktop snimka Pregleda.
- Na stvarnoj bazi prošao je `supabase/tests/initial_security.sql`: vlasničko čitanje/pisanje, izolacija privatne tablice, zabrana drugom i neprijavljenom korisniku, odbijanje zastarjelih verzija zadatka i bilješke, zabrana veze s tuđom kategorijom i očuvanje sadržaja pri brisanju kategorije. Sve privremene testne izmjene poništene su transakcijom.
- `npm run check:public-access` prolazi protiv stvarnog API-ja: anonimni dohvat sve tri tablice vraća HTTP 401, javna registracija i anonimna prijava su isključene.
- Stvarna vlasnička prijava potvrđena je kroz aplikaciju. Zadaci i bilješke s checkboxima ostaju spremljeni nakon osvježavanja i u drugoj kartici iste korisničke sesije.
- E2E server izričito isključuje Supabase konfiguraciju; probni testovi su izolirani od stvarne baze.
- Pet dodatnih provjera kroz izolirane, presretnute API odgovore prolazi: ponovno otvaranje i sukob verzija, greška naknadnog dohvata, ponovni pokušaj zapisa, svježi izvoz s arhivom i zabrana prazne kopije kod greške dohvata.
- Na stvarnoj vlasničkoj sesiji potvrđeno je odbijanje zastarjele izmjene iz druge kartice uz očuvan unos. Novija verzija ostaje u bazi. Potvrđeni su dovršavanje, vraćanje zadatka i ručna arhiva bilješke.
- Preuzet je stvarni izvoz s arhiviranim probnim zadatkom i bilješkom. Oporavak je uspješno provjeren u privremenim tablicama iste baze, uključujući sadržaj, korisničke datume, arhivu i verzije, zatim je transakcija poništena. Izvorni podaci nisu zamijenjeni.
- Dvije probne stavke sačuvane su u arhivi, bez trajnog brisanja. Kartica za dodatnu provjeru može se zatvoriti; osnovna prijava ostaje aktivna.
- Nova paleta vizualno je pregledana na mobilnoj i desktop snimci; provjereni su glavni kontrasti. PNG ikone provjerene su kao stvarni PNG-ovi veličine 192/512 px i putanje manifesta postoje.
- Ponovno 27. 10.: lint, TypeScript/build, 13 Vitest testova, 15 UI provjera i 6 izoliranih API/UI provjera prolaze. Šesta izolirana provjera obuhvaća stvarni browser offline/online događaj, simuliranu grešku zapisa, očuvan unos i uspješan ponovni pokušaj bez duplikata. To nije provjera fizičke mobilne mreže.
- Ponovljena provjera stvarnog javnog API-ja prolazi: sve tri tablice vraćaju HTTP 401, registracija i anonimna prijava ostaju isključene. Vizualno pregledane nove snimke Pregleda i dijaloga zadatka na mobitelu i desktopu.

## Tehnički pregled prije korisničkog testiranja — 27. 10.

- Ispravljeno je zaključavanje tipkovničkog unosa u bilješku tijekom spremanja i ponovno omogućavanje nakon greške. Aktivna stanja formatiranja sada prate i promjene položaja kursora/tipkovničke prečace.
- Povratak u vidljivu aplikaciju ponovno dohvaća podatke, uz očuvan otvoreni unos. Greška dohvata nakon uspješnog zapisa kategorije ili brisanja ostavlja upozorenje da prikaz nije osvježen.
- Ispravljen je prijelom dugih naziva kategorija u popisu, naslovu i metapodacima zadatka; vizualno pregledana snimka 320 px.
- Prolaze lint, TypeScript/build, 13 domenskih testova, 27 UI provjera (9 tokova na tri širine) i 10 izoliranih API/UI provjera. Posljednja CSS dorada dodatno je potvrđena trima ciljanim provjerama dugih naziva. Javni API i dalje odbija anonimni pristup; `npm audit --omit=dev` ne nalazi poznate ranjivosti produkcijskih ovisnosti na dan provjere.
- Dodatno su pokriveni zagrebačka ponoć bez promjene korisničkih datuma, očuvanje bilješke nakon brisanja kategorije, povratak arhivirane bilješke, formatiranje tipkovnicom, odbijanje nesigurnog linka, sporo/neuspješno spremanje i sukob verzija bilješke te povratak u vidljivu aplikaciju.
- README sadrži upute za korištenje/Android instalaciju, prijedlog rutine kopiranja i pet kratkih korisničkih provjera. Učestalost i odredište kopija ostaju prijedlog; automatizacija kopiranja nije uvedena.
- Konačni build objavljen je na istoj produkcijskoj adresi; svih 8 datoteka odgovara lokalnom buildu preko HTTPS-a. Glavni JS je `index-Dg__2SrY.js`, editor `NoteEditor-E7A701tx.js`, CSS `index-D_V7Z3BI.css`. U prijavljenoj produkciji potvrđeni su dohvat i otvaranje/zatvaranje bilješke bez lažnih nespremljenih promjena. Postojeći sadržaj nije mijenjan tijekom ovog pregleda.
- Preuzet je svježi produkcijski izvoz i spremljen u `.local/trenio-prije-korisnickog-testa-2026-10-27.json`. Kopija prolazi validaciju; `.local/provjera-kopije-prije-testa.sql` pripremljen je za oporavak u privremenim tablicama. Novi SQL nije izveden na bazi; ranija stvarna vježba oporavka ostaje dokumentirana provjera. Ova lokalna kopija još nije kopija na zasebnom uređaju.

## Preostalo do svakodnevnog korištenja

Korisnička provjera 28. 10.: korisnik je potvrdio sva četiri kruga na Samsungu Galaxy S25 Plus i laptopu: zadaci i sinkronizacija, bilješke i checkboxi, zaštita od istodobnih izmjena te instalacija/pokretanje s početnog zaslona, kategorije i arhiva. Preglednik nije naveden. Nakon uspješne provjere zatražio je nastavak razvoja.

Produkcija 27. 10.: Cloudflare potvrđuje uspješan deployment. Svih 8 javnih datoteka vraća HTTPS 200 i sadržajem odgovara lokalnom buildu (HTML, CSS, glavni JS, editor, manifest i tri ikone). Ekran prijave nema konzolnih grešaka. Korisnik se prijavio; potvrđeni su stvarni dohvat, spremanje i trajnost zadatka te bilješke s označenim checkboxom nakon osvježavanja. Probni zadatak je dovršen, bilješka ručno arhivirana; obje nove stavke ostaju u arhivi uz dvije ranije probne stavke.

1. Četiri korisnička kruga MVP-a su prošla. Sva proširenja su objavljena; preostaje fizička korisnička provjera novih tokova i UI dorade.
2. Danas i putovanja potvrđeni su 29. 10.: uvijek Europe/Zagreb. Ostala početna pravila dostupna su za završnu korisničku ocjenu.
3. Odredište kopija korisnik 29. 10. namjerno ostavlja otvorenim; učestalost ostaje prijedlog. Automatski backup i uvoz kroz UI nisu uvedeni. Stvarno vraćanje u praznu produkcijsku bazu nije izvedeno.

## Planovi — razvoj 28. 10.

- Implementirani su i objavljeni planovi s tekstom i opcionalnim checkbox koracima, napredak prema označenim koracima (bez postotka kada nema koraka), kategorije, prikvačivanje, arhiva i vraćanje. Nema nove glavne navigacijske destinacije. Korak još ne stvara zaseban zadatak.
- Pripremljena je aditivna migracija `202610280001_plans.sql`: dodaje `notes.kind` (`note`/`plan`), uz zadano `note` za postojeće bilješke i postojeće RLS/verzije.
- Izvoz prelazi na format 2 kako stariji alat ne bi tiho izgubio vrstu plana. Novi parser prihvaća i format 1 kao bilješke; oporavak formata 2 čuva vrstu, sadržaj i kategoriju i zahtijeva obje migracije.
- Lint, TypeScript/build i 16 domenskih testova prolaze. Prošlo je 27 postojećih UI provjera te 3 nove ciljane provjere planova na mobilnim/desktop širinama nakon ispravka testnog selektora. Svih 11 izoliranih API/UI provjera prolazi. Mobilna i desktop snimka planova vizualno su pregledane.
- `supabase/tests/plans.sql` prošao je na stvarnoj bazi u vježbi migracije i nakon trajne primjene: vlasnički zapis, verzije, očuvanje plana pri brisanju kategorije i odbijanje nepoznate vrste. Testni sadržaj je poništen ROLLBACK-om.
- Migracija je primijenjena. SQL potvrđuje `plans_enabled = true` i `existing_notes_preserved = true`. Javni API i dalje odbija anonimni pristup; registracija i anonimna prijava ostaju isključene.
- Prije migracije preuzet je i validiran svježi izvoz u `.local/trenio-prije-planova-2026-10-28.json`. Vježba oporavka tog sadržaja s dodanim sintetičkim arhiviranim planom prošla je u privremenim tablicama stvarne baze, uključujući vrstu, korake, verziju i arhivu, uz ROLLBACK. Izvorni podaci nisu zamijenjeni.
- Frontend je objavljen službenim alatom Wrangler 4.154.0 na https://trenio.pages.dev/; deployment https://8ce9a58d.trenio.pages.dev/. Svih 8 datoteka potvrđeno je preko HTTPS-a i odgovara provjerenom buildu. Web Direct Upload je ranije zapeo na 0/8; CLI objava uspjela je.
- Korisnik je izričito odobrio Wrangler OAuth: čitanje računa/korisnika, Pages write i pohranu tokena u Windowsovo spremište vjerodajnica. Za to je izvan projekta dodan `@napi-rs/keyring` 1.3.0; projektne ovisnosti nisu promijenjene. `.wrangler/` je ignoriran, vjerodajnice nisu zapisane u repozitorij.
- Na produkciji su potvrđeni izrada i spremanje plana, ponovni dohvat nakon osvježavanja, prikvačivanje, odsutnost napretka bez koraka, napredak 1/2 (50%) i 2/2 (100%), arhiviranje i vraćanje. Jedan jasno označeni probni plan sačuvan je u arhivi.
- Svježi produkcijski izvoz formata 2 validiran je i spremljen u `.local/trenio-planovi-produkcija-2026-10-28.json`. Čuva vrstu plana, arhivu, verziju i dovršene korake. Njegov oporavak uspješno je provjeren na stvarnoj bazi u privremenim tablicama uz ROLLBACK, bez zamjene izvornika.

Ideje su završene u nastavku ispod; povezivanje koraka sa zadacima i pretraga slijede. Probni prikaz nije trajno spremište osobnih podataka.

## Ideje — objavljeno 28. 10.

- Dodane su ideje s nazivom, opcionalnim formatiranim opisom i kategorijom, bez datuma. Podržane su sekcije u kategoriji/Trenutno/Arhivi, prikvačivanje, arhiva i vraćanje. Nema nove glavne navigacije.
- Spremljena ideja može se pretvoriti u plan jednim UPDATE-om istog ID-a uz provjeru verzije. Čuvaju se i otvorene izmjene; greška ne mijenja vrstu nacrta i ostavlja ponovni pokušaj. Zastarjela pretvorba ne prepisuje noviji zapis.
- Primijenjena je `202610280002_ideas.sql` nakon transakcijske vježbe. Proširuje dopuštene vrste bez mijenjanja postojećih podataka/RLS-a. `supabase/tests/ideas.sql` prolazi u vježbi i nakon primjene: vlasnički pristup, očuvanje identiteta/opisa/kategorije/arhive/prikvačivanja, verzije i očuvanje ideje nakon brisanja kategorije. Testni podaci poništeni su ROLLBACK-om.
- Izvoz je format 3; novi alat prihvaća stare formate 1/2. Ideja u formatu 2 odbija se kako se ne bi izgubila vrsta. Oporavak novim alatom zahtijeva sve tri migracije.
- Prolaze lint, TypeScript/build, 17 Vitest testova, 33 UI provjere na 320/390 px i desktopu te 13 izoliranih API/UI provjera. Dodatno su provjereni naslov bez opisa/datuma, arhiva/vraćanje/pretvorba, očuvanje nespremljenog opisa, kategorije, isti ID i jedan zapis nakon ponovnog pokušaja te odbijanje zastarjele pretvorbe. Mobilna i desktop snimka vizualno su pregledane; podnožje radnji prelama se na uskom zaslonu.
- Javni API nakon migracije odbija anonimni pristup sve tri tablice HTTP-om 401; registracija i anonimna prijava ostaju isključene. Prvi pokušaj te provjere nije imao mrežni pristup u sandboxu (HTTP 0); ponovljena odobrena mrežna provjera prolazi.
- Objavljeno Wranglerom na https://trenio.pages.dev/, deployment https://d994e9fa.trenio.pages.dev/. Svih 8 HTTPS datoteka odgovara lokalnom buildu: glavni JS `index-MzrkpVLv.js`, editor `NoteEditor-CJrSMSAx.js`, CSS `index-Ki-ZMWNX.css`.
- Na produkciji su potvrđeni spremanje ideje, ponovni dohvat, prikvačivanje, kategorija i pretvorba u plan. Izvozi prije/poslije potvrđuju isti ID, naslov, opis, kategoriju i prikvačivanje, bez duplikata, te porast verzije pri pretvorbi/arhiviranju. Usporedba s kopijom prije migracije potvrđuje da postojeći zadaci, bilješke, planovi i kategorije nisu promijenjeni. Jasno označena nova probna stavka „Provjera ideja 28. 10. 2026.” ostaje arhivirana kao plan.
- Prije migracije preuzet je `.local/trenio-prije-ideja-2026-10-28.json`. Produkcijski izvozi `.local/trenio-ideja-prije-pretvorbe-2026-10-28.json` i `.local/trenio-ideje-produkcija-2026-10-28.json` prolaze validaciju i stvarne vježbe oporavka u privremenim tablicama uz ROLLBACK (`oporavak-ideje.sql`, `oporavak-ideje-plana.sql`). Sadržaj kopije uklonjen je iz otvorenog SQL editora nakon provjera. To nisu automatske kopije niti kopije na zasebnom uređaju.
- Snimke produkcijske ideje i pretvorenog plana su `.local/ideas-production.png` i `.local/idea-converted-production.png`. Fizičko testiranje ove nadogradnje na Samsungu još nije provedeno; ranije četiri potvrđene runde odnose se na MVP.

Sljedeća faza: povezivanje checkboxa i koraka sa zadacima, uz jednu vezu po izvoru, atomske izmjene i provjere dovršavanja/brisanja. Nakon toga pretraga s jasnim uključivanjem arhive. Učestalost i odredište sigurnosnih kopija te putovanje između vremenskih zona i dalje traže odluku korisnika.

## Povezani zadaci i pretraga — završeno 28. 10.

- Korisnik je izričito zatražio sljedeće dvije faze: povezivanje checkboxa/koraka sa zadacima i pretragu. Obje su implementirane i objavljene.
- Uvedene su migracije `202610280003_linked_tasks.sql`, `202610280004_content_text.sql` i `202610280005_canonical_links.sql`. Sve su primijenjene; na bazi sada treba svih šest migracija redom. Nisu mijenjane već primijenjene migracije ni postojeći redci, RLS ili vlasništvo.
- Veza je `taskItem.attrs.taskId`. RPC atomski sprema otvoreni nacrt i stvara jedan zadatak, uz provjeru verzije i vlasnika. Okidači sinkroniziraju dovršavanje/vraćanje u oba smjera i podižu verziju promijenjenog zapisa. Naslov zadatka ostaje neovisan. Brisanje zadatka uklanja vezu i čuva lokalni checked; uklanjanje čvora ili izvora čuva zadatak. Transakcijski advisory lock serijalizira pisanja nad sadržajem/zadacima. Kanonski UUID sprječava različite zapise iste reference.
- Sučelje ima odjeljak Zadaci iz checkboxa, stvaranje i otvaranje povezanog zadatka te povratak na izvor. Novi izvor prvo treba spremiti. Greška/sukob čuva unos; sporo povezivanje zaključava editor. Fokus pri prelasku između povezanih zapisa provjeren je i u produkciji. Demo usklađuje i druge izmjene checkboxa unesene prije stvaranja nove veze.
- Pretraga preko povećala obuhvaća nazive, tekst svih sadržaja i kategorije, zanemaruje veličinu slova/dijakritiku (uključujući đ) i traži sve riječi. Riječi podijeljene inline formatiranjem ostaju cijele. Arhiva je zadano isključena, uključuje se izričito i rezultati imaju oznaku Arhivirano; kategorije je moguće izravno otvoriti. Nema nove glavne navigacije, biblioteke ili usluge.
- Prolaze lint, TypeScript/build i 20 Vitest testova. Prošlo je svih 39 UI provjera na 320/390 px i desktopu te 14 izoliranih API/UI provjera. Prvi novi UI test imao je preširok selektor dvaju postotaka (popis i dijalog); selektor je sužen na dijalog, potom je prošla cijela skupina. Nakon malih završnih dorada ponovljeno je 9 ciljanih provjera (fokus/veze/pretraga) i zatim 6 provjera veza/pretrage. Snimke mobilne pretrage i desktop veza vizualno su pregledane.
- `supabase/tests/linked_tasks.sql` prošao je na stvarnoj bazi u migracijskoj vježbi i nakon primjene: vlasničko povezivanje, ista kategorija, stale verzije/bez duplikata, sinkronizacija u oba smjera, neovisan naslov, odbijanje siročadi/duplih referenci, brisanje zadatka, čvora i cijelog izvora, očuvanje pri brisanju kategorije, zabrana anon RPC-a i odbijanje drugog računa. Proširenje s kanonskim UUID-om prošlo je u transakcijskoj vježbi prije primjene završnog okidača. Sve sintetičke izmjene poništene su ROLLBACK-om. Zaseban stres test konkurentnih SQL sesija nije proveden.
- Javni API i dalje odbija anon dohvat svih triju tablica HTTP-om 401; registracija i anonimna prijava su isključene. Privatna shema nije dostupna authenticated ulozi, a novi RPC nema anon/public execute pravo.
- Produkcija https://trenio.pages.dev/, završni deployment https://35e4d27a.trenio.pages.dev/. Svih 8 datoteka preko HTTPS-a odgovara lokalnom buildu: JS `index-BRDTSI-I.js`, editor `NoteEditor-DMSek-cM.js`, CSS `index-BlJXaGH3.css`.
- Na stvarnom računu potvrđeni su stvaranje veze, otvaranje oba zapisa, zasebno preimenovanje zadatka, dovršavanje zadatka uz 100% u planu, vraćanje checkboxom uz ponovnu aktivaciju zadatka, ponovno dovršavanje i arhiva izvora. Probni plan „Provjera veza i pretrage 28. 10. 2026.” i zadatak „Probni zadatak veze 28. 10. 2026.” ostaju arhivirani i povezani. Brisanje je provjereno samo na sintetičkim podacima u poništenoj transakciji/UI testovima.
- Nakon ponovnog učitavanja produkcijska pretraga `povezani korak caj` daje nula rezultata bez arhive i jedan odgovarajući plan s uključenom arhivom. Stvarni tekst koraka sadrži Čaj, čime je potvrđena pretraga tijela i dijakritike.
- Format kopije je 4, stari formati 1/2/3 čitljivi su novim alatom. Parser provjerava jedinstvene veze, postojanje zadatka, kanonski UUID i podudaranje checked/completedAt. Neusklađen snapshot odbija se uz poruku za osvježavanje/ponovni izvoz.
- Svježa kopija prije migracije je `.local/trenio-prije-veza-2026-10-28.json`. Završni izvoz `.local/trenio-veze-produkcija-2026-10-28.json` potvrđuje jednu novu povezanu stavku i plan, istu kategoriju/ID veze i usklađenu arhivu. Usporedba svih ranijih zapisa potvrđuje nepromijenjen postojeći sadržaj. Oporavak (`.local/oporavak-veza.sql`) prošao je na stvarnoj bazi u privremenim tablicama uz ROLLBACK. Konačni parser ponovno prihvaća istu kopiju. Privatni sadržaj uklonjen je iz otvorenog SQL editora nakon vježbe.
- Produkcijske snimke su `.local/linked-task-production.png` i `.local/search-production.png`. Fizička provjera novih ideja, veza i pretrage na Samsungu još nije provedena; ranije četiri potvrđene runde odnose se na početni MVP. Otvorene kartice/PWA treba ponovno učitati prije rada i izvoza novom verzijom.

Sljedeće: korisnička provjera novih tokova na Samsungu Galaxy S25 Plus i laptopu; dogovor učestalosti i odredišta sigurnosnih kopija te ponašanja pri putovanju. Automatske kopije, offline rad, uvoz kroz UI ili nove funkcionalnosti nisu uvedeni. Stavke proširenja sadržaja iz ROADMAP-a su završene.

## Vizualni UI/UX update — 29. 10.

- Usklađene su sekcije zadataka, planova, ideja i bilježaka: izraženiji naslovi s ikonama i brojem stavki, jedna površina po sekciji i separatori između redova. Akcije dodavanja imaju zasebnu responzivnu grupu s izraženijim Dodaj zadatak.
- Dorađeni su razmaci, tabovi, kategorije, pretraga, prazni prikazi, editor i gumbi. Tamna paleta i navigacija ostaju postojeće; nisu mijenjani poslovna logika, baza ni format kopije. Izbornik se zatvara nakon odabira radnje radi sprječavanja prekrivanja tabova.
- Prolaze TypeScript/build, lint, 20 domenskih testova, svih 39 UI provjera na 320/390 px i desktopu te svih 14 izoliranih API/UI provjera, uključujući greške spremanja, prekid veze i sukobe verzija. Prvi UI prolaz otkrio je prekrivanje taba otvorenim izbornikom; nakon ispravka cijela skupina prolazi.
- Dodatne snimke `.local/ui-review/` izrađene su iz sintetičkog demo sadržaja na 320, 390, 800 i 1366 px, uz provjeru bez horizontalnog prelijevanja. Vizualno pregledani mobilni Pregled/kategorije/editor, desktop sekcije sadržaja i prazna pretraga na 800 px. Fizička provjera na Samsungu nije izvedena u ovom koraku.
- Početni pokušaj objave odbila je automatska provjera odobrenja. Korisnik je zatim 29. 10. izričito odobrio objavu i nastavak dovršetka; objava je uspješno izvedena. Konačna verzija zabilježena je u završnom pregledu ispod.

## Završni pregled — 29. 10.

- Objavljen je UI update na `6662670e.trenio.pages.dev`; svih 8 javnih datoteka preko HTTPS-a jednako je provjerenom buildu. Javni API ponovno odbija anonimni dohvat svih triju tablica (HTTP 401), a registracija i anonimna prijava su isključene.
- Dodana je potvrda s nazivom kategorije i radnjom Otvori kategoriju za ideje, planove i bilješke koji nakon spremanja nisu vidljivi u Pregledu. Ne mijenja se filtriranje ni poslovna logika. Neuspješan zapis ne prikazuje novu potvrdu; upozorenje o neuspjelom naknadnom dohvatu ostaje vidljivo.
- Prolaze lint, TypeScript/build, 20 Vitest testova, 42 UI provjere i 15 izoliranih API/UI provjera. Regresijske provjere pokrivaju tri vrste sadržaja bez kategorije te odabranu kategoriju sa simuliranim neuspjelim zapisom i ponovnim pokušajem bez duplikata.
- `npm audit --omit=dev` ne nalazi poznate ranjivosti na dan provjere. Postojeći izvoz formata 4 ponovno je validiran i pripremljen je `.local/rehearse-recovery.sql`; nije ponovno izveden na bazi. Ranije dokumentirane vježbe oporavka ostaju potvrđena provjera oporavka; ovaj korak ne predstavlja novu produkcijsku kopiju.
- Uveden je ponovljivi `npm run check:release` bez novih ovisnosti. README, PRODUCT, TECHNICAL i ROADMAP usklađeni su s implementiranim proširenjima, postupkom objave i korisnikovom odlukom o vremenskoj zoni/kopijama.

- Konačna objava: https://trenio.pages.dev/, deployment https://74ef153f.trenio.pages.dev/. `npm run check:release` potvrđuje HTTPS i jednakost svih 8 datoteka: glavni JS `index-Bvm7YBVR.js`, CSS `index-yMmmUna7.css`, editor `NoteEditor-Cq59R7tV.js`. Produkcijski ekran prijave nakon ponovnog učitavanja nema konzolnih grešaka. Nije korištena vlasnička lozinka niti izveden novi stvarni zapis.
- Završna mobilna provjera potvrdila je potrebu da fokus nakon spremanja prijeđe na Otvori kategoriju, kako potvrda ne bi ostala iznad pomaknutog prikaza. Prolazi dodatnih 6 ciljanih provjera lokacije i tipkovničkog fokusa na 320/390 px i desktopu; nove snimke `.local/ui-review/save-location-*.png` vizualno su pregledane. Lint i TypeScript/build ponovno prolaze. Javni API ponovno potvrđuje zatvoren pristup.
- Preostaje korisnička provjera novih tokova na fizičkom Samsungu i ocjena početnih pravila. Odredište kopija namjerno je otvoreno po korisnikovoj odluci. Nema druge preostale implementacijske stavke u dogovorenom funkcionalnom opsegu.

## Sigurnosne kopije na privatnom OneDriveu — 29. 10., postavljanje

- Korisnik je prihvatio predloženu rutinu: privatni OneDrive, tjedni ručni JSON izvoz i izvoz prije većih promjena, 8 tjednih i 6 mjesečnih kopija, provjera prve kopije i probni oporavak svaka 3 mjeseca. Nisu uvedeni automatski backup, automatsko brisanje ni podsjetnici.
- Privatna lokalna putanja potvrđena je varijablom OneDriveConsumer: `C:\Users\domag\OneDrive`. Opća varijabla OneDrive pokazuje na fakultetski račun i nije korištena.
- Stvorena je mapa `C:\Users\domag\OneDrive\Trenio\Sigurnosne kopije` i u nju pohranjena postojeća kopija `trenio-2026-10-28-201304.json`. Parser i usporedba bajtova potvrđuju jednakost s validiranim izvozom od 28. 10. To nije novi izvoz niti potvrda uspješne sinkronizacije u oblak.
- Dodana je naredba backup:store bez novih ovisnosti. Prolaze 20 domenskih testova, provjera tipova i lint. Izolirano provjereni pohrana, ponovljena pohrana jednake kopije, odbijanje konfliktnog naziva bez prepisivanja, nevaljan sadržaj, demo i nedostajući privatni OneDrive.
- Nakon korisničke prijave preuzet je svježi produkcijski izvoz 29. 10. u 17:03 po Zagrebu. Parser potvrđuje valjanost, a alat pohrane jednakost bajtova u privatnom OneDriveu: `trenio-2026-10-29-170301.json`. Izvoz sadrži 2 kategorije, 5 zadataka i 8 sadržaja, uključujući arhivu i veze. Pripremljen je SQL za probni oporavak u privremenim tablicama; ovaj novi SQL nije izvršen na bazi. Sadržaj nije ispisivan u logove.
- Provjera izvan sandboxa potvrđuje da je privatni OneDrive račun konfiguriran za navedenu putanju i da je OneDrive klijent pokrenut. Početna sandbox provjera nije imala potpun uvid u registry/procese. To i dalje nije dokaz da je datoteka već vidljiva na udaljenom OneDriveu.
- Windowsovi metapodaci za novu kopiju prikazuju `Sharing status: Not shared` i `Availability status: Available on this device`. Nakon korisničke Microsoft prijave udaljeno preuzimanje i usporedba su potvrđeni u nastavku. Microsoft 2FA nije provjeren.

- Završena je i udaljena provjera: u privatnom OneDriveu vidljive su obje kopije u Trenio / Sigurnosne kopije. Svježa `trenio-2026-10-29-170301.json` preuzeta je preko OneDrive web sučelja, parser je ponovno prihvaća, a SHA-256 potpuno odgovara izvornom produkcijskom izvozu. Potvrđeno je da kopija postoji izvan ovog računala; sama lokalna sinkronizirana mapa nije korištena kao dokaz.
- Tjedni izvoz i zadržavanje kopija ostaju ručna rutina. Novi SQL za probni oporavak nije izvršen na bazi; stvarni oporavak u praznu produkciju nije izvođen. Podsjetnici i automatsko kopiranje nisu postavljeni.
- Provjera prava pristupa preko OneDrive web dijaloga nije završena jer je ostao na učitavanju; postavke pristupa nisu mijenjane. Lokalni Windows metapodatak Not shared ostaje provjereni podatak o dijeljenju, a Microsoft 2FA nije provjeren. Nakon ponovnog učitavanja otvorena je ciljana mapa s obje kopije.

## Ideje za budući razvoj — 29. 10.

Na korisnikov zahtjev u ROADMAP.md zabilježene su potencijalne nadogradnje, počevši od podsjetnika koje je izričito naveo. Ostali kandidati su ponavljajući zadaci, automatske kopije, podsjetnik za ručnu rutinu kopiranja, uvoz kroz UI, offline rad, privici i prijenos iz Samsung Notesa. To je popis za budući dogovor, bez početka implementacije, aktiviranja podsjetnika ili promjene dovršenog opsega. Izmijenjena je samo dokumentacija; izvršne provjere nisu potrebne niti su ponovno pokretane.
