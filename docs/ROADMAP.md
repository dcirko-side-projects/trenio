# Trenio — redoslijed razvoja

Status 29. 10. 2026.: početni MVP i sva četiri proširenja sadržaja završeni su i objavljeni. Korisnik je potvrdio MVP na Samsungu Galaxy S25 Plus i laptopu. UI dorada i pronalaženje spremljenog sadržaja objavljeni su u završnom deploymentu `74ef153f`; provjere produkcijskih datoteka prolaze. Danas uvijek koristi Europe/Zagreb, uključujući putovanja, prema potvrdi korisnika 29. 10. Naknadno je dogovorena ručna rutina na privatnom OneDriveu; svježi izvoz i udaljena provjera prve kopije završeni su. Povijesne bilješke ispod opisuju pojedinačne faze; aktualni status je u CURRENT_STATE.md.

## 0. Odluke i priprema

- [x] Pregledati izvorni prompt i MD predloške.
- [x] Potvrditi naziv Trenio i početni rad uz internet.
- [x] Pripremiti sažetu projektnu dokumentaciju.
- [x] Odobriti granicu početnog MVP-a i tehnički stack.
- [x] Potvrditi računanje dana i ponašanje pri putovanju: uvijek Europe/Zagreb (29. 10.).
- [ ] Završiti korisnički pregled ostalih početnih pravila; odredište kopija namjerno ostaje otvoreno.
- [x] Potvrditi reprezentativni vizualni smjer.
- [x] Odobriti početak implementacije.

Prihvaćanje: odluke su izričito evidentirane, prijedlozi nisu predstavljeni kao odobreni zahtjevi.

## 1. Temelji i sigurno spremanje

- [x] Inicijalizacija odobrenog stacka, provjere kvalitete i osnovna navigacija.
- [x] Osnovne komponente prema design systemu, s mobitelom kao primarnim prikazom.
- [x] Identitet vlasnika, migracije i autorizacija podataka.
- [x] Spremanje, dohvat, vidljive greške i detekcija sukoba verzija.

Prijava, spremanje i sukob verzija provjereni su sa stvarnim vlasnikom u dvije kartice. SQL i javni API provjere prolaze. Korisnik je dodatno 28. 10. potvrdio unos i prijenos izmjena zadatka na dva fizička uređaja (Samsung Galaxy S25 Plus i laptop); sukob verzija na dva fizička uređaja korisnik je potvrdio u trećem krugu MVP provjere.

Prihvaćanje: vlasnik vidi iste testne podatke na oba uređaja; neprijavljen i drugi račun nemaju pristup; zastarjela izmjena ne prepisuje noviju.

## 2. Zadaci i pregled

- [x] Kategorije i unos zadatka samo s nazivom.
- [x] Uređivanje, planirani datum, rok, dovršavanje, arhiva i vraćanje.
- [x] Danas i Trenutno, uz prikvačivanje bez dupliciranja.
- [x] Brisanje i ponašanje pri brisanju kategorije.

Frontend tokovi provjereni su na primjerima u memoriji; zadaci, prikvačivanje, arhiva i vraćanje dodatno su provjereni na stvarnom računu. Kategorije su provjerene u izoliranom UI testu i SQL provjeri; korisnik ih je 28. 10. potvrdio u završnom krugu.

Prihvaćanje: isti zadatak dosljedno se mijenja u svim prikazima; testirani su prijelaz dana, zakašnjeli zadaci i vraćanje iz arhive. Arhiva je dio ove faze, ne kasnijeg poliranja.

## 3. Bilješke i početni MVP

- [x] Jednostavan editor, osnovno formatiranje i pretvaranje retka u checkbox.
- [x] Spremanje, prikvačivanje i ručna arhiva bilješki.
- [x] Izvoz podataka i provjera postupka oporavka u privremenim tablicama.
- [x] Mobilna i desktop provjera ključnih tokova, pristupačnost i greške veze.
- [x] Dogovor hostinga, provjera troška i autorizirani deployment.
- [x] Procjena i dodavanje PWA instalacije ako je odobrena.

Bilješka, checkbox, arhiva i izvoz provjereni su na stvarnom računu. Oporavak je provjeren bez mijenjanja izvornika, u privremenim tablicama. Manifest i ikone su pripremljeni; hosting je postavljen, a fizički mobitel i PWA instalaciju korisnik je potvrdio 28. 10.

27. 10.: prolazi 15 UI provjera na tri veličine zaslona i 6 izoliranih API/UI provjera. Objavljeno je na Cloudflare Pages Free; svih 8 datoteka potvrđeno je na HTTPS adresi. Prijava, spremanje, ponovno učitavanje i arhiva provjereni su u produkciji. Fizička mobilna provjera ostaje otvorena.

