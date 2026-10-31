# Trenio — proizvod

Status: početni MVP i stack odobreni 25. 10. 2026. Prijava vlasnika, spremanje i sukob verzija provjereni su kroz stvarnu aplikaciju. Izvoz i probni oporavak podataka prolaze. Hosting je postavljen na https://trenio.pages.dev/; korisnik je potvrdio sva četiri kruga na Samsungu Galaxy S25 Plus i laptopu.

## Svrha i potvrđeni zahtjevi

Osobna aplikacija za jednog primarnog korisnika, kao zamjena za organizaciju obaveza u Samsung Notesu. Mobitel je primarni uređaj: sučelje se prvo oblikuje za dodir, mali zaslon i mobilnu tipkovnicu. Laptop je sekundarni prikaz istih podataka.

Naziv je Trenio. Korisnik je potvrdio da je za početak dovoljan rad uz internet. Uređivanje bez interneta nije zahtjev prve verzije.

Glavna navigacija: Pregled, Kategorije i brzo dodavanje. Pregled ima samo tabove Danas i Trenutno. Arhiva i pretraga dostupne su kao pomoćne radnje. Planovi i ideje ne dobivaju zasebne glavne navigacijske ekrane.

## Sadržaj i ponašanje

- Kategorije korisnik stvara i uređuje. Mogu sadržavati različite vrste sadržaja; prikaz prati sadržaj i skriva prazne sekcije.
- Zadatak ima naziv, opcionalni planirani datum i zaseban opcionalni rok. Podržava uređivanje, brisanje, dovršavanje, arhivu, vraćanje i prikvačivanje.
- Naziv je dovoljan za unos zadatka. Predloženo razrješenje kategorije: neobavezna kategorija, prikaz Bez kategorije, a pri unosu unutar kategorije ona je unaprijed odabrana.
- Danas prikazuje aktivne zadatke planirane za danas, s današnjim rokom i s isteklim rokom. Jedan zadatak prikazuje se samo jednom unutar tog taba.
- Trenutno prikazuje ručno prikvačene zadatke, planove, ideje i bilješke. Uklanjanje prikvačivanja ne briše izvornu stavku. Prikazi referenciraju isti zapis.
- Dovršeni zadaci nestaju iz aktivnih prikaza i dostupni su u arhivi. Vraćanje ponovno aktivira isti zapis.
- Bilješke podržavaju tekst, naslove, osnovno formatiranje, liste, linkove i checkliste. Postojeći redak može se pretvoriti u checkbox i označiti dovršenim.
- Checkbox nije automatski samostalan zadatak. Može izričito stvoriti povezani zadatak.
- Planovi kombiniraju tekst i korake. Napredak ima smisla samo kada postoje strukturirani koraci. Koraci se mogu povezati sa zadacima.
- Ideje imaju naziv, opis i opcionalnu kategoriju, bez obveznih datuma; mogu se pretvoriti u plan.
- Bilješke i planovi mogu se ručno arhivirati. Pretraga obuhvaća kategorije i sadržaj prema pravilima niže.

## Odobrena granica početnog MVP-a

Prva svakodnevno upotrebljiva verzija uključuje:

1. Prijavu vlasnika, spremanje i dohvat podataka na oba uređaja.
2. Kategorije i zadatke, s brzim unosom, datumima, arhivom i vraćanjem.
3. Pregled Danas i Trenutno.
4. Jednostavne bilješke s osnovnim editorom i pretvaranjem retka u checkbox.
5. Responzivno sučelje, jasne greške spremanja i osnovni izvoz podataka.

Nadogradnje objavljene 28. 10.: planovi, ideje, povezivanje checkboxa i koraka sa zadacima, pretvorba ideje u plan i pretraga.

Izvan prve verzije: AI asistent, timska suradnja, napredna analitika, gamifikacija, složene integracije i sinkronizacija offline izmjena. Podsjetnici, ponavljajući zadaci, privici i automatski uvoz iz Samsung Notesa nisu definirani zahtjevi.

Korisnik je 29. 10. zatražio bilježenje mogućih nadogradnji za kasnije i posebno izdvojio podsjetnike. Kandidati i pitanja za definiranje opsega nalaze se u odjeljku Potencijalne nadogradnje za kasnije u ROADMAP.md. Popis nije odobrenje implementacije.

