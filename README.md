# Avbrott på körlistor

En lokal prototyp för att välja körlistor och ange om hela eller delar av dem berörs av en störning. Kartan använder koordinater från `waste_routes_for_2026-05-07.json`; filen innehåller inga adresser eller kunduppgifter. Inget meddelande skickas från prototypen.

## Publicerad prototyp

GitHub Pages: [pppontus.github.io/sopbilsrutter-interface](https://pppontus.github.io/sopbilsrutter-interface/)

## Lokal kartkonfiguration

Kartan använder Mapbox Light. Skapa `.env.local` från `.env.example` och lägg den publika testtoken i `VITE_MAPBOX_ACCESS_TOKEN`. Filen är ignorerad av Git och ska inte versionshanteras.

## Kontroller

- `npm run dev` startar den lokala prototypen.
- `npm test` verifierar importerad körlistedata, tvåstegsflöde, polygonurval och sammanräkning.
- `npm run build` skapar det statiska bygget.
- `npm run test:sites` verifierar det medföljande hostingbygget.

## GitHub Pages

Workflow-filen bygger automatiskt `main` med basvägen `/sopbilsrutter-interface/` och publicerar `dist/client` till GitHub Pages. Mapbox-token läses från repository-hemligheten `VITE_MAPBOX_ACCESS_TOKEN` och versionshanteras inte. För en långlivad publicering bör token vara publik och URL-begränsad till Pages-adressen.
