# Spotify soundtrack discovery

Reviewed: 2026-10-19. Route: `/soundtracks`, available from the application navigation in English and Brazilian Portuguese. No new environment variables, credentials, account connection, backend routes or deployment configuration are required.

## What actually works

All 56 encounter selections are visible. **39 verified direct Spotify track links** and [Sony Music Japan's official Naruto playlist](https://open.spotify.com/playlist/7wkGN40FnYhlmKNMNMc5Ng) open externally. Search includes character, anime, title, credited artists/composers and Girei/Senya aliases. Filters distinguish linked references, pending links and KeyForge originals. The page makes no Spotify requests until the user follows a link, plays no media, embeds no player and never changes battle music. The owner can use this link-only feature without a Spotify developer application or Premium subscription. Listening itself remains subject to Spotify account, regional and service restrictions.

By default links use `target="_blank"` and `rel="noopener noreferrer"`. An optional, unchecked-by-default control requests a separate 480×720 browser window on a direct click. The new window opens blank, has its opener removed synchronously, then navigates to the allowlisted Spotify URL. If blocked or denied, the ordinary anchor opens a normal tab instead. Modified clicks retain browser behavior. Browsers may choose a tab regardless of the requested window dimensions; this cannot be guaranteed. There is no autoplay, track synchronization, account connection, saved Spotify state or playback control. The external Spotify site may offer its own app-opening behavior.

The existing **56 original automatic battle recordings** and optional browser-local MP3 assignments are unchanged. No official anime recordings have been installed or licensed for in-game playback by this change. Reference links do not grant synchronization or distribution rights.

## Verification and gaps

[spotifyReferences.json](../src/lib/audio/spotifyReferences.json) stores the observed track URI, recording artist, parent album, public release metadata evidence URL and verification date for each linked encounter. Public Spotify release metadata was compared with the selections and primary publisher releases in [the official catalog](OFFICIAL_SOUNDTRACK_CATALOG.md). Evidence URLs may point to public album embed metadata inspected during research; no embed is included in KeyForge. No Web API credentials, previews, audio streams, album images or media files were retrieved for this feature. IDs were taken from the actual release metadata, not generated from names. Spotify verification establishes a recording reference, not global playback availability or independent per-track composition credits.

Official publisher cross-checks include [Demon Slayer's soundtrack releases](https://kimetsu.com/anime/soundtrack/), [Sony's Solo Leveling release link](https://soundtracks.lnk.to/sololeveling), [Jujutsu Kaisen's first-season release](https://jujutsukaisen.jp/music/1st_02.php), [its second-season release](https://jujutsukaisen.jp/music/2nd_01.php), and [One Piece GEAR5](https://avex.jp/onepiece/products/musicDetail.php?id=1019892). Existing catalog source records retain the other publisher references.

**Nine Spotify references remain unresolved:** the eight selected Dragon Ball recordings (Krillin, Piccolo, Vegeta, Frieza, Cell, Gohan, Broly and Goku) have no exact original-recording Spotify link verified in this review; Kokushibo still has no individually verified official cue. These are research gaps, not claims that Spotify lacks the recordings in every region. No cover, alternate cue, search page or fabricated album ID was substituted. **Eight original KeyForge encounters are not applicable** to the official anime Spotify catalog.

Composition-credit uncertainty is separate: Nobara, Megumi, Todo, Usopp, Doflamingo and Katakuri now have verified Spotify recordings, while the existing catalog's individual composer uncertainty remains visible. Kokushibo also remains unresolved. Recording-artist credits must not silently become composer credits. Editorial assignments, including Madara's selected boss cue and later Solo Leveling encounters, do not assert exclusive canonical character themes.

## A separate future Web API application

This is guidance only; no OAuth or Web API implementation is included. A future Spotify application must have its own compliant, non-game purpose. A separate deployment must not be used to bypass restrictions or synchronize music with KeyForge. The [Developer Policy](https://developer.spotify.com/policy) prohibits game applications, synchronization with visual media and mixing Spotify audio. Premium membership or an approved quota does not itself authorize those uses. Seek Spotify policy review before designing any integration; independently licensed masters require their own synchronization/distribution permission.

As of this review, [February 2026 development-mode changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) require the application owner to maintain Premium. The current owner's Free account therefore cannot enable that developer mode. Limited authorized-user access is not a public launch entitlement; consult [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) and obtain any required approval. The [July 2026 update](https://developer.spotify.com/blog/2026-07-23-web-api-quota-updates) subsequently raised the Client ID limit to 25 per developer and shares quota across that account. Do not rely on the earlier one-Client-ID limit. Handle 429 responses and Retry-After rather than creating extra applications to avoid quotas.

For an independently approved application needing user data, use [Authorization Code with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), a cryptographically random verifier/challenge and CSRF state tied to the initiating session. Request only essential scopes. Validate callback state, handle denial/revocation, rotate sessions, and keep refresh/access tokens out of URLs, logs and browser local storage. A confidential server implementation may also use its server-only client secret; a public PKCE client must not embed one. Client credentials do not authorize access to a user's private data. Do not request playback scopes for this discovery page.

For that **separate Vercel project**, register a stable HTTPS callback, for example `https://your-separate-app.example/api/spotify/callback`, exactly in the Spotify dashboard. Configure production and preview environments separately; avoid arbitrary preview-host callbacks and wildcards. [Redirect URI rules](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri) require HTTPS except explicit loopback IPs for development; `localhost` is not accepted. Suggested future server configuration names are `SPOTIFY_CLIENT_ID`, `SPOTIFY_REDIRECT_URI`, `APP_ORIGIN`, `SESSION_SECRET`, and `SPOTIFY_CLIENT_SECRET` only for a confidential-server flow. Client ID and redirect URI are public identifiers; secrets and tokens must never use `NEXT_PUBLIC_*`. No such values are needed or added to KeyForge. Use secure HttpOnly session cookies, appropriate SameSite/CSRF protection, minimal server-side token retention, and published privacy/deletion procedures. Confirm current platform terms again before implementation.

## Local verification

```powershell
npx tsx --test src/lib/audio/soundtrackDiscovery.test.ts src/app/soundtracks/page.test.tsx
npx tsx --test src/lib/audio/spotifyWindow.test.ts
npm test
npx tsc --noEmit --incremental false
npm run lint
npm run i18n:audit
npm run audit:audio -- --require-assets
npm run build
```

Optional real-browser checks use the existing Playwright installation (no added dependency). Start the production build on loopback in another terminal, then run:

```powershell
npm start -- --hostname 127.0.0.1 --port 3141
# In another terminal, set KEYFORGE_PLAYWRIGHT_MODULE to your installed Playwright module if not resolvable:
node scripts/verify-soundtrack-discovery.mjs
```

The browser script covers EN/PT-BR at 360, 768, 1280 and 1440px, all 56 cards, 39 safe track links plus the official playlist, filters/search, empty/original/pending states, keyboard focus, navigation geometry and absence of unsolicited external media requests. Separate-window and blocked-window fallback navigation are tested against intercepted local fixtures, including a null opener. Backend calls are also local fixtures, not live service verification. Screenshots and results go to a temporary directory. This does not authenticate a Spotify account, verify regional listening rights or test a deployed Vercel environment.

## Encounter links

Completed local validation (2026-10-19): 162 unit tests, standalone TypeScript, full ESLint, i18n parity (1,474 keys per language), strict audio asset/license audit (56 mappings), production build, and all eight rendered EN/PT-BR viewport checks passed. The production build retains the pre-existing `metadataBase` warning. No push, deployment, Spotify login or live regional playback validation was performed.

The table below is the reviewed snapshot. The JSON registry is the source used by the interface; composition credits and assignment context remain in the official catalog.

| Character | Anime / world | Selected official title | Spotify reference / gap |
|---|---|---|---|
| Naruto Uzumaki | Naruto | NARUTO Main Theme | [Track](https://open.spotify.com/track/5kKloaKFvAuDNFi8m52hxy) |
| Sakura Haruno | Naruto | サクラのテーマ | [Track](https://open.spotify.com/track/2MrkabAji7QUZRtiCieEbd) |
| Rock Lee | Naruto | Rock Lee's Theme | [Track](https://open.spotify.com/track/6eETsNH5bpHYj86duqpNOo) |
| Kakashi Hatake | Naruto | カカシのテーマ | [Track](https://open.spotify.com/track/72k3g6bzRrapRO8D1C2GjL) |
| Sasuke Uchiha | Naruto | サスケのテーマ | [Track](https://open.spotify.com/track/3EJhFCuGZf23tMqhMQeLNL) |
| Itachi Uchiha | Naruto Shippuden | 千夜 | [Track](https://open.spotify.com/track/2VWDk6GcnMaysTpVQH121M) |
| Pain (Nagato) | Naruto Shippuden | 儀礼 | [Track](https://open.spotify.com/track/6MBB1w8rl9XEGqrfWcBq4I) |
| Madara Uchiha | Naruto Shippuden | 難攻不落 | [Track](https://open.spotify.com/track/7uxsHnD9Xcy7H0x7pQG9Rc) |
| Yuji Itadori | Jujutsu Kaisen | 拳にのせろ | [Track](https://open.spotify.com/track/6Ibty0iH00R5cqZxL9MjID) |
| Nobara Kugisaki | Jujutsu Kaisen | 芻霊呪法「共鳴り」 | [Track](https://open.spotify.com/track/3UUMOv0BGV1QQCyoQBkpGF) |
| Megumi Fushiguro | Jujutsu Kaisen | 呪術師・伏黒恵 | [Track](https://open.spotify.com/track/7JkakKNpZ1iPgisu6mXEwP) |
| Aoi Todo | Jujutsu Kaisen | 漢・東堂葵 | [Track](https://open.spotify.com/track/1XNBIkDz9JsqdJq2VAlIGs) |
| Kento Nanami | Jujutsu Kaisen | 7:3 | [Track](https://open.spotify.com/track/3FkHIhQdbqwX736X3gCYx3) |
| Toji Fushiguro | Jujutsu Kaisen | 伏黒甚爾 | [Track](https://open.spotify.com/track/1iQLOGuozZAEuEHkmv7F7K) |
| Ryomen Sukuna | Jujutsu Kaisen | 両面宿儺 | [Track](https://open.spotify.com/track/7qiMofuY7Is9wbaiLuDnFb) |
| Satoru Gojo | Jujutsu Kaisen | 虚式「茈」 | [Track](https://open.spotify.com/track/4P7pNVKPrgNFWEOzkQZCQH) |
| Krillin | Dragon Ball | チームドラゴンのテーマ | Exact selected recording link unverified |
| Piccolo | Dragon Ball | 自分を信じて | Exact selected recording link unverified |
| Vegeta | Dragon Ball | ベジータの強さ | Exact selected recording link unverified |
| Frieza | Dragon Ball | ゴールデンフリーザのテーマ | Exact selected recording link unverified |
| Cell | Dragon Ball | 手強い敵 | Exact selected recording link unverified |
| Gohan | Dragon Ball | 戦士の魂 | Exact selected recording link unverified |
| Broly | Dragon Ball | ブロリー戦闘開始 | Exact selected recording link unverified |
| Son Goku | Dragon Ball | 我らがヒーロー、孫悟空 | Exact selected recording link unverified |
| Usopp | One Piece | ウソップ、やばいぞ! | [Track](https://open.spotify.com/track/4bmn3M5NfQ2ehaT3TasiwD) |
| Sanji | One Piece | サンジVS.クイーン | [Track](https://open.spotify.com/track/3Zs4BiussNzA2uQps7gguN) |
| Roronoa Zoro | One Piece | ゾロVS.キング | [Track](https://open.spotify.com/track/5nX5fZLYwBUxYhiye6m4VJ) |
| Trafalgar Law | One Piece | KROOM | [Track](https://open.spotify.com/track/6g5kATV3yQ6Igda2gb3gJ5) |
| Donquixote Doflamingo | One Piece | ドンキホーテ・ドフラミンゴ | [Track](https://open.spotify.com/track/5ZRKVBg6DHniB4joIsey4y) |
| Charlotte Katakuri | One Piece | カタクリのテーマ | [Track](https://open.spotify.com/track/2WWc5nAx3baWLnZRH251SA) |
| Kaido | One Piece | 終結、ルフィVSカイドウ | [Track](https://open.spotify.com/track/4i9PGXuJl9DMq6lcxGw7PD) |
| Monkey D. Luffy | One Piece | おれの最高地点 | [Track](https://open.spotify.com/track/0chKjPMdnbJ1KXiSjbb267) |
| Dungeon Guardian | Solo Leveling | DunGeoN | [Track](https://open.spotify.com/track/3h5Hxi8qKMNHxwniRljrcB) |
| Cerberus | Solo Leveling | Hunter→Monster | [Track](https://open.spotify.com/track/48sQeZIatG6jC0kD7zgzHs) |
| Blood-Red Commander Igris | Solo Leveling | [Solo-Leveling]SymphonicSuite-Lv.6 | [Track](https://open.spotify.com/track/6TfXn99pKgQoXiJ7mmueoZ) |
| Iron | Solo Leveling | [Solo-Leveling]SymphonicSuite-Lv.2 | [Track](https://open.spotify.com/track/3tmFLWU24qez75dl9WCx8o) |
| Tusk | Solo Leveling | [Solo-Leveling]SymphonicSuite-Lv.7 | [Track](https://open.spotify.com/track/6oiDEdfAOo0dFqoq5o5t5N) |
| Beru | Solo Leveling | [Solo-Leveling]SymphonicSuite-Lv.8 | [Track](https://open.spotify.com/track/5F3RJKpdeoqQivMWetb7ma) |
| Bellion | Solo Leveling | [Solo-Leveling]SymphonicSuite-Lv.10 | [Track](https://open.spotify.com/track/6XK5JS7DDlVdzkHqd7rmnT) |
| Sung Jin-Woo | Solo Leveling | DARK ARIA | [Track](https://open.spotify.com/track/3SR85l1lZDNPr68rkAlYOy) |
| Zenitsu Agatsuma | Demon Slayer | 霹靂一閃 六連～鬼殺隊として | [Track](https://open.spotify.com/track/7ALIqX1PdZ1awygO2Ixlxm) |
| Inosuke Hashibira | Demon Slayer | 嘴平伊之助 | [Track](https://open.spotify.com/track/3xRMIECOYhIsD8aJ0Oryd5) |
| Shinobu Kocho | Demon Slayer | 蟲柱のテーマ -OST ver.- | [Track](https://open.spotify.com/track/1PNF5KhgKk0tZOZ7EGzaFd) |
| Kyojuro Rengoku | Demon Slayer | 煉󠄁獄の死闘 | [Track](https://open.spotify.com/track/1cEqOb78f1El1ErhQj8jeQ) |
| Akaza | Demon Slayer | 煉󠄁獄と猗窩座の戦い | [Track](https://open.spotify.com/track/19XwEQeVwyeXrNsaETN0bx) |
| Gyutaro & Daki | Demon Slayer | 妓夫太郎の猛攻～譜面の完成 | [Track](https://open.spotify.com/track/0POXT5xS0X7GzhfrRtGZT0) |
| Kokushibo | Demon Slayer | Cue unresolved | Cue and Spotify reference unresolved |
| Muzan Kibutsuji | Demon Slayer | 鬼舞辻無惨 -OST ver.- | [Track](https://open.spotify.com/track/5LRPNc9ajuHiAOV1Xrzaws) |
| Cipher Initiate | KeyForge | KeyForge original | Not applicable: original encounter |
| Lexicon Warden | KeyForge | KeyForge original | Not applicable: original encounter |
| Rhythm Weaver | KeyForge | KeyForge original | Not applicable: original encounter |
| Accuracy Arbiter | KeyForge | KeyForge original | Not applicable: original encounter |
| Velocity Phantom | KeyForge | KeyForge original | Not applicable: original encounter |
| Endurance Colossus | KeyForge | KeyForge original | Not applicable: original encounter |
| Keystroke Sovereign | KeyForge | KeyForge original | Not applicable: original encounter |
| The Nexus Mirror | KeyForge | KeyForge original | Not applicable: original encounter |
