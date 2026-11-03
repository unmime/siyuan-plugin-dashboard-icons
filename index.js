const {Plugin, Dialog, Menu, Setting, showMessage, getAllEditor} = require("siyuan");

const CDN_JSDELIVR = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons";
const CDN_RAW = "https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main";
const EMOJI_GROUP = "dashboard-icons";
const ASSET_DIR = "dashboard-icons";
const PAGE_SIZE = 60;
const STORAGE = "settings";
const RECENT_KEY = "dicon-recent";
const HOTKEY = "⌥⇧D";

const GROUPS = [
    {id: "all", zh: "全部", en: "All"},
    {id: "media", zh: "媒体", en: "Media"},
    {id: "network", zh: "网络", en: "Network"},
    {id: "monitoring", zh: "监控", en: "Monitoring"},
    {id: "developer", zh: "开发", en: "Developer"},
    {id: "cloud", zh: "云存储", en: "Cloud"},
    {id: "security", zh: "安全", en: "Security"},
    {id: "automation", zh: "自动化", en: "Automation"},
    {id: "productivity", zh: "效率办公", en: "Productivity"},
    {id: "ai", zh: "AI", en: "AI"},
    {id: "database", zh: "数据库", en: "Database"},
    {id: "social", zh: "社交娱乐", en: "Social"},
    {id: "system", zh: "其他", en: "Other"},
];

const DEFAULT_CONF = {
    cdn: "jsdelivr",
    cdnCustom: "",
    insertMode: "asset",
    recentLimit: 12,
    showBreadcrumb: true,
    showStatusBar: false,
};

const STYLE_ID = "dicon-style";
const STYLE = `
.dicon{display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;flex:1;min-width:0}
.dicon-bar{display:flex;gap:8px;align-items:center}
.dicon-bar input{flex:1}
.dicon-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;flex-wrap:nowrap;scrollbar-width:thin}
.dicon-chips::-webkit-scrollbar{height:4px}
.dicon-chip{flex:0 0 auto;border:1px solid var(--b3-border-color);background:var(--b3-theme-surface);
    color:var(--b3-theme-on-surface);border-radius:999px;padding:4px 12px;font-size:12px;cursor:pointer;
    font-family:inherit;transition:background .12s,border-color .12s;white-space:nowrap}
.dicon-chip:hover{border-color:var(--b3-theme-primary)}
.dicon-chip.on{background:var(--b3-theme-primary);border-color:var(--b3-theme-primary);color:var(--b3-theme-on-primary)}
.dicon-meta{display:flex;justify-content:space-between;gap:10px;font-size:11.5px;color:var(--b3-theme-on-surface-light);min-height:16px}
.dicon-scroll{flex:1;overflow-y:auto;min-height:0;padding:2px 2px 8px}
.dicon-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}
.dicon-card{position:relative;background:var(--b3-theme-surface);border:1px solid var(--b3-border-color);
    border-radius:10px;padding:12px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:7px;
    cursor:pointer;transition:border-color .12s,transform .12s,background .12s}
.dicon-card:hover{border-color:var(--b3-theme-primary);transform:translateY(-1px)}
.dicon-card:active{transform:none}
.dicon-art{height:34px;display:flex;align-items:center;justify-content:center;width:100%}
.dicon-art img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.dicon-name{font-size:11px;line-height:1.25;text-align:center;color:var(--b3-theme-on-surface-light);
    max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dicon-acts{position:absolute;top:4px;right:4px;display:flex;gap:3px;opacity:0;transition:opacity .12s}
.dicon-card:hover .dicon-acts{opacity:1}
.dicon-acts button{width:20px;height:20px;display:flex;align-items:center;justify-content:center;
    border:1px solid var(--b3-border-color);background:var(--b3-theme-background);color:var(--b3-theme-on-surface);
    border-radius:5px;cursor:pointer;padding:0}
.dicon-acts button:hover{border-color:var(--b3-theme-primary);color:var(--b3-theme-primary)}
.dicon-acts svg{width:11px;height:11px}
.dicon-card.busy{opacity:.45;pointer-events:none}
.dicon-empty{grid-column:1/-1;text-align:center;padding:64px 0;font-size:13px;color:var(--b3-theme-on-surface-light)}
.dicon-more{grid-column:1/-1;text-align:center;padding:10px;font-size:12px;color:var(--b3-theme-on-surface-light)}
.dicon-statusbar{display:flex;align-items:center;justify-content:center;padding:0 4px;cursor:pointer}
.dicon-statusbar svg{width:14px;height:14px;display:block}
`;

