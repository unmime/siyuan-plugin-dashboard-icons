#!/usr/bin/env python3
"""Sync homarr-labs/dashboard-icons metadata.json into a compact icons.json.

Usage:
    python3 scripts/sync-icons.py            # fetch upstream metadata.json
    python3 scripts/sync-icons.py foo.json   # use a local metadata.json
"""
import datetime
import json
import os
import sys
import urllib.request

SRC = "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/metadata.json"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons.json")

# 88 upstream categories are two overlapping naming schemes mixed together
# (`Networking-Tools` and `network` coexist). Collapse everything into 12 slots.
GROUP = {
    # media
    "media": "media", "media-servers": "media", "music": "media",
    "music-streaming": "media", "video": "media", "video-streaming": "media",
    "streaming": "media", "anime": "media", "entertainment": "media",
    # network
    "network": "network", "networking": "network", "networking-tools": "network",
    "vpn": "network", "server-panels": "network", "download-managers": "network",
    # monitoring
    "monitoring": "monitoring", "monitoring-tools": "monitoring",
    # developer
    "development": "developer", "developer-tools": "developer", "devops": "developer",
    "containerization-and-orchestration": "developer",
    "version-control-systems": "developer", "programming-languages": "developer",
    "linux-distributions": "developer", "operating-systems": "developer",
    "design": "developer", "graphics-editors": "developer",
    # cloud / storage
    "cloud": "cloud", "cloud-computing": "cloud", "storage": "cloud",
    "file": "cloud", "file-sharing-and-sync": "cloud", "infrastructure": "cloud",
    # security
    "security": "security", "password-managers": "security",
    # automation
    "automation": "automation", "home-automation": "automation", "smart-home": "automation",
    # productivity
    "office-suites": "productivity", "note-taking-apps": "productivity",
    "organization": "productivity", "finance": "productivity",
    "finance-and-banking": "productivity", "email-providers": "productivity",
    "communication": "productivity", "collaboration": "productivity",
    "productivity": "productivity", "wiki": "productivity", "education": "productivity",
    "logistics": "productivity", "e-commerce": "productivity",
    "e-commerce-platforms": "productivity", "search": "productivity",
    "search-engines": "productivity", "news": "productivity",
    "technology-news": "productivity",
    # ai
    "ai-and-llm-platforms": "ai", "ai": "ai",
    # database
    "databases": "database", "database": "database",
    # social
    "social-media": "social", "social": "social", "gaming": "social",
    "gaming-platforms": "social", "travel": "social", "health": "social",
    "animal": "social", "location": "social",
    # system
    "tools": "system", "utility": "system", "hardware": "system", "software": "system",
    "other": "system", "information": "system", "personal": "system",
    "community": "system", "self-hosted": "system", "web-browsers": "system",
}

GROUP_ORDER = ["media", "network", "monitoring", "developer", "cloud", "security",
               "automation", "productivity", "ai", "database", "social", "system"]