Prihvaćanje: zadaci i bilješke pogodni su za svakodnevno korištenje; svi kriteriji početnog MVP-a iz PRODUCT.md provjereni su i dokumentirani.

Tehnički pregled prije korisničkog testiranja proširen je na 27 UI i 10 izoliranih API/UI provjera, uz 13 domenskih testova. Ispravci zaključavanja editora, osvježavanja pri povratku, upozorenja nakon zapisa i dugih naziva objavljeni su i produkcijske datoteke provjerene. Preuzet je svježi izvoz koji prolazi validaciju. README sadrži kratke korisničke provjere i prijedlog rutine kopiranja. Fizičke uređaje i otvorena pravila treba potvrditi korisnik; to se ne zamjenjuje automatizacijom.

## 4. Proširenje sadržaja

28. 10.: planovi su implementirani, automatizirano provjereni i objavljeni Wranglerom nakon zastoja web prijenosa. Migracija je primijenjena; stvarno spremanje, ponovno učitavanje, napredak, arhiva/vraćanje i izvoz provjereni su kroz produkcijski frontend. SQL testovi i oporavak stvarnog izvoza s planom prolaze u privremenim tablicama uz ROLLBACK. Ideje, veze i pretraga nisu dio te promjene.

- [x] Planovi s tekstom i opcionalnim koracima; napredak samo kad postoji osnova.
- [x] Ideje i pretvorba u plan.
- [x] Povezivanje checkboxa i koraka sa zadacima, uključujući dovršavanje i brisanje izvora.
- [x] Pretraga kroz kategorije i sadržaj, s jasnim uključivanjem arhive.

Prihvaćanje: nema dvostrukih zadataka ni proturječnih stanja dovršenosti; veze ostaju dosljedne nakon promjena i brisanja.

Provjere se provode tijekom svake faze. Nema obveznih datuma ni potrebe za infrastrukturom koja nije opravdana stvarnim korištenjem.

28. 10., ideje: implementirane i objavljene na produkciji (d994e9fa). Prolaze 17 domenskih, 33 UI i 13 izoliranih API/UI provjera, lint i TypeScript/build. Migracija i SQL test pretvorbe prošli su na stvarnoj bazi. Produkcijski izvoz prije/poslije potvrđuje isti ID i očuvani sadržaj bez duplikata; oporavak ideje i pretvorenog arhiviranog plana prošao je u privremenim tablicama uz ROLLBACK. Sljedeće je povezivanje koraka/checkboxa sa zadacima, zatim pretraga; fizička provjera novih ideja nije još provedena.

28. 10., veze i pretraga: obje faze implementirane, provjerene i objavljene (35e4d27a). Stvarna baza potvrđuje atomsku vezu, oba smjera dovršavanja, verzije, zabranu duplikata i nekanonskih veza, očuvanje pri brisanju kategorije/zadatka/izvora te zatvoren pristup. Produkcijski frontend potvrđuje povezivanje, neovisan naslov, napredak, vraćanje, arhivu, pretragu teksta bez dijakritike i izričito uključivanje arhive. Povezani izvoz i oporavak u privremenim tablicama prolaze; stari sadržaj je usporedbom potvrđen nepromijenjenim. Prolaze 20 domenskih, 39 UI i 14 izoliranih API/UI provjera; završne male dorade dodatno su ciljano provjerene. Slijedi korisnička provjera novih mogućnosti na Samsungu i odluka o učestalosti/odredištu sigurnosnih kopija. Nema nove automatski odobrene funkcionalne faze.

## 5. Završni pregled i svakodnevna uporaba — 29. 10.

- [x] Objaviti dosljednu vizualnu doradu bez nove navigacije ili promjene baze.
- [x] Ispraviti pronalaženje spremljenog neprikvačenog sadržaja porukom o lokaciji i izravnim otvaranjem kategorije.
- [x] Potvrditi pravilo putovanja: Danas uvijek prati Zagreb.
- [x] Provjeriti build, tipove, lint, tokove rada i greške spremanja te sigurnost javnog API-ja.
- [x] Uvesti ponovljivu usporedbu produkcijskih datoteka s buildom (`npm run check:release`).
- [x] Ponovno validirati postojeću kopiju i pripremiti SQL za probni oporavak bez izmjene baze.
- [ ] Korisnički provjeriti nove tokove i UI na fizičkom Samsungu, uključujući tipkovnicu.
- [x] Odabrati odvojeno odredište i rutinu kopiranja — privatni OneDrive, tjedni izvoz i prije većih promjena (naknadno prihvaćeno 29. 10.).
- [x] Potvrditi svježi izvoz i uspješnu sinkronizaciju prve kopije na privatni OneDrive — kopija preuzeta iz oblaka, validirana i SHA-256 uspoređena s izvornikom (29. 10.).

