# Gitaarbouw

Een lokale 3D-configurator om het ontwerp van je zelfgebouwde elektrische gitaar te visualiseren. Je draait en zoomt het model met de muis en ziet elke keuze direct terug.

Alles draait op je eigen computer. three.js en het lettertype staan in `node_modules`, er worden geen externe servers of CDN's gebruikt. De gitaar wordt volledig procedureel opgebouwd, dus er zijn ook geen 3D-bestanden nodig.

**Online:** https://samuelvdheide.github.io/gitaarbouw/

## Starten

Je hebt [Node.js](https://nodejs.org) 20 of nieuwer nodig.

```bash
npm install      # eenmalig
npm run dev      # open http://127.0.0.1:5173
```

Na `npm install` werkt alles ook zonder internet. Een vaste versie maken en openen kan met:

```bash
npm run build
npm run preview  # open http://127.0.0.1:4173
```

## Online zetten

De site staat op GitHub Pages. Na wijzigingen publiceer je een nieuwe versie met:

```bash
npm run deploy
```

Dit draait de tests, bouwt de site en zet het resultaat op de `gh-pages`-branch; GitHub Pages werkt de site daarna binnen een minuut bij. De broncode staat op de `develop`-branch.

## Wat je kunt kiezen

| Onderdeel | Opties |
| --- | --- |
| Model | Fender-stijl: Stratocaster, Telecaster, Jazzmaster. Gibson-stijl: Les Paul, SG, Flying V. PRS SE-stijl: Custom 24, McCarty 594 Singlecut, Silver Sky |
| Hout | Body (els, essen, mahonie, linde, walnoot, korina, esdoorn), topfineer (gevlamd of gewolkt esdoorn), hals en toets |
| Kleur | Puur hout (onbehandeld, zonder lak of glans), naturel, transparant, dekkend of sunburst, met klassieke lakkleuren of een eigen kleur. Slagplaat in wit, zwart, mint, crème, schildpad of parelmoer |
| Pickups | SSS, HSS, HH, SS, P-90 of één humbucker, met zwarte, witte, crème, zebra of metalen kappen |
| Knoppen | Strat-knop, dome, top hat, speed knob, witch hat of lampshade, in zes kleuren. Metaaldelen in chroom, nikkel, zwart of goud |

Met **Klassieke uitvoering laden bij modelwissel** springt een nieuw model naar zijn bekende combinatie (bijvoorbeeld een Les Paul in cherry sunburst met top hats). Zet het uit om je eigen keuzes te houden. Je ontwerp wordt automatisch in de browser bewaard.

Onder in beeld staan de bouwmaten van het model: schaallengte, aantal frets, halsverbinding, brugtype en de buitenmaten van de body.

## Nauwkeurigheid en bronnen

De modellen zijn gemeten uit echte 1:1-mallen en fabrikanttekeningen, niet op het oog getekend. Elk gemeten model heeft een referentiebestand in `src/data/references/` met de contour, de posities van hals, brug, elementen, knoppen, slagplaat en jack, de kop met stemassen, en de bronnen (URL's) plus per veld hoe zeker de waarde is.

| Model | Belangrijkste bron |
| --- | --- |
| Stratocaster | Fender-fabriekstekening 019574 (body 1962), 1:1; arm- en buikcontour uit dezelfde tekening |
| Telecaster | Terry Downs 1:1 CAD-tekening en Fender AVII '51 Blackguard-tekening |
| Jazzmaster | Electric Herald 1:1-mallen en Fender-servicetekeningen |
| Les Paul | John Catto 1958-60 1:1-mallen, inclusief carve-doorsneden, halshoek 4° en kophoek 17° |
| SG | 1:1 SG-vectormal met gemeten afschuiningen voor en achter |
| Flying V | 1:1 Flying V-vectormal ('83), slagplaat en onderdelen uit gekalibreerde Gibson-foto's van de '67-uitvoering |
| PRS SE Custom 24 | PRS' eigen productfoto, geschaald op alle frets (spreiding < 0,5 mm), gecontroleerd met een 1:1 USA-tekening |
| PRS SE McCarty 594 Singlecut | PRS' eigen productfoto, geschaald op de frets |
| PRS SE Silver Sky | PRS' eigen productfoto, geschaald op 22 frets; kop volgens PRS-designoctrooi USD823376 |

Hardware (bruggen, elementen, knoppen, schakelaars, stemmechanieken, halsdiktes, fretdraad, inlays) komt uit `src/data/hardware.js`, afgeleid van tekeningen van onder meer Gotoh, StewMac, Seymour Duncan, DiMarzio en Grover.

Voor de PRS-modellen bestaan geen openbare vectormallen; die contouren zijn uit rechte productfoto's getraceerd en daardoor iets minder exact dan de Fender- en Gibson-modellen. Geschatte waarden (zoals carve-hoogtes) staan per veld gemarkeerd in de referentiebestanden. Het Model-tabblad toont per model de bron. Ook gemeten contouren zijn een visualisatie, geen werkmal: gebruik voor het echte zaag- en freeswerk altijd een maatvaste mal.

## Bediening

- Slepen: draaien
- Scrollen of knijpen: zoomen
- Rechtermuisknop slepen: verschuiven
- Knoppen onderin: vaste camerastandpunten, automatisch draaien en een PNG-foto van je ontwerp opslaan

## Projectstructuur

```
src/
  data/       modellen (contouren, maten), hout, lakken, onderdelen
  geometry/   pure 2D-wiskunde: splines, polygonen, afstandsvelden, fretposities
  state/      ontwerp-state, validatie en opslag in localStorage
  textures/   procedurele pixels voor houtnerf, lak, sunburst en celluloid
  guitar/     opbouw van het 3D-model per onderdeel
  scene/      three.js-weergave, camera, studiobelichting
  ui/         paneel, tabbladen en overlay op de 3D-weergave
```

Een model toevoegen: maak een bestand in `src/data/models/` naar het voorbeeld van de bestaande modellen en registreer het in `src/data/models/index.js`. De tests in `src/guitar/layout.test.js` controleren automatisch of pickups, knoppen, slagplaat en hals binnen de nieuwe body vallen.

## Testen en controleren

```bash
npm test          # unit tests (incl. controle dat elk model met elke optie opbouwt)
npm run coverage  # met dekkingsrapport
```

Modellen visueel naast elkaar bekijken kan op `http://127.0.0.1:5173/dev/preview.html?view=front&models=strat,lespaul` (views: `angled`, `front`, `back`, `side`, `headstock`, `body`; voeg `&finish=raw` toe voor puur hout). Met de dev-server aan maakt dit er een PNG van via je lokale Chrome:

```bash
npm run check:models -- controle.png "view=angled&models=strat,tele,lespaul"
```
