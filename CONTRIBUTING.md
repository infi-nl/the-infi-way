# Meehelpen aan The Infi Way?

Leuk dat je mee wilt helpen aan The Infi Way!
We zijn altijd benieuwd naar nieuwe inzichten.

Heb je iets gezien wat beter kan?
Voel je dan vrij om [een issue te openen](https://github.com/infi-nl/the-infi-way/issues/new).
Ook [pull requests](https://github.com/infi-nl/the-infi-way/pulls) zijn van harte welkom!
Wil je The Infi Way lokaal draaien, lees dan verder.

## 🧑‍💻 Lokaal Developen

Om lokaal aan The Infi Way te developen heb je het volgende nodig:

- Een clone van deze repository
- [Node.js](https://nodejs.org) 16 (of hoger)

In de root van het project staat een `build.js` script, deze gebruiken we om de site te bouwen.
Dit script gebruik je als volgt:

```shell
./build.js
# Of
node build.js

# Om te rebuilden bij elke verandering in de template of content:
./build.js -w
```

Dit script gebruikt `template.html` en de bestanden uit de `content` map om in de `build` map een pagina per taal te genereren, met de Nederlandse variant als `index.html`.
In deze `build` map staan ook de assets zoals de stylesheet.
Als de build gerund is kan je de HTML bestanden uit deze map openen in je favoriete browser, en voilà!

De templating taal is een eigen lightweight implementatie, geïnspireerd door [Handlebars](https://handlebarsjs.com).
Ook deze code zit volledig in `build.js`.