Unutar dogovorenog funkcionalnog opsega nema preostale planirane razvojne faze. Automatizirane provjere ne zamjenjuju posljednju korisničku provjeru novih tokova. Offline rad, podsjetnici, ponavljanja, privici i automatske kopije zahtijevaju zasebno definiran opseg.

## Potencijalne nadogradnje za kasnije — 29. 10. 2026.

Popis mogućnosti za budući dogovor, a ne odobrenje implementacije ili raspored razvoja. Korisnik je izričito izdvojio podsjetnike; ostale stavke su prijedlozi. Prioriteti se određuju prema svakodnevnom korištenju.

1. **Podsjetnici za zadatke** — opcionalni datum i vrijeme obavijesti, uz mogućnost odgode i isključivanja. Prije razvoja dogovoriti kanale obavijesti, ponašanje zatvorene PWA aplikacije na Samsungu i vremensku zonu podsjetnika; postojeće pravilo Danas ostaje Europe/Zagreb.
2. **Ponavljajući zadaci** — dnevno, tjedno ili odabranim danima. Dogovoriti nastanak sljedećeg zadatka, propuštena ponavljanja i očuvanje povijesti dovršenih primjeraka.
3. **Automatske sigurnosne kopije** — validirani izvoz na privatni OneDrive, zadržavanje verzija i vidljiva obavijest ako kopiranje ne uspije. Dogovoriti sigurno izvršavanje i pristup bez administratorskih tajni u frontendu.
4. **Podsjetnik za ručni backup i probni oporavak** — dok kopiranje ostaje ručno, opcionalno podsjećanje na tjedni izvoz i tromjesečnu provjeru oporavka. Podsjetnik sam ne izrađuje kopiju.
5. **Uvoz i oporavak kroz sučelje** — pregled i validacija kopije prije potvrde. Najprije definirati vraćanje u prazan prostor; spajanje s postojećim sadržajem i rješavanje duplikata zasebna su odluka.
6. **Offline rad** — najprije očuvanje nacrta i jasan status spremanja, zatim prema potrebi unos bez mreže. Prije sinkronizacije offline izmjena definirati sukobe između uređaja.
7. **Privici** — slike i dokumenti uz sadržaj, uz dogovor veličine, privatnog pristupa, prostora i uključivanja datoteka u backup.
8. **Lakši prijenos iz Samsung Notesa** — istražiti dostupne izvoze i pripremiti pregled prije uvoza; ne pretpostavljati automatsku integraciju ni očuvanje svih formata.

Sve nadogradnje trebaju zadržati brz unos, mobilni prioritet i jednostavnu navigaciju. Ovim zapisom nisu aktivirani podsjetnici, rasporedi ni nove usluge.

## 6. Kategorije i mobilni QA — odobreno 30. 10. 2026.

- [x] Implementirati dvije razine uz očuvanje postojećih podataka, premještanje sadržaja i uređivanje redoslijeda.
- [x] Dodati pretraživ odabir usklađenih ikona i prigušenih boja.
- [x] Stabilizirati konfiguraciju/fokus editora i spriječiti kopiranje veze pri novom checkboxu.
- [x] Ponoviti cjelovite automatizirane i vizualne provjere; nadograditi stvarnu kopiju u izoliranoj bazi i provjeriti očuvanje.
- [x] Preuzeti i validirati svježu produkcijsku kopiju prije migracije.
- [x] Dobiti izričito odobrenje nakon automatske blokade DDL vježbe na stvarnoj bazi, zatim provesti vježbu, migraciju i objavu te provjeriti stvarno spremanje/izvoz.
- [x] Prema korisnikovu dodatnom zahtjevu obrisati sve postojeće kategorije i sadržaj uz prethodnu kopiju, sačuvati račun te provjeriti prazne prikaze i izvoz.
- [ ] Potvrditi ponašanje fizičke Samsung tipkovnice; automatizirani testovi ne mogu dokazati stanje njezina Shift/Caps načina.

Lokalno prolaze 25 domenskih, 54 UI i 16 izoliranih API/UI provjera, lint, tipovi/build i 5 SQL skripti. Produkcijska migracija je primijenjena; deployment 5d3a283f i svih 8 datoteka potvrđeni su. Stvarni SQL/UI tokovi i prazne zbirke nakon odobrenog čišćenja potvrđeni su.
