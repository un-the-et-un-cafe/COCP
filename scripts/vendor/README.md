# Vendored third-party code

| File | Upstream | Version | License | sha256 (upstream file) |
| --- | --- | --- | --- | --- |
| `qrcode-generator.mjs` | [kazuhikoarase/qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) `dist/qrcode.mjs` | 2.0.4 (npm) | MIT, (c) 2009 Kazuhiko Arase | `ea91d7118a5395289170da848b7c6758b996163bfbccf312591ab65a4911b7c0` |

Why vendored: the root package has no runtime dependencies and `npm test` runs on bare Node ≥22.13.
The file is used only at generation time by `scripts/generate-qr-pack.mjs`; it is never shipped to beneficiary routes.

To verify: `npm pack qrcode-generator@2.0.4`, extract, and compare `sha256sum package/dist/qrcode.mjs`
against the table (the vendored copy only adds a 4-line provenance header).

"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