## Planovi — prva nadogradnja

Nakon uspješnog korisničkog testiranja 28. 10. korisnik je zatražio nastavak. Prva nadogradnja obuhvaća plan s nazivom, slobodnim tekstom i opcionalnim checkbox koracima. Napredak se računa iz označenih koraka; bez koraka nema postotka. Plan pripada kategoriji ili Bez kategorije, može se prikvačiti u Trenutno, ručno arhivirati i vratiti. Nema nove glavne navigacije. Koraci se mogu izričito povezati sa samostalnim zadacima prema pravilima niže. Ideje i pretraga također su implementirane.

## Početne pretpostavke ponašanja

Pravila kategorija, kalendarskih dana i prikvačivanja ispod koriste se u probnom prikazu kao dokumentirane početne pretpostavke. Njihov detaljan korisnički pregled još nije proveden. Pravila povezanih zadataka implementirana su u nadogradnji ispod; ponašanje pri putovanju potvrđeno je 29. 10.

- Nedovršeni zadatak s prošlim planiranim datumom ostaje u Danas u skupini Ranije planirano. Ne mijenjati mu automatski datum.
- Datumi planiranja i roka predstavljaju kalendarski dan, bez sata. Danas se uvijek računa u zoni Europe/Zagreb, i tijekom putovanja u drugu vremensku zonu (izričita potvrda korisnika 29. 10. 2026.).
- Dovršavanje skriva i prikvačeni zadatak. Prikvačenost se zadržava pa se vraćanjem ponovno pojavljuje u Trenutno.
- Arhiviranje bilješke ili plana skriva ih iz Trenutno uz očuvano prikvačivanje.
- Brisanje kategorije ne briše sadržaj; sadržaj prelazi u Bez kategorije.
- Povezani zadatak upravlja stanjem dovršenosti izvornog checkboxa ili koraka. Oba prikaza mijenjaju isto stanje, a naslov zadatka nakon pretvorbe uređuje se zasebno.
- Brisanje povezanog zadatka prekida vezu i ostavlja lokalni korak s posljednjim stanjem. Brisanje izvora ostavlja samostalni zadatak bez veze. Promjene veze moraju biti atomske.
- Pretvorba ideje u plan mijenja vrstu istog sadržaja i čuva identitet umjesto stvaranja kopije.

## Kriteriji prihvaćanja MVP-a

- Sam naziv dovoljan je za zadatak; isti zapis može biti u kategoriji, Danas i Trenutno bez dupliciranja.
- Dovršavanje i vraćanje dosljedno ažuriraju sve prikaze.
- Bilješka se može urediti, spremiti i ponovno otvoriti na drugom uređaju; redak se može pretvoriti u checkbox.
- Neuspješno spremanje ne prikazuje uspjeh niti briše korisnikov unos.
- Zastarjela izmjena s drugog uređaja ne prepisuje noviju bez upozorenja.
- Privatnim podacima ne može pristupiti neprijavljena ili druga osoba.
- Ključni tokovi rade na mobitelu, laptopu i tipkovnicom.
- Izvoz sadrži i arhivirane podatke; postupak oporavka provjeren je prije oslanjanja na aplikaciju.

Oporavak iz JSON kopije priprema se lokalnim alatom i izvodi kroz SQL Editor, uz provjeru da je odredišni prostor prazan. Postojeći podaci ne brišu se ni prepisuju. Zadani način alata služi vježbi oporavka u privremenim tablicama. Uvoz kroz korisničko sučelje nije dio trenutačne implementacije.

## Ideje — nadogradnja 28. 10.

Ideja se dodaje radnjom Nova ideja; dovoljan je naziv, opis i kategorija su opcionalni, datumi se ne traže. Koristi postojeći editor, prikvačivanje, arhivu i vraćanje te zasebnu nepraznu sekciju unutar kategorije, Trenutno i Arhive. Pretvori u plan dostupno je spremljenoj ideji: jednim spremanjem mijenja vrstu istog zapisa i čuva sadržaj (uključujući otvorene izmjene), kategoriju, arhivu i prikvačivanje. Greška ili sukob verzija ostavlja ideju i lokalni unos otvorenima. Veze sa zadacima i pretraga implementirane su prema pravilima niže.

