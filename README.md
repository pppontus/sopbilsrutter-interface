# Avbrott på körlistor

En lokal, helt syntetisk prototyp för att markera vilka hämtställen som berörs av ett avbrott och förhandsgranska ett kundmeddelande.

## Publicerad prototyp

GitHub Pages: [pppontus.github.io/sopbilsrutter-interface](https://pppontus.github.io/sopbilsrutter-interface/)

## Lokal kartkonfiguration

Kartan använder Mapbox Light. Skapa `.env.local` från `.env.example` och lägg den publika testtoken i `VITE_MAPBOX_ACCESS_TOKEN`. Filen är ignorerad av Git och ska inte versionshanteras.

## Kontroller

- `npm run dev` startar den lokala prototypen.
- `npm test` verifierar demodata, polygonurval och sammanräkning.
- `npm run build` skapar det statiska bygget.
- `npm run test:sites` verifierar det medföljande hostingbygget.

## GitHub Pages

Workflow-filen bygger automatiskt `main` med basvägen `/sopbilsrutter-interface/` och publicerar `dist/client` till GitHub Pages. Mapbox-token läses från repository-hemligheten `VITE_MAPBOX_ACCESS_TOKEN` och versionshanteras inte. För en långlivad publicering bör token vara publik och URL-begränsad till Pages-adressen.