# 58% of upstream records carry no categories at all, so guess from the slug.
# Matching is conservative: exact, prefix-, suffix- or infix-boundary only.
KEYWORDS = {
    "media": ["plex", "jellyfin", "emby", "kodi", "sonarr", "radarr", "lidarr", "readarr",
              "prowlarr", "bazarr", "overseerr", "ombi", "tautulli", "jackett", "navidrome",
              "airsonic", "subsonic", "beets", "komga", "kavita", "audiobookshelf", "calibre",
              "photoprism", "immich", "photoview", "lychee", "piwigo", "mstream", "funkwhale",
              "ampache", "gerbera", "minidlna", "stash", "tubearchivist", "pinchflat"],
    "network": ["unifi", "pfsense", "opnsense", "openwrt", "wireguard", "tailscale", "zerotier",
                "netbird", "adguard-home", "pihole", "pi-hole", "nginx", "traefik", "caddy",
                "haproxy", "cloudflared", "frp", "nps", "speedtest-tracker", "librespeed",
                "openvpn", "pivpn", "wg-easy", "technitium", "blocky", "unbound"],
    "developer": ["gitlab", "gitea", "forgejo", "gogs", "jenkins", "drone", "argocd", "sonarqube",
                  "code-server", "vscode", "gitpod", "portainer", "rancher", "k3s", "kubernetes",
                  "docker", "lazydocker", "dockge", "buildkite", "teamcity", "nexus",
                  "artifactory", "woodpecker", "forgejo-runner", "gitea-runner"],
    "cloud": ["nextcloud", "owncloud", "seafile", "syncthing", "rclone", "minio", "duplicati",
              "restic", "kopia", "backrest", "filebrowser", "filestash", "cloudcommander",
              "pydio", "cryptpad", "sftpgo", "copyparty", "ente", "proton-drive"],
    "monitoring": ["grafana", "prometheus", "uptime-kuma", "zabbix", "netdata", "glances",
                   "beszel", "dozzle", "loki", "alertmanager", "victoriametrics", "telegraf",
                   "signoz", "jaeger", "opentelemetry", "cabot"],
    "security": ["vaultwarden", "bitwarden", "authelia", "authentik", "keycloak", "wazuh",
                 "crowdsec", "fail2ban", "keepass", "passbolt", "step-ca", "teleport",
                 "openbao", "hashicorp-vault"],
    "automation": ["home-assistant", "homeassistant", "node-red", "esphome", "zigbee2mqtt",
                   "zwave-js-ui", "n8n", "huginn", "activepieces", "windmill", "octoprint",
                   "klipper", "mosquitto", "shelly", "tasmota", "openhab"],
    "ai": ["ollama", "open-webui", "openwebui", "comfyui", "stable-diffusion", "automatic1111",
           "text-generation-webui", "localai", "librechat", "anythingllm", "flowise", "dify",
           "langfuse", "lm-studio", "vllm", "sillytavern", "invokeai", "fooocus"],
    "database": ["mysql", "mariadb", "postgres", "postgresql", "mongodb", "redis", "influxdb",
                 "clickhouse", "adminer", "phpmyadmin", "pgadmin", "dbeaver", "couchdb",
                 "cassandra", "neo4j", "supabase", "valkey", "typesense", "meilisearch"],
    "productivity": ["onlyoffice", "collabora", "joplin", "trilium", "outline", "bookstack",
                     "wikijs", "docmost", "affine", "obsidian", "logseq", "notion", "memos",
                     "mealie", "grocy", "actual-budget", "firefly", "paperless", "stirling-pdf",
                     "excalidraw", "drawio", "vault", "hedgedoc", "kanboard", "vikunja"],
    "social": ["mastodon", "misskey", "pleroma", "matrix", "element", "synapse", "discord",
               "telegram", "whatsapp", "signal", "lemmy", "peertube", "pixelfed", "gotosocial",
               "revolt", "rocket-chat", "mattermost"],
    "system": ["watchtower", "diun", "homepage", "homarr", "dashy", "heimdall", "organizr",
               "cockpit", "webmin", "casaos", "umbrel", "cosmos", "proxmox", "truenas",
               "unraid", "synology", "qnap", "esxi", "openmediavault", "fnos"],
}


def guess_group(slug):
    for group, words in KEYWORDS.items():
        for w in words:
            if slug == w or slug.startswith(w + "-") or slug.endswith("-" + w) \
                    or ("-" + w + "-") in slug:
                return group
    return ""