## Povezani zadaci i pretraga — 28. 10.

Spremljeni checkbox bilješke/ideje ili korak plana može izričito stvoriti jedan povezani zadatak. Radnja atomski sprema otvorene izmjene izvora i stvara zadatak u istoj kategoriji, s nazivom iz teksta koraka, bez zadanih datuma ili prikvačivanja. Prazan checkbox ne stvara zadatak. Uređivanje naslova zadatka ne mijenja tekst izvora. Checkbox primjenjuje stanje pri spremanju; dovršavanje i vraćanje zadatka odmah mijenjaju isti checkbox i napredak plana. Brisanje zadatka čuva lokalni checkbox s posljednjim stanjem, a uklanjanje checkboxa ili cijelog izvora čuva samostalni zadatak. Arhiva izvora sama ne dovršava zadatke. Pogreška ili sukob verzije čuva otvoreni unos; nema tihog prepisivanja.

Pretraga je pomoćna radnja povećala, bez nove glavne navigacije. Pretražuje sve kategorije, nazive zadataka i svih vrsta sadržaja te tekst editora. Sve upisane riječi moraju se pojaviti; veličina slova i hrvatska dijakritika ne mijenjaju rezultat. Prazan upit prikazuje aktivni sadržaj. Arhiva je isključena dok korisnik ne uključi Uključi arhivu; dovršeni zadaci i arhivirani sadržaj tada imaju oznaku Arhivirano. Kategorije koje odgovaraju upitu mogu se izravno otvoriti.

## Pronalaženje spremljenog sadržaja i kopije — 29. 10.

Ideje, planovi i bilješke uvijek se nalaze u odabranoj kategoriji ili Bez kategorije. Danas prikazuje samo zadatke, a Trenutno samo prikvačene stavke. Ako spremljeni sadržaj nije vidljiv u trenutačnom Pregledu, potvrda spremanja navodi kategoriju i nudi Otvori kategoriju. Filtriranje, prikvačivanje i navigacija ostaju postojeći; greška spremanja ne prikazuje uspjeh ni novu poveznicu, a upozorenje o grešci naknadnog dohvata ima prednost pred potvrdom.

Korisnik je 29. 10. prihvatio rutinu kopiranja na privatni OneDrive, u mapu Trenio / Sigurnosne kopije; fakultetski račun se ne koristi. Ručni izvoz radi se jednom tjedno i prije većeg brisanja ili reorganizacije. Čuva se 8 posljednjih tjednih kopija i po jedna mjesečna za posljednjih 6 mjeseci. Prva kopija se validira, a probni oporavak provjerava svaka 3 mjeseca. To je dogovorena ručna rutina; automatsko izvođenje, podsjetnici, automatsko brisanje i uvoz kroz UI nisu uvedeni.

## Kategorije — odobrena nadogradnja 30. 10. 2026.

Od 31. 10. popis Kategorije otvara se sa sažetim podkategorijama. Korisnik ih zasebno proširuje ili sažima strelicom uz roditelja; otvaranje roditelja ostaje zasebna radnja.

Najviše dvije razine: kategorija može imati svoj sadržaj i podkategorije. Naziv mora biti jedinstven među kategorijama istog roditelja. Uređivanje uključuje naziv, roditelja, redoslijed, odabranu Lucide ikonu i boju. Kategorija s djecom ne može postati podkategorija dok djeca nisu premještena. Sadržaj se premješta odabirom punog puta kategorije u postojećem obrascu, bez kopiranja zapisa.

Brisanje podkategorije čuva njezin sadržaj u Bez kategorije. Brisanje roditelja čuva njegove podkategorije kao samostalne kategorije sa svojim sadržajem; samo izravni sadržaj roditelja prelazi u Bez kategorije. Ako naziv promovirane kategorije već postoji, dodaje se kratak ID dodatak. Redoslijed se bira pristupačnim poljem u obrascu; povlačenje nije potrebno za uporabu na mobitelu.

Nadogradnja je nakon izričitog odobrenja primijenjena i objavljena 30. 10. 2026. Korisnik je zatim zatražio čišćenje postojećeg sadržaja: svi zapisi i kategorije obrisani su uz prethodno validiranu lokalnu kopiju, a račun i prijava su sačuvani.
