# Trenio — tehnički prijedlog

Status: React + TypeScript + Vite + Supabase odobreni 25. 10. 2026. Frontend je povezan s projektom `trenio`; stvarna vlasnička prijava, spremanje i sukob verzija provjereni su. SQL i javni API provjere prolaze. Izvoz i oporavak u privremenim tablicama provjereni su; hosting je postavljen na https://trenio.pages.dev/, a korisnik je 28. 10. potvrdio četiri kruga na fizičkim uređajima. Početna verzija radi uz internet.

## Opcije

| Opcija | Prednost za Trenio | Nedostatak |
|---|---|---|
| React + TypeScript + Vite + Supabase | Statički frontend i upravljana baza/prijava; bez vlastitog API servera | Potrebno pažljivo postaviti prava pristupa i rješavanje sukoba |
| Next.js + TypeScript + Supabase | Poslužiteljski dio dostupan unutar istog projekta | Za privatni organizator zasad nije utvrđena potreba za poslužiteljskim renderiranjem |
| React + Vite + vlastiti mali API i baza | Veća kontrola nad spremanjem i okolinom | Više održavanja servera, prijave, sigurnosti i kopija podataka |

## Odabrani pristup

React, TypeScript i Vite za responzivnu web aplikaciju; Supabase Postgres i Auth za trajne podatke i identitet. Procjena: to je razuman omjer jednostavnosti i održavanja za online osobnu aplikaciju s pristupom s dva uređaja.

Stilovi su CSS sa semantičkim tokenima, bez dodatnog UI frameworka. Editor koristi Tiptap StarterKit i task-list/task-item proširenja, bez komercijalnih dodataka. Editor se učitava zasebno tek pri otvaranju bilješke. Vitest provjerava domenska pravila, a Playwright tokove u Edgeu na mobilnoj i desktop širini. ESLint i TypeScript provjeravaju kod.

Frontend je moguće statički hostati. Početni obrazac koristi email i lozinku prethodno kreiranog vlasnika; nema javne registracije. Odabran je Cloudflare Pages Free, prema provjerenim uvjetima od 27. 10. 2026. Ne obećavati besplatan trajni rad ni automatske sigurnosne kopije bez provjere odabranog plana.

Pripremljeni su `public/manifest.webmanifest`, standalone prikaz, ikone 192/512 px i Apple touch ikona. Nije uveden service worker ni predmemorija privatnih podataka; početna verzija radi uz internet. PWA instalaciju provjeriti nakon hostinga i HTTPS-a na stvarnom mobitelu. Bez offline reda izmjena, CRDT-a, zasebnog backenda, Dockera ili mikroservisa u početnoj verziji.

## Jednostavna struktura i tok

Prikazne komponente koriste domenska pravila i mali modul pristupa podacima. Modul pristupa podacima komunicira sa Supabaseom pod identitetom prijavljenog vlasnika. Baza provodi autorizaciju i integritet; filtriranje u UI-ju nije sigurnosna granica.

Nakon potvrđenog spremanja ažuriraju se svi prikazi istog zapisa. Pri povratku u aplikaciju ili fokusu ponovno dohvatiti podatke. Realtime nije preduvjet prve verzije.

Povratak se prati i preko `visibilitychange` događaja, što pokriva ponovno otvaranje vidljive kartice/PWA. Otvoreni nacrt se pritom ne zamjenjuje. Editor koristi `setEditable` za zabranu unosa tijekom spremanja i `useEditorState` za aktivna stanja formatiranja; samo onemogućeni gumbi i CSS nisu dovoljni za zabranu tipkovničkog unosa.

`setEditable` se poziva bez emitiranja promjene sadržaja kako otvaranje/zaključavanje editora ne bi označavalo bilješku kao izmijenjenu. Završna provjera 27. 10. obuhvaća 27 UI i 10 izoliranih API/UI provjera te 13 domenskih testova. Objavljene datoteke potvrđene su usporedbom s lokalnim buildom preko HTTPS-a.

## Implementirani logički model

