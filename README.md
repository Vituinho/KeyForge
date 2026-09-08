# KeyForge ⚔️ — Anime Typing Battle Arena & Academy

> A high-octane, anime-inspired competitive typing game built with Next.js, React 19, TypeScript, Tailwind CSS, Supabase Realtime, and PostgreSQL.

KeyForge turns touch typing into an adrenaline-fueled combat sport. Master keystrokes, charge your attack energy, trigger devastating jutsu ultimates, unlock rare keyboard skins, and clash in synchronized 1v1 PvP anime battles.

---

## 🚀 Key Features

### ⚔️ KeyForge v3.0: Multiplayer Arena (1v1 PvP)
- **Authoritative Combat Engine**: The server is the sole authority for HP, damage calculations, word verification, and rewards. Clients never self-report damage or winner declarations.
- **Attack Energy System**: Every completed word charges the Attack Energy gauge (+25 base, +5 on ≥98% accuracy, +5 on ≥10 combo). At 100%, an authoritative attack launches automatically with dynamic damage scaling ($70 \times \text{comboMultiplier} \times \text{accuracyRatio}$).
- **Combo Multipliers**: Consecutive error-free words build combo streaks from 1.0x up to 2.5x damage multiplier. Typos reset the combo and trigger a 0.5s chakra recoil.
- **Ultimate Jutsus**: Each completed word builds ultimate charge (+5%). At 100%, activate your secret technique (`[Tab]` or click) for an anime cut-in and 160 direct damage.
- **Deterministic Word Synchronization**: Uses Mulberry32 PRNG seed synchronization to guarantee 100% fair, identical word sequences for both competitors without network race conditions.
- **Anime Battle Atmosphere**:
  - Dynamic Jutsu Clash beam at the center of the arena reflecting battle pressure.
  - Battle Auras (Cyan, Orange, Emerald, Crimson, Gold, Void Purple) responding to combo streaks.
  - Screen shake and impact hitsparks on strikes.
  - Low-health danger auras and heart-throb alarm (<25% HP).
- **Matchmaking Modes**:
  - **Quick Match**: Automatic matchmaking queue with balanced Shadow Shinobi fallback if no human opponent joins within 10 seconds.
  - **Private Battle Rooms**: 6-character room codes (`KF-XXXX`) with 1-click clipboard sharing and WhatsApp invitations.
- **Disconnect & Forfeit Grace Period**: 15-second reconnection grace period before an opponent can claim a disconnect forfeit.
- **Anti-Cheat & Rate Limiting**: Monotonic word index progression, deterministic seed validation, and inhuman WPM rate clamps (max 260 WPM).
- **Anti-Farming Economy**: Matches lasting under 5 seconds or with fewer than 3 completed words award 0 XP and 0 crates. Private match duels never drop crates to prevent collusion farming.
- **Post-Match Combat Analysis**: Complete battle telemetry breakdown including WPM, accuracy, max combo, damage dealt, weak keys heatmap, and direct Touch Typing Academy training CTAs.

### ⌨️ KeyForge v2.4: Visual Keyboards & Skin Economy
- **Dual Layout Support**: Full support for PT-BR ABNT2 (`ç`, accent dead keys) and EN ANSI.
- **35 Unique Anime Keyboard Skins**: 7 distinct rarity tiers (Common, Uncommon, Rare, Epic, Legendary, Mythic, Secret) across Forge, Shinobi, Cosmic, Cursed, Pirate, Shadow, and Cyber collections.
- **PvP Skin Showcase**: Display equipped keyboard skins during PvP battles with rarity border glow, animated keycaps, and opponent inspection toggle.
- **Loot Crates & Forge Shards**: Basic, Shinobi, Elite, and Celestial Mythic crates with 3-phase unboxing animations and duplicate salvage into Forge Shards.

### 🥋 Solo Modes & Touch Typing Academy
- **Anime World: Naruto Tale**: Story campaign across shinobi ranks, facing rogue ninjas with progressive typing difficulty.
- **Touch Typing Academy**: Interactive finger placement guides, posture drills, and home row lessons.
- **Targeted Weak Key Training**: Real-time error telemetry automatically curates custom exercises targeting your specific error keys.
- **Comprehensive Statistics**: Detailed heatmaps, historical progression graphs, and attribute radars.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.3.4](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime Presence & Broadcast)
- **Internationalization**: Native i18n with full parity between English (`en`) and Portuguese (`pt-BR`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node v24 recommended)
- npm / pnpm / yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Vituinho/KeyForge.git
cd KeyForge
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Note: KeyForge includes full offline/guest mode fallback when Supabase credentials are not provided.)*

4. Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Testing & Verification

KeyForge includes automated verification suites for security, RLS, and PvP battle simulation:

```bash
# Run ESLint validation
npm run lint

# Run Multiplayer Security & RLS Invariant Audit (10 Invariants)
npm run test:security

# Run Autonomous 1v1 PvP Battle Simulation (Quick & Private Duels)
npm run test:battle

# Run Next.js Production Build
npm run build
```

---

## 📜 Database Schema & Security (Supabase / PostgreSQL)

The multiplayer backend is defined in `supabase/multiplayer_schema.sql` and includes:
- `multiplayer_matches`: Authoritative match state, HP, energy, and telemetry.
- `multiplayer_match_results`: Immutable match logs and reward distributions.
- `multiplayer_match_events`: Idempotent event ledger preventing duplicate damage submissions.
- **Authoritative RPC Functions**:
  - `create_multiplayer_match`
  - `join_multiplayer_match`
  - `set_player_ready`
  - `submit_word_completion` (Damage calculation, anti-cheat checks, combo scaling)
  - `trigger_ultimate` (100% threshold check, 160 dmg)
  - `forfeit_match`
  - `claim_disconnect_forfeit` (15s inactive grace period verification)

---

## 🌐 Localization

KeyForge provides 100% synchronized bilingual localization:
- **Português (Brasil)** (`pt-BR`)
- **English** (`en`)

Toggle languages seamlessly from the top navigation bar or user settings.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
