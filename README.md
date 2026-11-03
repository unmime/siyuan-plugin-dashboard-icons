# Dashboard Icons

**English** · [简体中文](README_zh_CN.md)

A SiYuan plugin. Searches the 3400+ self-hosted service icons in [dashboard-icons](https://github.com/homarr-labs/dashboard-icons) and drops one into your document, or sets it as the document icon.

None of the art is mine. It all comes from homarr-labs/dashboard-icons, and a script here keeps up with upstream additions.

![preview](preview.png)

## Usage

There's a button in the top bar, the toolbar and the breadcrumb bar. Shortcut is `⌥⇧D`.

Type to search. Left click inserts the icon at the cursor. Right click gives you set-as-document-icon, copy link, and download-only.

Results are ranked: exact slug match, then slug prefix, then display-name prefix, then everything else. Searching `plex` puts Plex first and `plexdrive` further down.

## About the categories

Only 1711 of the 3450 upstream records have categories, and they're split across two naming schemes — `Networking-Tools` and `network` mean the same thing. I folded them into 12 groups, guessed the rest from slugs, and whatever couldn't be guessed landed in "Other". That's 1696 icons at the moment.

So the categories are for narrowing things down. Search is still how you find a specific icon.

Search covers slug, display name, aliases and categories. If that's too broad, there's a "Match names only" switch in settings. Turning it on takes `home` from 125 hits to 25, and `media server` from 55 to 1.

## Where files go

| Action | Location |
| --- | --- |
| Set as document icon | `data/emojis/dashboard-icons/` |
| Insert into document | `assets/dashboard-icons/` |

Nothing downloads until you click it, so you won't find 3400 files in your workspace. Delete those two folders to clean up.

If you'd rather not spend workspace space, switch insert mode to "Reference remote URL" and only the CDN address gets stored.

## Light and dark variants

Every icon has two variants. `-light` is meant for dark backgrounds, `-dark` for light ones. The naming is genuinely counterintuitive; the plugin picks based on SiYuan's current theme so you don't have to think about it.

## Settings

Icon source (jsDelivr / GitHub raw / custom mirror), insert mode, match-names-only, recent icon count, breadcrumb button, status bar button.

## Updating the icon index

```bash
python3 scripts/sync-icons.py
```

Pulls upstream `metadata.json`, normalizes categories, fills in the guesses, writes `icons.json` (343 KB, 59 KB gzipped). Repackage afterwards.

`scripts/make-assets.py` rebuilds the bazaar icon and preview image. Needs Pillow.

## License

Plugin code is MIT.

Icons come from homarr-labs/dashboard-icons under Apache-2.0; the full text is in `licenses/dashboard-icons-LICENSE.txt`. No icon files are bundled — everything is fetched from the CDN on demand.

Trademarks belong to their respective owners. Icons are used to identify the services they represent, nothing more. This plugin is not affiliated with Homarr Labs.
