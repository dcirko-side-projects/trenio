# Trenio — design system

Status: mobilni i desktop prikazi implementirani i vizualno pregledani. Korisnik je 28. 10. potvrdio četiri kruga MVP-a na fizičkom mobitelu i laptopu. Planovi su dodani i vizualno provjereni.

## Smjer

Mirno, pregledno i brzo sučelje s jasnom tipografijom. Mobitel je primarni uređaj. Prednost imaju liste i razdjelnici, a kartice samo kada grupiranje pomaže. Bez dekorativnih gradijenata, emojija umjesto ikona i nepotrebnih animacija.

## Korisnikov izbor boja

Ažurirano 1. 11. 2026. prema novoj korisnikovoj paleti. Svijetle neutralne površine nose većinu sučelja; primarna `#2A2A2A` definira tekst, znak i glavne gumbe. Sekundarna `#C0C0C0` koristi se za diskretne obrube. Crvena `#E10600` označava aktivne indikatore, fokus, checkboxe i male naglaske, bez velikih crvenih ploha.

Kontrasti: glavni tekst na pozadini 13,17:1, bijeli tekst glavnog gumba 14,35:1, sekundarni tekst na blago naglašenoj površini 5,21:1, crvena na pozadini 4,56:1, rub kontrola na blago naglašenoj površini 3,15:1, tekst greške 7,49:1. Sekundarna srebrna nije boja sitnog teksta ni jedini rub polja.

## Implementirani tokeni

| Namjena | Vrijednost |
|---|---|
| Primarna / glavni tekst | `#2A2A2A` |
| Sekundarna | `#C0C0C0` |
| Naglasak / fokus | `#E10600` |
| Pozadina | `#F5F5F5` |
| Površina | `#FFFFFF` |
| Sekundarni tekst | `#626262` |
| Razdjelnik | `#DEDEDE` |
| Blaga površina | `#EDEDED` |
| Rub kontrola | `#858585` |
| Destruktivni tekst | `#B30500` |
| Površina / tekst greške | `#FFF0EF` / `#A10400` |

- Font: DM Sans uz sistemski sans-serif fallback; editor 16 px, redovi zadataka 15–16 px, naslov ekrana 29 px na mobitelu i 36 px na desktopu.
- Razmaci: 4, 8, 12, 16, 24, 32, 48 px. Mobilni bočni razmak 16 px, desktop 24–32 px.
- Radijusi: kontrole 8–10 px, grupirane sekcije 14 px, dijalozi 18 px. Sjene samo na izdignutim izbornicima i dijalozima.
- Jedna konzistentna biblioteka linijskih ikona: Lucide. Ikone obično 20 px, dodirna površina najmanje 44 × 44 px.
- Zadana je svijetla neutralna tema prema korisnikovoj doradi od 1. 11. Nativne kontrole koriste `color-scheme: light`; zaseban prekidač tema nije uveden.

## Prikazi i interakcije

- Planovi se dodaju radnjom Novi plan i pojavljuju kao zasebna neprazna sekcija unutar kategorije, Trenutno ili Arhive. Koriste postojeći editor s oznakom Sadržaj plana i naredbom za pretvaranje retka u korak. Broj označenih/svih koraka i traka napretka prikazuju se samo kada koraci postoje. Nema nove stavke glavne navigacije.

