# Technical Notes — Seeker Cycle

## Requirements

- macOS, Windows, or Linux desktop
- One or more Bluetooth LE smart trainers (see compatibility below)
- Node.js 22+ (development only)

## Trainer Compatibility

Seeker Cycle reads data from any trainer that advertises one of these standard Bluetooth profiles:

| Profile | Examples |
|---|---|
| **FTMS** (Fitness Machine Service) | Wahoo KICKR, Tacx NEO, Elite Direto, most modern smart trainers |
| **Cycling Power** | Stages, Quarq, and most standalone power meters |
| **CSC** (Cycling Speed & Cadence) | Older trainers and wheel-on speed sensors |

FTMS is preferred — it provides power, cadence, and speed in a single characteristic. If your trainer isn't discovered, check that it's powered on and not already connected to another app (Zwift, TrainerRoad, etc.).

## Installation

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|---|---|
| macOS (Apple Silicon) | `Seeker Cycle-x.x.x-arm64.dmg` |
| macOS (Intel) | `Seeker Cycle-x.x.x-x64.dmg` |
| Windows | `Seeker Cycle Setup x.x.x.exe` |
| Linux | `Seeker Cycle-x.x.x.AppImage` |

On **macOS**: open the DMG, drag to Applications. On first launch, right-click → Open to bypass Gatekeeper (the app is unsigned).

On **Linux**: `chmod +x` the AppImage, then run it. Bluetooth access may require running as root or adding your user to the `bluetooth` group.

On **Windows**: run the installer, then launch from the Start menu.

## Running from Source

```bash
git clone https://github.com/your-org/seeker-cycle
cd seeker-cycle
npm install
npm run dev
```

## Building

```bash
npm run build      # compile only (outputs to out/)
npm run package    # compile + package for current platform
```

CI builds for all platforms are handled by GitHub Actions on version tags (`v*`).

## Tech Stack

| Layer | Choice |
|---|---|
| Shell | Electron |
| Build | electron-vite |
| UI | React 19 + TypeScript |
| Bluetooth | @abandonware/noble (main process) |
| State | Zustand + Immer |
| Router | React Router v7 (MemoryRouter) |
| Persistence | JSON flat files in Electron userData |

## Data Storage

Race sessions and leaderboard data are stored locally in JSON files inside the Electron `userData` directory:

- **macOS:** `~/Library/Application Support/seeker-cycle/`
- **Windows:** `%APPDATA%\seeker-cycle\`
- **Linux:** `~/.config/seeker-cycle/`

No data is sent anywhere. Deleting these files resets all records.

## Admin Mode

Toggle Admin Mode from the main menu status strip. When enabled, additional debugging overlays are shown (live BLE readings, device state). Intended for event setup and troubleshooting.

## Race Physics

Power is converted to velocity using a simplified flat-road cycling drag model (rolling resistance + aerodynamic drag). Velocity is smoothed each frame to absorb BLE polling jitter (~4 Hz). Default race distance is 2000 m.