Početna SQL shema je u `supabase/migrations/202610250001_initial.sql`; ručno je primijenjena kroz SQL Editor. Ne pokretati je ponovno na postojećoj bazi. Prije eventualnog uvođenja CLI migracija potrebno je uskladiti povijest migracija jer izvršavanje kroz SQL Editor nije CLI evidencija. Postoje kategorije, zadaci i sadržaj (notes.kind: note/plan/idea); povezivanje je atribut unutar JSON tijela prema odjeljku niže. Svih šest migracija je primijenjeno.

| Entitet | Ključni podaci i odnosi |
|---|---|
| Kategorija | ID, vlasnik, naziv, redoslijed |
| Zadatak | ID, vlasnik, opcionalna kategorija, naziv, planirani dan, rok, vrijeme dovršavanja, prikvačenost, verzija |
| Sadržaj | ID, vlasnik, opcionalna kategorija, vrsta bilješka/plan/ideja, naslov, strukturirano tijelo, arhiviranje, prikvačenost, verzija |
| Korak plana | Tiptap taskItem u JSON tijelu, redoslijed u dokumentu, checked i opcionalni taskId |
| Veza izvora i zadatka | Kanonski taskId na jednom taskItem čvoru; atomski RPC i okidači za usklađivanje dovršenosti |

Svaki zapis ima vrijeme nastanka i izmjene. Povezani zapisi moraju pripadati istom vlasniku. Jedna izvorna stavka može imati najviše jedan povezani zadatak. Prikazi Danas i Trenutno su upiti nad zapisima, ne kopije podataka.

Dovršavanje zadatka predstavlja logičku arhivu; ne premještati ga u zasebnu tablicu. Kalendarske datume ne pretvarati u UTC ponoć. Tehnička vremena spremati kao vremenske oznake.

## Pouzdanost i sinkronizacija

- Baza je trajni izvor podataka; lokalna predmemorija nije sigurnosna kopija.
- Uređivanje koristi verziju zapisa: spremanje uspijeva samo ako se verzija nije promijenila. Pri sukobu sačuvati lokalni tekst i ponuditi pregled novije verzije.
- Ne provoditi tiho prepisivanje cijele bilješke starijom verzijom s drugog uređaja.
- Pri gubitku veze zadržati nespremljeni unos u otvorenom editoru, prikazati grešku i omogućiti ponovni pokušaj. Trajna offline pohrana nacrta nije zajamčena početnim opsegom.
- Za povezane višestruke promjene koristiti atomsku operaciju u bazi kad se uvedu.
- Prije svakodnevnog korištenja odrediti postupak sigurnosnog kopiranja i provjeriti oporavak na testnim podacima. Izvoz privatnih podataka uključuje arhivu i verziju formata; izvoz sam po sebi nije automatski backup.

## Identitet i sigurnost

- Jedan vlasnik bez timskih uloga; zatvorena registracija ili pristup samo unaprijed dopuštenom računu.
- Supabase Auth: email i lozinka, bez registracije u aplikaciji. Privatna tablica `private.app_owner` dopušta samo jednog vlasnika i RLS se oslanja na nju.
- Postaviti najmanje potrebne privilegije i RLS politike za čitanje, dodavanje, izmjenu i brisanje prema vlasniku na svim izloženim tablicama.
- Provjeriti zabranu pristupa neprijavljenom i drugom računu te zabranu povezivanja tuđih zapisa.
- Administratorske i servisne tajne nikada ne slati u preglednik.
- Ograničiti podržani sadržaj editora, sigurno prikazivati formatirani tekst i provjeravati URL protokole linkova.
- Produkcija koristi HTTPS. Migracije su verzionirane; primijenjene migracije ne mijenjati retroaktivno.

## Izvori provjereni 25. 10. 2026.