- Mobitel: donja navigacija Pregled / brzo dodavanje / Kategorije, s prostorom za safe area; arhiva je dostupna u zaglavlju i pomoćnom izborniku. Bilješka se uređuje preko cijelog zaslona, a obrazac ima pomicanje i radnje na vrhu.
- Desktop od 800 px: sažeta bočna navigacija i glavni sadržaj. Bilješke imaju ugodnu širinu za čitanje, bez rastezanja retka preko cijelog ekrana.
- Danas i Trenutno su tabovi unutar Pregleda, ne dodatne glavne destinacije.
- Red zadatka: checkbox, naziv i samo relevantni metapodaci. Dodatne radnje dostupne su i tipkovnicom i dodirom, ne samo hoverom.
- Brzo dodavanje prvo traži naziv; datumi, kategorija i prikvačivanje otkrivaju se po potrebi.
- Editor ima mali skup kontrola i naredbu pretvaranja odlomka u checklistu. Bez izgradnje vlastitog složenog editora.
- Svaka komponenta ima relevantna stanja učitavanja, praznog sadržaja, greške, fokusa i onemogućenosti.
- Spremanje jasno razlikuje izmijenjeno, spremanje, spremljeno i neuspjelo. Sačuvati unos kod greške.
- Tijekom spremanja bilješka ne prima ni tipkovničke izmjene; nakon greške editor se otključava uz očuvan tekst. Aktivna stanja formatiranja prate i tipkovničke prečace. Dugi nazivi kategorija prelamaju se i u metapodacima zadataka.
- Gubitak veze jasno je označen. Korisnika ne uvjeravati da su lokalne izmjene sinkronizirane.
- Za destruktivne radnje koristiti jasnu potvrdu ili pouzdan Undo prema mogućnosti oporavka.
- Semantičke kontrole, vidljiv fokus, oznake polja, pristupačni dijalozi i poštivanje reduced-motion postavke. Boja nije jedini nositelj značenja.
- Dijalozi imaju pristupačan naziv. Statički naslov dijaloga prima početni fokus nakon otvaranja; tekstualna polja i editor čekaju korisnikov dodir ili tipkovnički odabir; Escape zatvara dijalog uz postojeću zaštitu nespremljenog unosa, a fokus se vraća pokretaču. Upozorenje o gubitku veze vidljivo je i u otvorenom dijalogu.

Pregled i tokovi provjeravaju se na 320 px i 390 px te desktopu. Korisnik je 28. 10. potvrdio mobilnu tipkovnicu i PWA ponašanje na Samsungu Galaxy S25 Plus. Izvor stilova je `src/styles.css`.

Ikona za početni zaslon koristi svijetlu pozadinu, tamni znak i malu crvenu točku i jednostavan znak t. Vektorski izvor je `public/icons/trenio.svg`, a izvozi su PNG veličina 192 i 512 px. Promotivni ili zaseban završni logotip nije dizajniran.

- Ideje koriste Lucide Lightbulb, radnju Nova ideja i postojeći editor s oznakom Sadržaj ideje. Sekcija Ideje skriva se kada je prazna. Spremljena ideja ima radnju Pretvori u plan u podnožju; radnje se prelamaju na uskom zaslonu. Naslov dijaloga prima fokus; spremanje/pretvorba zaključavaju unos, a greška ga vraća.

- Povezivanje koristi odjeljak Zadaci iz checkboxa ispod editora: tekst retka i Stvori povezani zadatak ili Otvori povezani zadatak. Radnje se prelamaju na mobitelu; novi izvor prvo treba spremiti. Zadatak nudi povratak na izvor. Prelazak između zapisa fokusira statički naslov dijaloga, a lokalne nespremljene promjene traže spremanje prije prelaska.
- Povećalo uz naslov otvara pomoćnu Pretragu. Polje čeka korisnikov odabir, checkbox Uključi arhivu zadano je isključen, broj rezultata i obuhvat su vidljivi. Arhivirane stavke nose tekstualnu oznaku; nema nove glavne navigacije. Prazan rezultat objašnjava promjenu upita ili uključivanje arhive.

## Vizualna dorada — 29. 10. 2026.

- Zajednički `SectionHeading` prikazuje semantički naslov h2, Lucide ikonu i broj stavki. Sekcija ima jednu površinu s diskretnim obrubom i radijusom 14 px; pojedinačni redovi unutar nje odvojeni su separatorima.
- Od 1. 11. pozadina je neutralna svijetla; ikone vrsta sadržaja koriste prigušenu sivu `#505050`. Nazivi i ikone uz boju identificiraju vrstu sadržaja.
- Dodavanje je zasebna grupa: dva stupca na mobitelu, četiri od 800 px. Dodaj zadatak ima jači obrub i pozadinu; sve četiri postojeće akcije ostaju dostupne. Dodirne površine su najmanje 44 px.
- Tabovi Danas/Trenutno koriste grupiranu kontrolu s jasno označenim odabirom. Kategorije, pretraga, dijalozi i alatna traka editora koriste iste obrube, razmake i stanja interakcije.
- Mobilno zaglavlje smješta pretragu i izbornik uz datum/oznaku prostora kako naslov ima punu širinu bez dodatnog reda akcija. Pomoćni izbornik zatvara se nakon odabira radnje da ne prekrije sadržaj ili tabove.
- Prazni prikazi imaju blagu površinu i isprekidani obrub; tekst u Pregledu pojašnjava pronalaženje sadržaja u Kategorijama/pretrazi. Navigacija, filtriranje, spremanje i model podataka ostaju postojeći.
- Raspored vizualno pregledan na 320, 390, 800 i 1366 px; provjereno odsustvo horizontalnog prelijevanja na Pregledu, kategorijama, sadržaju kategorije, editoru i pretrazi. Fizička mobilna tipkovnica ovom doradom nije dodatno provjerena.