# Brand casing that a naive Title Case gets wrong.
SPECIAL = {
    "github": "GitHub", "gitlab": "GitLab", "gitea": "Gitea", "gitbook": "GitBook",
    "home-assistant": "Home Assistant", "homebridge": "Homebridge", "homebox": "HomeBox",
    "nextcloud": "Nextcloud", "nextcloud-talk": "Nextcloud Talk",
    "openmediavault": "openmediavault", "proxmox": "Proxmox VE",
    "icloud": "iCloud", "ipad": "iPad", "iphone": "iPhone", "imac": "iMac",
    "macos": "macOS", "ios": "iOS", "watchos": "watchOS", "tvos": "tvOS",
    "youtube": "YouTube", "youtube-music": "YouTube Music", "youtube-tv": "YouTube TV",
    "linkedin": "LinkedIn", "wordpress": "WordPress", "phpmyadmin": "phpMyAdmin",
    "nginx": "NGINX", "nginx-proxy-manager": "Nginx Proxy Manager",
    "mysql": "MySQL", "mariadb": "MariaDB", "postgresql": "PostgreSQL",
    "mongodb": "MongoDB", "redis": "Redis", "sqlite": "SQLite",
    "openai": "OpenAI", "chatgpt": "ChatGPT", "hugging-face": "Hugging Face",
    "ollama": "Ollama", "gemini": "Gemini",
    "docker": "Docker", "kubernetes": "Kubernetes", "portainer": "Portainer",
    "synology": "Synology", "qnap": "QNAP", "truenas": "TrueNAS", "unraid": "Unraid",
    "jellyfin": "Jellyfin", "plex": "Plex", "emby": "Emby",
    "sonarr": "Sonarr", "radarr": "Radarr", "prowlarr": "Prowlarr",
    "qbittorrent": "qBittorrent", "transmission": "Transmission",
    "cloudflare": "Cloudflare", "aws": "AWS", "azure": "Azure", "gcp": "GCP",
    "vscode": "VS Code", "visual-studio-code": "Visual Studio Code",
    "adguard-home": "AdGuard Home", "pihole": "Pi-hole", "pi-hole": "Pi-hole",
    "grafana": "Grafana", "prometheus": "Prometheus", "influxdb": "InfluxDB",
    "vmware": "VMware", "virtualbox": "VirtualBox", "esxi": "ESXi",
    "fnos": "fnOS", "immich": "Immich", "navidrome": "Navidrome",
    "openwrt": "OpenWrt", "tailscale": "Tailscale", "wireguard": "WireGuard",
    "hacs": "HACS", "esphome": "ESPHome", "zigbee2mqtt": "Zigbee2MQTT",
    "mealie": "Mealie", "paperless-ngx": "Paperless-ngx", "vaultwarden": "Vaultwarden",
}


def norm_cat(value):
    c = value.lower().replace("&", "and").replace("_", "-").replace(" ", "-")
    while "--" in c:
        c = c.replace("--", "-")
    return c.strip("-")


def title_of(slug):
    if slug in SPECIAL:
        return SPECIAL[slug]
    return " ".join(p[:1].upper() + p[1:] for p in slug.split("-") if p)


def load(local):
    if local:
        with open(local, "r", encoding="utf-8") as fh:
            return json.load(fh)
    print("fetching metadata.json ...")
    req = urllib.request.Request(SRC, headers={"User-Agent": "siyuan-plugin-dashboard-icons"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build(meta):
    icons = []
    for slug in sorted(meta):
        rec = meta[slug] or {}
        colors = rec.get("colors") or {}
        raw_cats = [norm_cat(c) for c in (rec.get("categories") or [])]

        groups = []
        for c in raw_cats:
            g = GROUP.get(c)
            if g and g not in groups:
                groups.append(g)
        if not groups:
            guessed = guess_group(slug)
            groups = [guessed] if guessed else ["system"]
        groups.sort(key=lambda g: GROUP_ORDER.index(g) if g in GROUP_ORDER else 99)

        aliases = " ".join(str(a) for a in (rec.get("aliases") or [])[:4]).strip()

        icons.append({
            "s": slug,
            "n": title_of(slug),
            "a": aliases,
            "c": raw_cats[:4],
            "g": groups[:2],
            # empty string means "this variant does not exist"
            "d": colors.get("dark") or "",
            "l": colors.get("light") or "",
        })
    return icons


def main():
    local = sys.argv[1] if len(sys.argv) > 1 else None
    meta = load(local)
    icons = build(meta)

    payload = {
        "version": datetime.date.today().isoformat(),
        "source": "https://github.com/homarr-labs/dashboard-icons",
        "count": len(icons),
        "groups": GROUP_ORDER,
        "icons": icons,
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(OUT)
    with_variants = sum(1 for i in icons if i["d"] or i["l"])
    print(f"icons: {len(icons)}  variants: {with_variants}  size: {size/1024:.0f} KB -> {OUT}")


if __name__ == "__main__":
    main()