class DashboardIconsPlugin extends Plugin {
    async onload() {
        const saved = await this.loadData(STORAGE).catch(() => null);
        this.conf = Object.assign({}, DEFAULT_CONF, saved || {});
        this.icons = [];
        this.groups = [];
        this.loading = null;
        this.dialog = null;
        this.keyword = "";
        this.group = "all";
        this.shown = 0;
        this.visible = [];
        this.busy = false;
        this.recent = this.readRecent();

        this.injectStyle();

        this.addIcons(`<symbol id="iconDashIcons" viewBox="0 0 32 32">
<rect x="4.5" y="4.5" width="9.6" height="9.6" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="17.9" y="4.5" width="9.6" height="9.6" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="4.5" y="17.9" width="9.6" height="9.6" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="17.9" y="17.9" width="9.6" height="9.6" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/>
</symbol>
<symbol id="iconDashDoc" viewBox="0 0 32 32">
<path d="M8.5 4h10.5l6 6v18a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="2.2"/>
<path d="M19 4v7h6" fill="none" stroke="currentColor" stroke-width="2.2"/>
</symbol>
<symbol id="iconDashCopy" viewBox="0 0 32 32">
<rect x="11.5" y="11.5" width="14.5" height="14.5" rx="2.4" fill="none" stroke="currentColor" stroke-width="2.2"/>
<path d="M8 20.5H6.5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V8" fill="none" stroke="currentColor" stroke-width="2.2"/>
</symbol>`);

        try {
            this.addTopBar({
                icon: "iconDashIcons",
                title: this.i18n.pluginName,
                position: "right",
                callback: () => this.openPanel(),
            });
        } catch (err) {
            console.error("dashboard-icons topbar failed", err);
        }

        try {
            this.addToolbarItem({
                name: "dashboard-icons",
                icon: "iconDashIcons",
                tipPosition: "n",
                tip: this.i18n.pluginName,
                click: (protyle) => {
                    this.activeProtyle = protyle;
                    this.openPanel();
                },
            });
        } catch (err) {
            console.error("dashboard-icons toolbar failed", err);
        }

        this.syncInjections();

        try {
            this.addCommand({
                langKey: "openPanel",
                hotkey: HOTKEY,
                callback: () => this.openPanel(),
            });
        } catch (err) {
            this.addCommand({langKey: "openPanel", callback: () => this.openPanel()});
        }

        this.initSetting();

        // 预热索引，打开面板时不再等待
        this.loadIndex().catch((err) => console.error("dashboard-icons preload failed", err));
    }

    onunload() {
        this.closePanel();
        this.syncInjections(true);
        const style = document.getElementById(STYLE_ID);
        if (style) style.remove();
    }

    get isZh() {
        const lang = (window.siyuan && window.siyuan.config && window.siyuan.config.appearance
            && window.siyuan.config.appearance.lang) || "zh_CN";
        return String(lang).toLowerCase().indexOf("zh") === 0;
    }

    injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = STYLE;
        document.head.appendChild(style);
    }

    /* ── 索引 ── */

    async loadIndex() {
        if (this.icons.length) return this.icons;
        if (this.loading) return this.loading;

        this.loading = (async () => {
            const url = `/plugins/${this.name}/icons.json`;
            const resp = await fetch(url, {cache: "no-cache"});
            if (!resp.ok) throw new Error("HTTP " + resp.status);
            const data = await resp.json();
            this.icons = Array.isArray(data.icons) ? data.icons : [];
            this.indexVersion = data.version || "";
            this.bySlug = new Map(this.icons.map((item) => [item.s, item]));
            return this.icons;
        })();

        try {
            return await this.loading;
        } finally {
            this.loading = null;
        }
    }

    isDark() {
        const attr = document.documentElement.getAttribute("data-theme-mode");
        if (attr) return attr === "dark";
        return !!(window.siyuan && window.siyuan.config && window.siyuan.config.appearance
            && window.siyuan.config.appearance.mode === 1);
    }

    cdnBase() {
        if (this.conf.cdn === "raw") return CDN_RAW;
        if (this.conf.cdn === "custom" && this.conf.cdnCustom) {
            return String(this.conf.cdnCustom).replace(/\/+$/, "");
        }
        return CDN_JSDELIVR;
    }

    /** -light 是给深色背景用的浅色图标，-dark 相反，别弄反。 */
    fileName(item) {
        const dark = this.isDark();
        if (dark && item.l) return item.l;
        if (!dark && item.d) return item.d;
        return item.s;
    }

    iconUrl(item) {
        return `${this.cdnBase()}/png/${encodeURIComponent(this.fileName(item))}.png`;
    }

    filter() {
        const kw = this.keyword.trim().toLowerCase();
        let list = this.icons;

        if (this.group !== "all") {
            list = list.filter((item) => (item.g || []).indexOf(this.group) >= 0);
        }

        if (!kw) {
            // 没有搜索词时把最近用过的顶到最前面
            return this.group === "all" ? this.withRecentFirst(list) : list;
        }

        const terms = kw.split(/\s+/).filter(Boolean);
        const scored = [];
        for (const item of list) {
            const hay = item._h || (item._h = (
                item.s + " " + item.n + " " + (item.a || "") + " " + (item.c || []).join(" ")
            ).toLowerCase());
            if (!terms.every((t) => hay.indexOf(t) >= 0)) continue;

            let score = 3;
            if (item.s === kw) score = 0;
            else if (item.s.indexOf(kw) === 0) score = 1;
            else if ((item.n || "").toLowerCase().indexOf(kw) === 0) score = 2;
            scored.push({item, score});
        }
        scored.sort((a, b) => a.score - b.score || a.item.s.localeCompare(b.item.s));
        return scored.map((row) => row.item);
    }

    withRecentFirst(list) {
        const recent = this.readRecent();
        if (!recent.length || !this.bySlug) return list;

        const picked = [];
        const seen = new Set();
        for (const slug of recent) {
            const item = this.bySlug.get(slug);
            if (item && !seen.has(slug)) {
                picked.push(item);
                seen.add(slug);
            }
        }
        if (!picked.length) return list;
        return picked.concat(list.filter((item) => !seen.has(item.s)));
    }

    /* ── 面板 ── */

    async openPanel() {
        this.savedBlockCtx = this.currentBlockContext();
        this.closePanel();
        this.keyword = "";
        this.group = "all";
        this.shown = 0;

        this.dialog = new Dialog({
            title: this.i18n.pluginName,
            width: "920px",
            height: "680px",
            content: `<div class="b3-dialog__content" style="overflow:hidden;display:flex;padding:12px 16px">
    <div class="dicon">
        <div class="dicon-bar">
            <input class="b3-text-field dicon-search" placeholder="${this.esc(this.i18n.searchPlaceholder)}" autocomplete="off" spellcheck="false">
        </div>
        <div class="dicon-chips"></div>
        <div class="dicon-meta">
            <span class="dicon-count"></span>
            <span class="dicon-hint">${this.esc(this.i18n.tip)}</span>
        </div>
        <div class="dicon-scroll"><div class="dicon-grid"></div></div>
    </div>
</div>`,
        });

        const root = this.dialog.element;
        const input = root.querySelector(".dicon-search");
        const scroll = root.querySelector(".dicon-scroll");

        this.renderChips();
        this.setStatus(this.i18n.loadingIndex);

        input.addEventListener("input", () => {
            this.keyword = input.value;
            this.refresh();
        });
        input.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                if (input.value) {
                    input.value = "";
                    this.keyword = "";
                    this.refresh();
                } else {
                    this.closePanel();
                }
            }
        });

        let ticking = false;
        scroll.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                if (!this.dialog) return;
                if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 240) {
                    this.renderGrid(false);
                }
            });
        });

        setTimeout(() => input && input.focus(), 60);

        try {
            await this.loadIndex();
            this.refresh();
        } catch (err) {
            this.setStatus(this.i18n.loadFailed + "：" + err.message);
        }
    }

    closePanel() {
        if (this.dialog) {
            this.dialog.destroy();
            this.dialog = null;
        }
    }

    renderChips() {
        if (!this.dialog) return;
        const wrap = this.dialog.element.querySelector(".dicon-chips");
        if (!wrap) return;
        const zh = this.isZh;
        wrap.innerHTML = GROUPS.map((g) => `<button class="dicon-chip${g.id === this.group ? " on" : ""}" data-g="${g.id}">${zh ? g.zh : g.en}</button>`).join("");
        wrap.onclick = (event) => {
            const el = event.target.closest(".dicon-chip");
            if (!el) return;
            this.group = el.getAttribute("data-g");
            wrap.querySelectorAll(".dicon-chip").forEach((chip) => {
                chip.classList.toggle("on", chip.getAttribute("data-g") === this.group);
            });
            this.refresh();
        };
    }

    refresh() {
        this.visible = this.filter();
        this.shown = 0;
        this.renderGrid(true);
        this.renderRecentLine();
    }

    renderRecentLine() {
        if (!this.dialog) return;
        const el = this.dialog.element.querySelector(".dicon-count");
        if (!el) return;
        const total = this.icons.length;
        el.textContent = this.i18n.countTip
            .replace("$1", this.visible.length)
            .replace("$2", total)
            .replace("$3", this.indexVersion || "—");
    }

    renderGrid(reset) {
        if (!this.dialog) return;
        const grid = this.dialog.element.querySelector(".dicon-grid");
        if (!grid) return;

        if (reset) {
            grid.innerHTML = "";
            this.shown = 0;
        }

        if (!this.visible.length) {
            if (reset) grid.innerHTML = `<div class="dicon-empty">${this.esc(this.i18n.noResult)}</div>`;
            return;
        }

        const moreBtn = grid.querySelector(".dicon-more");
        if (moreBtn) moreBtn.remove();

        const from = this.shown;
        const to = Math.min(this.visible.length, from + PAGE_SIZE);
        if (from >= to) return;

        const dark = this.isDark();
        const html = [];
        for (let i = from; i < to; i++) {
            const item = this.visible[i];
            const url = this.esc(this.iconUrl(item));
            const label = this.esc(item.n || item.s);
            html.push(`<div class="dicon-card" data-i="${i}" title="${label} · ${this.esc(item.s)}">
    <div class="dicon-art"><img src="${url}" alt="${label}" loading="lazy" decoding="async"></div>
    <span class="dicon-name">${label}</span>
    <div class="dicon-acts">
        <button data-act="icon" aria-label="${this.esc(this.i18n.setAsDocIcon)}"><svg><use xlink:href="#iconDashDoc"></use></svg></button>
        <button data-act="copy" aria-label="${this.esc(this.i18n.copyLink)}"><svg><use xlink:href="#iconDashCopy"></use></svg></button>
    </div>
</div>`);
        }
        grid.insertAdjacentHTML("beforeend", html.join(""));
        this.shown = to;

        if (to < this.visible.length) {
            grid.insertAdjacentHTML("beforeend", `<div class="dicon-more">${this.esc(this.i18n.scrollMore)}</div>`);
        }

        if (reset) {
            grid.onclick = (event) => this.onGridClick(event);
            grid.oncontextmenu = (event) => this.onGridContext(event);
        }
    }

    onGridClick(event) {
        const card = event.target.closest(".dicon-card");
        if (!card) return;
        const item = this.visible[Number(card.getAttribute("data-i"))];
        if (!item) return;

        const btn = event.target.closest("button[data-act]");
        if (btn) {
            event.stopPropagation();
            const act = btn.getAttribute("data-act");
            if (act === "copy") this.copyLink(item);
            else this.run(item, card, "docIcon");
            return;
        }
        this.run(item, card, "insert");
    }

    onGridContext(event) {
        const card = event.target.closest(".dicon-card");
        if (!card) return;
        event.preventDefault();
        const item = this.visible[Number(card.getAttribute("data-i"))];
        if (!item) return;

        const menu = new Menu("dicon-menu");
        menu.addItem({
            icon: "iconImage",
            label: this.i18n.insertBody,
            click: () => this.run(item, card, "insert"),
        });
        menu.addItem({
            icon: "iconDoc",
            label: this.i18n.setAsDocIcon,
            click: () => this.run(item, card, "docIcon"),
        });
        menu.addSeparator();
        menu.addItem({
            icon: "iconLink",
            label: this.i18n.copyLink,
            click: () => this.copyLink(item),
        });
        menu.addItem({
            icon: "iconDownload",
            label: this.i18n.downloadOnly,
            click: () => this.run(item, card, "download"),
        });
        menu.addItem({
            icon: "iconRefresh",
            label: this.i18n.reloadPreview,
            click: () => {
                const img = card.querySelector("img");
                if (img) img.src = this.iconUrl(item) + "?t=" + Date.now();
            },
        });
        menu.open({x: event.clientX, y: event.clientY});
    }

    setStatus(text) {
        if (!this.dialog) return;
        const el = this.dialog.element.querySelector(".dicon-count");
        if (el) el.textContent = text || "";
    }

    /* ── 动作 ── */

    async run(item, card, mode) {
        if (this.busy) {
            showMessage(this.i18n.busyTip);
            return;
        }
        this.busy = true;
        if (card) card.classList.add("busy");
        try {
            if (mode === "docIcon") {
                const path = await this.ensureEmoji(item);
                if (!await this.setDocIcon(path)) {
                    showMessage(this.i18n.noDocId);
                    return;
                }
                this.pushRecent(item);
                showMessage(this.i18n.appliedDocIcon.replace("$1", item.n || item.s));
                return;
            }

            if (mode === "download") {
                await this.ensureEmoji(item);
                showMessage(this.i18n.savedOnly.replace("$1", item.n || item.s));
                return;
            }

            // insert
            let src;
            if (this.conf.insertMode === "cdn") {
                src = this.iconUrl(item);
            } else {
                src = await this.ensureAsset(item);
            }
            if (!await this.insertToEditor(src, item.n || item.s)) {
                await this.copyText(src);
                showMessage(this.i18n.noEditor.replace("$1", item.n || item.s));
                return;
            }
            this.pushRecent(item);
        } catch (err) {
            showMessage(this.i18n.failed + "：" + (err && err.message ? err.message : err));
        } finally {
            this.busy = false;
            if (card) card.classList.remove("busy");
        }
    }

    async fetchBlob(url) {
        const resp = await fetch(url, {cache: "force-cache"});
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const blob = await resp.blob();
        if (!blob.size) throw new Error("empty file");
        return blob;
    }

    /** 下载到 data/emojis/<group>/，返回可直接用于文档图标的 /emojis/ 路径。 */
    async ensureEmoji(item) {
        const file = `${this.fileName(item)}.png`;
        const blob = await this.fetchBlob(this.iconUrl(item));
        const form = new FormData();
        form.append("path", `/data/emojis/${EMOJI_GROUP}/${file}`);
        form.append("isDir", "false");
        form.append("modTime", String(Date.now()));
        form.append("file", blob, file);

        const resp = await fetch("/api/file/putFile", {method: "POST", body: form});
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.msg || "putFile failed");
        return `/emojis/${EMOJI_GROUP}/${file}`;
    }

    /** 上传到 assets/dashboard-icons/，返回 /assets/ 路径，用于正文插图。 */
    async ensureAsset(item) {
        const file = `${this.fileName(item)}.png`;
        const blob = await this.fetchBlob(this.iconUrl(item));
        const form = new FormData();
        form.append("assetsDirPath", `/assets/${ASSET_DIR}/`);
        form.append("file[]", blob, file);

        const resp = await fetch("/api/asset/upload", {method: "POST", body: form});
        const json = await resp.json();
        if (json.code !== 0) throw new Error(json.msg || "upload failed");

        const succ = (json.data && json.data.succMap) || {};
        const path = succ[file] || Object.values(succ)[0];
        if (!path) throw new Error("upload returned no path");
        return path.charAt(0) === "/" ? path : "/" + path;
    }

    async setDocIcon(emojiPath) {
        const docId = this.activeDocId() || (this.savedBlockCtx && this.savedBlockCtx.id);
        if (!docId) return false;
        try {
            const resp = await fetch("/api/attr/setBlockAttrs", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({id: docId, attrs: {icon: emojiPath}}),
            });
            const json = await resp.json();
            return json.code === 0;
        } catch (err) {
            return false;
        }
    }

    collectProtyles() {
        const list = [];
        const push = (p) => {
            if (p && typeof p.insert === "function" && list.indexOf(p) === -1) list.push(p);
        };
        if (this.activeProtyle) push(this.activeProtyle);
        try {
            (getAllEditor() || []).forEach((item) => {
                if (!item) return;
                push(item.protyle);
                push(item);
            });
        } catch (err) {
            /* DOM 兜底 */
        }
        document.querySelectorAll(".protyle").forEach((el) => {
            push(el.__protyle);
            push(el.protyle);
        });
        return list;
    }

    async insertToEditor(src, alt) {
        const safeAlt = String(alt || "").replace(/[[\]()]/g, " ").trim();
        const html = `<img src="${this.esc(src)}" alt="${this.esc(safeAlt)}">`;
        for (const protyle of this.collectProtyles()) {
            const wysiwyg = protyle && protyle.wysiwyg && protyle.wysiwyg.element;
            if (!wysiwyg || !wysiwyg.isConnected) continue;
            const before = wysiwyg.querySelectorAll("img").length;
            try {
                if (typeof protyle.focus === "function") protyle.focus();
                protyle.insert(html, false);
            } catch (err) {
                continue;
            }
            if (wysiwyg.querySelectorAll("img").length > before) return true;
        }
        return await this.insertViaApi(src, safeAlt);
    }

    async insertViaApi(src, alt) {
        const ctx = this.savedBlockCtx || this.currentBlockContext();
        let docId = this.currentDocId();
        if (!docId && ctx && ctx.id) docId = await this.fetchRootId(ctx.id);
        if (!docId) return false;

        const parentId = (ctx && ctx.parentId) || docId;
        const payload = {
            dataType: "markdown",
            data: `![${alt}](${src})`,
            parentID: parentId,
        };
        if (ctx && ctx.id && ctx.id !== parentId) payload.previousID = ctx.id;

        try {
            const resp = await fetch("/api/block/insertBlock", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
            const json = await resp.json();
            return json.code === 0;
        } catch (err) {
            return false;
        }
    }

    currentBlockContext() {
        const selection = window.getSelection();
        let node = selection && selection.anchorNode;
        let blockEl = null;
        while (node) {
            if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute("data-node-id")) {
                blockEl = node;
                break;
            }
            node = node.parentNode;
        }
        if (!blockEl) return null;
        const parentEl = blockEl.parentElement && blockEl.parentElement.closest("[data-node-id]");
        return {
            id: blockEl.getAttribute("data-node-id"),
            parentId: parentEl ? parentEl.getAttribute("data-node-id") : "",
        };
    }

    currentDocId() {
        const el = document.querySelector(".layout__wnd--active .protyle[data-doc-id]")
            || document.querySelector(".protyle[data-doc-id]");
        return el ? el.getAttribute("data-doc-id") : "";
    }

    activeDocId() {
        const active = document.querySelector(".layout__wnd--active .protyle[data-doc-id]");
        if (active) return active.getAttribute("data-doc-id");
        const any = document.querySelector(".protyle[data-doc-id]");
        return any ? any.getAttribute("data-doc-id") : "";
    }

    async fetchRootId(blockId) {
        try {
            const resp = await fetch("/api/query/sql", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({stmt: `SELECT root_id FROM blocks WHERE id = '${blockId}'`}),
            });
            const json = await resp.json();
            if (json.code === 0 && json.data && json.data[0]) return json.data[0].root_id || "";
        } catch (err) {
            /* ignore */
        }
        return "";
    }

    copyLink(item) {
        this.copyText(this.iconUrl(item)).then(() => {
            showMessage(this.i18n.copied);
        }).catch(() => {
            showMessage(this.iconUrl(item));
        });
    }

    async copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
    }

    /* ── 最近使用 ── */

    readRecent() {
        try {
            const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
            return Array.isArray(list) ? list : [];
        } catch (err) {
            return [];
        }
    }

    pushRecent(item) {
        if (this.conf.recentLimit <= 0) return;
        const list = this.readRecent().filter((slug) => slug !== item.s);
        list.unshift(item.s);
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, this.conf.recentLimit)));
        } catch (err) {
            /* 配额满时忽略 */
        }
    }

    /* ── 设置 ── */

    initSetting() {
        const cdnSelect = document.createElement("select");
        cdnSelect.className = "b3-select fn__block";
        [["jsdelivr", "jsDelivr（推荐）"], ["raw", "GitHub raw"], ["custom", this.i18n.setCdnCustom]]
            .forEach(([value, label]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                option.selected = value === this.conf.cdn;
                cdnSelect.appendChild(option);
            });

        const cdnInput = document.createElement("input");
        cdnInput.className = "b3-text-field fn__flex-1";
        cdnInput.placeholder = CDN_JSDELIVR;
        cdnInput.value = this.conf.cdnCustom || "";
        cdnInput.style.display = this.conf.cdn === "custom" ? "" : "none";
        cdnSelect.addEventListener("change", () => {
            cdnInput.style.display = cdnSelect.value === "custom" ? "" : "none";
        });

        const insertSelect = document.createElement("select");
        insertSelect.className = "b3-select fn__block";
        [["asset", this.i18n.setInsertAsset], ["cdn", this.i18n.setInsertCdn]].forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            option.selected = value === this.conf.insertMode;
            insertSelect.appendChild(option);
        });

        const recentInput = document.createElement("input");
        recentInput.type = "number";
        recentInput.min = "0";
        recentInput.max = "20";
        recentInput.className = "b3-text-field fn__flex-center fn__size200";
        recentInput.value = String(this.conf.recentLimit);

        const breadcrumbInput = document.createElement("input");
        breadcrumbInput.type = "checkbox";
        breadcrumbInput.className = "b3-switch fn__flex-center";
        breadcrumbInput.checked = !!this.conf.showBreadcrumb;

        const statusInput = document.createElement("input");
        statusInput.type = "checkbox";
        statusInput.className = "b3-switch fn__flex-center";
        statusInput.checked = !!this.conf.showStatusBar;

        this.setting = new Setting({
            confirmCallback: () => {
                this.conf.cdn = cdnSelect.value;
                this.conf.cdnCustom = cdnInput.value.trim();
                this.conf.insertMode = insertSelect.value;
                this.conf.recentLimit = Math.min(20, Math.max(0, Number(recentInput.value) || 0));
                this.conf.showBreadcrumb = breadcrumbInput.checked;
                this.conf.showStatusBar = statusInput.checked;
                this.saveData(STORAGE, this.conf).catch((err) => {
                    showMessage("save settings failed: " + err);
                });
                this.syncInjections();
                showMessage(this.i18n.savedTip);
            },
        });

        this.setting.addItem({
            title: this.i18n.setCdn,
            direction: "row",
            description: this.i18n.setCdnDesc,
            createActionElement: () => {
                const wrap = document.createElement("div");
                wrap.className = "fn__flex fn__flex-1";
                wrap.style.gap = "6px";
                wrap.appendChild(cdnSelect);
                wrap.appendChild(cdnInput);
                return wrap;
            },
        });
        this.setting.addItem({
            title: this.i18n.setInsert,
            direction: "row",
            description: this.i18n.setInsertDesc,
            createActionElement: () => insertSelect,
        });
        this.setting.addItem({
            title: this.i18n.setRecent,
            direction: "row",
            description: this.i18n.setRecentDesc,
            createActionElement: () => recentInput,
        });
        this.setting.addItem({
            title: this.i18n.setBreadcrumb,
            direction: "row",
            description: this.i18n.setBreadcrumbDesc,
            createActionElement: () => breadcrumbInput,
        });
        this.setting.addItem({
            title: this.i18n.setStatusBar,
            direction: "row",
            description: this.i18n.setStatusBarDesc,
            createActionElement: () => statusInput,
        });
    }

    openSetting() {
        if (!this.setting) return;
        super.openSetting();
    }

    syncInjections(forceRemove) {
        const wantBreadcrumb = !forceRemove && !!this.conf.showBreadcrumb;
        if (wantBreadcrumb && !this.breadcrumbAdded) {
            this.addBreadcrumbButton({
                id: "dashboard-icons",
                icon: "iconDashIcons",
                title: this.i18n.pluginName,
                callback: (event, protyle) => {
                    event.preventDefault();
                    this.activeProtyle = protyle;
                    this.openPanel();
                },
            });
            this.breadcrumbAdded = true;
        } else if (!wantBreadcrumb && this.breadcrumbAdded) {
            this.removeBreadcrumbButton("dashboard-icons");
            this.breadcrumbAdded = false;
        }

        const wantStatus = !forceRemove && !!this.conf.showStatusBar;
        if (wantStatus && !this.statusElement) {
            const el = document.createElement("div");
            el.className = "dicon-statusbar b3-tooltips b3-tooltips__n";
            el.setAttribute("aria-label", this.i18n.pluginName);
            el.innerHTML = `<svg><use xlink:href="#iconDashIcons"></use></svg>`;
            el.addEventListener("click", () => this.openPanel());
            this.addStatusBar({element: el});
            this.statusElement = el;
        } else if (!wantStatus && this.statusElement) {
            this.statusElement.remove();
            this.statusElement = null;
        }
    }

    esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        }[c]));
    }
}

module.exports = DashboardIconsPlugin;