- Završna dorada 29. 10.: potvrda spremanja neprikazanog sadržaja pokazuje kategoriju i radnju za njezino otvaranje. Nakon zatvaranja editora fokus prelazi na tu radnju kako bi poruka bila vidljiva i na uskom zaslonu nakon povratka s pomaknutog obrasca. Pogreška zapisa ne prikazuje potvrdu; greška naknadnog dohvata ostaje vidljiva.

## Dvije razine kategorija — 30. 10. 2026.

Dorada 31. 10.: podkategorije su pri ulasku u popis sažete; proširivanje je izričita radnja korisnika na strelici. Editor koristi autocapitalize=off zbog ponovljene prijave neželjenih velikih slova uz checkboxove; ručni Shift i provjera pravopisa ostaju dostupni.

Popis roditelja i uvučenih podkategorija koristi svijetlu neutralnu paletu i separatore. Otvaranje kategorije i sažimanje djece imaju odvojene dodirne površine najmanje 44 px, sa aria-expanded i aria-controls. Podkategorija ima tekstualnu oznaku; razlikovanje ne ovisi samo o boji. Nazivi i broj stavki se prelamaju bez horizontalnog prelijevanja.

Obrazac nudi nadređenu kategoriju i redoslijed; galerija 16 Lucide ikona skriva se iza sažetka s trenutačnom ikonom. Pretraga prihvaća hrvatske nazive i nazive ikona, bez razlike u dijakritici. Dostupno je 6 prigušenih boja; odabrana ikona i boja ostaju dosljedne u popisu, metapodacima i pretrazi. Nativni odabir kategorije prikazuje puni put roditelj / podkategorija.

Birač i pretraga koriste 16 px polja radi mobilnog unosa. Checkbox u editoru ima proširenu površinu oznake. Promjena ekrana vraća pomicanje na vrh i fokus na naslov, uključujući pretragu. Vizualni pregled proveden je na 320, 390, 800 i 1366 px; fizička Samsung tipkovnica nije ponovno testirana. Nova verzija je objavljena 30. 10. 2026.; nakon odobrenog čišćenja potvrđeni su i prazni produkcijski prikazi.

## Fokus i poveznice — 1. 11. 2026.

Otvaranje novog ili postojećeg zadatka, bilješke, plana, ideje, kategorije i pretrage ne fokusira tekstualno polje. Naslov dijaloga je programski fokusabilan; Tab, Shift+Tab, Escape, modalnost i povratak pokretaču ostaju dostupni. Editor izričito isključuje autofocus. Formatiranje čuva aktivan odabir, ali ne fokusira neaktivni editor. Unos poveznice je ugrađeni obrazac bez automatskog fokusa, s lokalnom validacijom i radnjama Primijeni/Zatvori; prazna adresa uklanja poveznicu.

Pohranjene oznake šest kategorijskih boja ostaju kompatibilne s bazom i kopijama. `categoryDisplayColor` ih prikazuje tamnijim, prigušenim tonovima na svijetloj podlozi; iste tonove koriste ikone i uzorci birača. Kontrasti ikona na bijeloj su najmanje 5,67:1. To nije migracija korisničkih podataka.

## Dorada aplikacijske ikone — 1. 11. 2026.

Znak t ima širi potez i veću crvenu točku radi čitljivosti na malim veličinama. Pozadina ostaje #F5F5F5, znak #2A2A2A, točka #E10600; simbol ostaje unutar središnje sigurne zone maskable ikone. SVG je izvor za PNG 192/512 px. Favicon, Apple touch i ikone u manifestu koriste oznaku ?v=2 radi osvježavanja predmemorirane slike. Tekstualni naziv trenio u sučelju ostaje isti.