- [Vite: statički deployment](https://vite.dev/guide/static-deploy) — build se može isporučiti kao statički frontend.
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — autorizacija podataka u bazi; privilegije i politike treba konfigurirati zajedno.
- [MDN: PWA instalacija](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), provjereno 26. 10. 2026. — manifest i ikone omogućuju pripremu instalacije; service worker nije uvjet instalacije.

Preporuka stacka je procjena za ovaj projekt, a ne tvrdnja da dokumentacija pružatelja određuje najbolji izbor.

## Granice trenutačne provjere

- Bez obje Supabase varijable aplikacija koristi jasno označene primjere u memoriji. Izmjene nestaju nakon osvježavanja, a izvoz je označen kao demo.
- SQL definira RLS, nepromjenjivo vlasništvo zadataka/bilješki, verzije i atomsko brisanje kategorije uz očuvanje sadržaja.
- Klijent ažurira i briše prema ID-u i očekivanoj verziji. Stara verzija ili izbrisana stavka izaziva grešku uz zadržan unos.
- `supabase/tests/initial_security.sql` provjeren je na stvarnoj bazi prije dodjele vlasnika, s izmišljenim identitetima bez lozinki i tokena te poništavanjem svih testnih izmjena. Pokriva izolaciju korisnika, prava pristupa, sukobe verzija i očuvanje sadržaja pri brisanju kategorije.
- `npm run check:public-access` provjerava stvarni javni API bez zapisivanja: anonimni pristup i otvorena registracija odbijeni su.
- Prijava stvarnog vlasnika, trajno spremanje zadatka i bilješke, checkboxi, arhiva i sukob između dviju kartica provjereni su kroz UI. Korisnik je 28. 10. potvrdio provjere na Samsungu Galaxy S25 Plus i laptopu, uključujući sukob izmjena.
- `npm run test:connected` presreće sve pozive prema izmišljenoj Supabase adresi i koristi sintetički identitet bez stvarnih pristupnih podataka. Provjerava ponašanje SDK-a i sučelja pri spremanju, ponovnom dohvatu i greškama; ne zamjenjuje test stvarne sesije.
- `supabase/setup/assign_single_owner.sql` primijenjen je nakon potvrde korisnika. Skripta odbija više aktivnih računa i zamjenu postojećeg vlasnika.

## Izvoz i oporavak

Nadogradnja planova od 28. 10. koristi novu migraciju `202610280001_plans.sql`: `notes.kind` razdvaja bilješke i planove uz iste RLS politike, verzije i atomsko brisanje kategorije. Koraci su `taskItem` čvorovi postojećeg Tiptap dokumenta; napredak se računa iz njih i ne sprema kao zaseban broj. Veze sa zadacima dodane su migracijama opisanim niže. Migracija je primijenjena na produkciji nakon uspješne transakcijske vježbe (ROLLBACK). SQL je potvrdio da postojeće bilješke ostaju vrste note.

Izvoz sada koristi format 4 (ideje su uvele format 3) i polje `kind`; parser prihvaća i formate 1/2/3 (format 1 bez vrste čita kao bilješke). Oporavak novim alatom zahtijeva sve migracije. Zadržavanje nove verzije formata sprječava da stari alat obnovi planove kao obične bilješke. Prije objave nove verzije mora se prvo primijeniti aditivna migracija; stariji otvoreni klijenti trebaju ponovno učitati aplikaciju prije rada s planovima ili izvoza.

- `src/backup.ts` izvozi format 4, prihvaća formate 1/2/3 i validira tipove, UUID-ove, datume, verzije, jedinstvenost i veze kategorija te podržane čvorove editora i protokole linkova. Granica je 10 MB; probni izvoz ne prihvaća se kao prava kopija.
- Izvoz dohvaća svježe podatke kroz postojeći klijent. Ne stvara datoteku ako dohvat ili validacija ne uspiju. To nije transakcijski snapshot istodobnih izmjena na više uređaja.
- `scripts/prepare-recovery.ts` generira SQL u `.local/`, bez ispisivanja privatnog sadržaja. Alat je provjeren na Nodeu 24 i koristi ugrađeno uklanjanje TypeScript tipova.
- Zadano se oporavak izvodi nad privremenim klonovima tablica s provjerama i vezama, uz ROLLBACK. Taj put je uspješno izveden na stvarnom izvozu.
- Stvarni oporavak koristi isti unos, ali odredište je `public`. Zahtijeva već konfiguriranog vlasnika, zaključava tablice i odbija neprazno odredište. Nema brisanja ni prepisivanja; stvarni COMMIT oporavka u produkcijsku bazu nije izvođen.
- Čuvaju se identiteti, sadržaj, kategorije, korisnički datumi, arhiva, prikvačivanje i verzije. Tehnički created_at/updated_at postavljaju se prema zadanim vrijednostima nove baze jer ih postojeći format izvoza ne sadrži.

## Priprema hostinga — 27. 10. 2026.

28. 10.: nakon ponavljanog zastoja Direct Upload sučelja planovi su objavljeni službenim Wranglerom 4.154.0 na postojeći Pages projekt i granu `main` (deployment `8ce9a58d`). Korisnik je izričito odobrio OAuth s `account:read`, `user:read`, `pages:write` i pohranom u OS keyring; Wrangler dodaje pozadinski pristup za obnovu prijave. Windowsova podrška `@napi-rs/keyring` 1.3.0 instalirana je globalno, bez promjene aplikacijskih ovisnosti. `.wrangler/` je ignoriran. Token se ne upisuje u projekt.

Provjereni postupak nakon builda: `npx --yes wrangler@4.154.0 pages deploy dist --project-name trenio --branch main`, uz identitet postojećeg računa. Build i sve produkcijske datoteke provjeriti prije zatvaranja objave. Stvarni plan i izvoz formata 2 provjereni su na produkciji; oporavak stvarnog izvoza prošao je u privremenim tablicama uz ROLLBACK.

Frontend je objavljen na Cloudflare Pages Free planu, uz postojeći Supabase za podatke i prijavu, prema korisnikovu nalogu „Kreni dalje”. Produkcija: https://trenio.pages.dev/, Direct Upload projekt `trenio`, početni deployment `598bc3fa-cc68-4684-a39f-29f557ac197c` od 27. 10. 2026. Od 31. 10. projekt ima lokalni Git repozitorij; privatni GitHub repozitorij je `dcirko-side-projects/trenio`. Objava ostaje ručni Wrangler Direct Upload, bez nove CI/CD integracije. Nisu dodani novi paketi ni vlastiti server.

Uspoređeni su službeni planovi:

| Hosting | Provjereno ograničenje | Procjena za Trenio |
|---|---|---|
| [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/) | 500 buildova mjesečno, jedan istodobno | Preporučen za ovaj statički frontend; lokalni build omogućuje jednostavnu ručnu objavu. |
| [Netlify Free](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) | 300 kredita mjesečno, čvrsto ograničenje | Izvediva alternativa; potrošnja kredita uključuje više vrsta korištenja. |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Besplatno za osobnu nekomercijalnu uporabu, ograničenja resursa | Odgovara osobnom projektu, ali zasad nije potrebna poslužiteljska infrastruktura. |

Prema [Direct Upload dokumentaciji](https://developers.cloudflare.com/pages/get-started/direct-upload/), dashboard prihvaća ZIP ili mapu; ručni prijenos ima granicu 1.000 datoteka i 25 MiB po datoteci. Direct Upload projekt kasnije se ne može prebaciti na Git integraciju; za nju bi trebalo napraviti novi Pages projekt. Cijene i pravila provjereni su 27. 10. 2026.; ne predstavljaju jamstvo trajnih uvjeta.

Objavljen je samo sadržaj `dist/`, bez `.env`, izvornog koda i `.local/` kopija. Javni publishable ključ ugrađen je tijekom builda; zaštitu sadržaja provodi Supabase RLS. Svih 8 datoteka preko HTTPS-a odgovara lokalnom buildu. Prijava i spremanje zadatka/bilješke s checkboxom nakon osvježavanja provjereni su na produkciji. Rad i sukob verzija na dva fizička uređaja te instalaciju PWA provjeriti zasebno. Daljnje verzije objavljuju se kao novi deployment postojećeg Pages projekta, nakon svježeg builda i provjera.

Ideje koriste migraciju `202610280002_ideas.sql`, koja u transakciji proširuje `notes_kind_check` na note/plan/idea bez promjene podataka ili RLS-a. Pretvorba koristi postojeći UPDATE s uvjetom id + version i okidačem nove verzije: nema nove stavke ni višestrukog zapisa. Vrsta se u nacrtu ne mijenja prije uspjeha; greška čuva i mogućnost ponovnog pokušaja. Format 3 čuva ideje i odbija nepoznate vrste; stare kopije ostaju čitljive.

## Povezivanje i pretraga — implementacija 28. 10.

`202610280003_linked_tasks.sql` uvodi RPC `create_linked_task`, privatne JSON funkcije i okidače, bez novih tablica ili izmjene postojećih redaka. Veza je kanonski UUID zadatka u `taskItem.attrs.taskId`; on stabilno identificira povezani izvorni čvor i nakon promjene redoslijeda/teksta. Po jednom zadatku dopušten je jedan izvorni čvor. Okidač provjerava postojanje, istog vlasnika, boolean stanja i jedinstvenost u dokumentu/među dokumentima. `202610280005_canonical_links.sql` odbija nekanonske UUID zapise koji bi mogli zaobići usporedbu iste veze.

RPC provjerava vlasnika i verziju, zaključava izvor, uzima cijeli otvoreni nacrt i put checkboxa unutar njega te u istoj transakciji stvara zadatak i zapisuje vezu. Put je samo adresiranje nove veze pri toj provjerenoj verziji; kasnije se čvor nalazi po taskId. Povezana promjena zadatka ažurira tijelo i verziju izvora; promjena checkboxa ažurira dovršenost i verziju zadatka. Jednaka stanja ne stvaraju novi UPDATE, čime se prekida rekurzija. Sve INSERT/UPDATE/DELETE naredbe nad tasks/notes uzimaju transakcijski advisory lock prije zaključavanja redaka, uključujući starije klijente. To serijalizira izmjene grafa za ovaj mali osobni organizator. Nije proveden zaseban stres test istodobnih SQL sesija.

Brisanje zadatka prije brisanja uklanja njegov taskId iz svih izvora i čuva checked. Brisanje čvora/izvora samo uklanja referencu iz dokumenta; samostalni zadatak ostaje u tasks. RLS i vlasništvo ostaju postojeći; RPC je security definer s praznim search_path, izričitom provjerom vlasnika i bez prava anon/public. Privatne funkcije nisu dostupne kroz API. `202610280004_content_text.sql` čuva cijele riječi preko inline formatiranja pri imenovanju zadatka.

Tiptap proširenje čuva atribut taskId pri uređivanju. Sučelje prikazuje povezivanje/otvaranje uz svaki checkbox, traži prvo spremanje novog izvora i blokira unos tijekom RPC-a. Prelazak na povezani zapis zahtijeva spremljen izvor i fokusira naslov novog dijaloga. Demo koristi iste domenske pomoćne funkcije za usklađivanje stanja, bez trajne pohrane.

Format 4 kopije čuva veze u tijelu i provjerava jedinstvenost, postojanje cilja i podudaranje dovršenosti. Neusklađen izvoz se odbija; svježi dohvat triju zbirki i dalje nije transakcijski snapshot pa treba ponoviti izvoz ako se istodobno uređuje na drugom uređaju. Oporavak prvo unosi zadatke pa sadržaj. Privremeni klonovi nemaju produkcijske okidače; provjere punog tijela i zadataka te validacija kopije potvrđuju očuvanje veze.

Pretraga je lokalni upit nad svim vlasnički učitanim podacima, bez nove usluge, indeksa ili slanja upita vanjskom servisu. Normalizacija NFD uklanja dijakritike i mapira đ u d; tekst čuva spajanje inline čvorova i razdvaja blokove. Arhiva je izričit boolean filtar; rezultati ostaju isti zapisi kao u ostalim prikazima.

## Završni frontend i provjera objave — 29. 10.

Danas je izričito vezan uz Europe/Zagreb i tijekom putovanja; kalendarski datumi ostaju date-only. Nakon spremanja sadržaja iz Pregleda koji ga ne prikazuje, UI navodi kategoriju i nudi izravno otvaranje. To je samo prikazni kontekst posljednjeg uspješnog spremanja; briše se pri novoj operaciji i navigaciji. Upozorenje o grešci naknadnog dohvata ne zamjenjuje se porukom uspjeha.

`npm run check:release` čita samo `dist/` i preko HTTPS-a uspoređuje sve javne datoteke s produkcijom, s vremenskim ograničenjem zahtjeva. Opcionalni argument je HTTPS origin deploymenta. Ne čita `.env`, ne šalje sadržaj datoteka i ne mijenja produkciju. Pokreće se nakon objave istog builda; noviji lokalni build prije objave očekivano ne odgovara produkciji.

## Pohrana kopije na privatni OneDrive — 29. 10.

`npm run backup:store -- PATH` koristi postojeći parser kopije prije pisanja i nakon pohrane. Odredište je isključivo `OneDriveConsumer/Trenio/Sigurnosne kopije`; nema zamjene općom OneDrive varijablom ili fakultetskim računom. Naziv koristi izvorni exportedAt u Europe/Zagreb, pa kopija od jučer ne dobiva današnji datum. Zapis je ekskluzivan (`wx`): postojeća jednaka kopija prihvaća se bez novog zapisa, a različita datoteka s istim nazivom ostaje sačuvana. Pohranjuju se već validirani bajtovi; sadržaj nije u logovima. Alat ne potvrđuje udaljenu sinkronizaciju, ne briše kopije i ne raspoređuje automatsko izvođenje. Dodavanje skripte ne zahtijeva novu objavu frontenda.

## Hijerarhija i stabilnost editora — 30. 10. 2026.

Migracija `202610300001_category_hierarchy.sql`, primijenjena 30. 10. 2026., proširuje categories s parent_id, icon, color, sort_order, version i updated_at. Kompozitni FK čuva istog vlasnika; CHECK i okidač ograničavaju dubinu i cikluse, a sibling unique indeksi dopuštaju isto ime pod različitim roditeljima. `save_category` provjerava očekivanu verziju i atomski ažurira redoslijed susjeda. Očekivana verzija u UI-ju hvata se pri otvaranju obrasca, a ne iz osvježenih podataka pri spremanju. Sve kategorijske operacije koriste postojeći advisory graph lock radi istog redoslijeda zaključavanja kao zadaci i sadržaj. RLS i javne privilegije nisu proširene.

`delete_category` promovira djecu, razrješava sudare naziva i čuva sav sadržaj. Izvoz je format 5, čita 1–4 i provjerava novu hijerarhiju/ikone/boje/verzije; oporavak čuva sva nova polja i provjerava njihov sadržaj. Novi oporavak zahtijeva svih 7 migracija. Stariji klijenti trebaju se ponovno učitati prije reorganizacije ili izvoza.

Editor koristi memoizirana proširenja i editorProps te nepromjenjiv početni dokument unutar jedne verzije nacrta. React i dalje prima promjene tijela, ali tipkanje više ne poziva setOptions na svakoj transakciji. Pointer na alatnoj traci čuva postojeći fokus/odabir; tipkovnički Tab ostaje dostupan. Od 31. 10. kapitalizacija je eksplicitno off zbog ponovljene korisničke prijave neželjenih velikih slova uz checkboxove; spellcheck ostaje true. taskId ima keepOnSplit:false, pa Enter ne duplicira vezu. Instrumentirani UI testovi mjere pozive setOptions, blur, identitet DOM-a i rezultat unosa. Fizički mobilni IME nije emuliran.

Izolirana nadogradnja stvarne kopije i SQL testovi prošli su u PGliteu, bez izmjene produkcije. Nakon početne automatske blokade korisnik je izričito odobrio produkcijsku vježbu, primjenu migracije i objavu. Vježba, migracija, dodatne transakcijske SQL provjere i stvarni frontend tokovi prošli su. Svih 8 datoteka deploymenta 5d3a283f odgovara buildu. Prema dodatnom izričitom zahtjevu svi vlasnički sadržaji i kategorije obrisani su atomskom transakcijom nakon validacije kopije; Auth i app_owner ostaju sačuvani. Trenutačno su sve tri zbirke prazne.
