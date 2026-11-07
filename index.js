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
    nameOnly: false,
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
/* 表情面板里的 Dashboard 图标 tab */
.dicon-emoji-tab{flex:0 0 auto;margin:0 2px;color:var(--b3-theme-on-surface);transition:color .12s}
.dicon-emoji-tab:hover,.dicon-emoji-tab.block__icon--active{color:var(--b3-theme-primary)}
.dicon-emoji-tab svg{width:16px;height:16px;display:block;fill:currentColor}
.dicon-ep{display:flex;flex-direction:column;flex:1;min-height:0}
.dicon-ep-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:2px;align-content:start;padding:2px 6px 8px}
.dicon-ep-item{display:flex;align-items:center;justify-content:center;height:48px;border-radius:6px;cursor:pointer;transition:background .12s}
.dicon-ep-item:hover{background:var(--b3-list-hover)}
.dicon-ep-item img{width:28px;height:28px;object-fit:contain;display:block;pointer-events:none}
.dicon-ep-empty{grid-column:1/-1;text-align:center;padding:40px 0;font-size:12px;color:var(--b3-theme-on-surface-light)}
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

        this.injectEmojiTab();
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
        if (this.emojiTabObserver) {
            this.emojiTabObserver.disconnect();
            this.emojiTabObserver = null;
        }
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
            // 两种匹配范围各缓存一份，切换开关时不用重算
            const cacheKey = this.conf.nameOnly ? "_hn" : "_h";
            let hay = item[cacheKey];
            if (!hay) {
                hay = this.conf.nameOnly
                    ? item.s + " " + item.n
                    : item.s + " " + item.n + " " + (item.a || "") + " " + (item.c || []).join(" ");
                item[cacheKey] = hay.toLowerCase();
                hay = item[cacheKey];
            }
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
        // 文档图标的 icon 属性要的是 `<组>/<文件>`，不能带 /emojis/ 前缀，
        // 带了思源解析不到，标题栏就是一个破图标。
        return `${EMOJI_GROUP}/${file}`;
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
        return this.activeDocId();
    }

    /**
     * 当前文档 id。
     *
     * 别用 `.protyle[data-doc-id]` 取——思源 3.8.9 的 .protyle 上根本没有这个属性
     * （只有 data-id 是 protyle 实例 id、data-node-id 才是文档 id），
     * 这么写过永远返回空，设图标时就会报「没有找到当前文档」。
     * 官方 API getAllEditor() 才是可靠来源。
     */
    activeDocId() {
        const list = typeof getAllEditor === "function" ? getAllEditor() : [];
        const editors = list.filter((e) => e && e.protyle && e.protyle.block);
        if (editors.length) {
            const visible = (e) => !e.protyle.element.classList.contains("fn__none");
            const focused = document.activeElement
                && editors.find((e) => visible(e) && e.protyle.element.contains(document.activeElement));
            if (focused) return focused.protyle.block.rootID || "";
            const vis = editors.find(visible);
            return (vis || editors[0]).protyle.block.rootID || "";
        }
        // 兜底：DOM 上真正放文档 id 的是 data-node-id，不是 data-doc-id
        const el = document.querySelector(".layout__wnd--active .protyle[data-node-id]")
            || document.querySelector(".protyle[data-node-id]");
        return el ? el.getAttribute("data-node-id") : "";
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

        const nameOnlyInput = document.createElement("input");
        nameOnlyInput.type = "checkbox";
        nameOnlyInput.className = "b3-switch fn__flex-center";
        nameOnlyInput.checked = !!this.conf.nameOnly;

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
                this.conf.nameOnly = nameOnlyInput.checked;
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
            title: this.i18n.setNameOnly,
            direction: "row",
            description: this.i18n.setNameOnlyDesc,
            createActionElement: () => nameOnlyInput,
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

    /**
     * 把 Dashboard 图标做成表情面板里的一个 tab。
     *
     * 表情面板是动态创建的，没有插件 API 可插入，只能用 MutationObserver 盯着。
     * 3450 个图标全部渲染会拖垮面板，所以默认只显示最近用过的，
     * 其余靠搜索，单次最多渲染 EP_LIMIT 个。
     */
    injectEmojiTab() {
        const EP_LIMIT = 120;

        const inject = () => {
            document.querySelectorAll(".emojis__tabheader").forEach((header) => {
                if (header.querySelector(".dicon-emoji-tab")) return;
                const dialog = header.closest(".b3-dialog");
                const body = dialog && dialog.querySelector(".emojis__tabbody");
                const linkTab = header.querySelector('[data-type="tab-link"]');
                if (!body || !linkTab) return;

                const tab = document.createElement("div");
                tab.className = "dicon-emoji-tab ariaLabel block__icon block__icon--show";
                tab.setAttribute("data-type", "tab-dash");
                tab.setAttribute("aria-label", this.i18n.pluginName);
                tab.innerHTML = '<svg><use xlink:href="#iconDashIcons"></use></svg>';

                const pane = document.createElement("div");
                pane.className = "fn__none dicon-ep";
                pane.setAttribute("data-type", "tab-dash");
                pane.innerHTML = `
                    <div class="fn__hr"></div>
                    <div class="fn__flex">
                        <span class="fn__space"></span>
                        <label class="b3-form__icon fn__flex-1" style="overflow:initial;">
                            <svg class="b3-form__icon-icon"><use xlink:href="#iconSearch"></use></svg>
                            <input spellcheck="false" class="b3-form__icon-input b3-text-field fn__block dicon-ep-search" placeholder="${this.esc(this.i18n.searchPlaceholder)}">
                        </label>
                        <span class="fn__space"></span>
                    </div>
                    <div class="fn__hr"></div>
                    <div class="dicon-ep-grid"></div>
                `;

                const input = pane.querySelector(".dicon-ep-search");
                const grid = pane.querySelector(".dicon-ep-grid");
                let keyword = "";
                let built = false;

                // 这个面板是「设图标」还是「插正文」打开的：垃圾桶只在非 insert 时显示
                const isIconMode = () => {
                    const rm = dialog.querySelector('[data-action="remove"]');
                    return !!rm && !rm.classList.contains("fn__none");
                };

                const pool = () => {
                    const kw = keyword.trim().toLowerCase();
                    if (!kw) {
                        // 没输入时给最近用过的，避免一次渲染几千个
                        const recent = (this.recent || []).slice(0, 24);
                        if (recent.length) return recent;
                        return this.icons.slice(0, 60);
                    }
                    const hit = this.icons.filter(
                        (it) =>
                            (it.n || "").toLowerCase().includes(kw) ||
                            (it.s || "").toLowerCase().includes(kw) ||
                            (it.a || "").toLowerCase().includes(kw) ||
                            (it.c || []).some((t) => String(t).toLowerCase().includes(kw))
                    );
                    return hit.slice(0, EP_LIMIT);
                };

                const render = () => {
                    const list = pool();
                    if (!list.length) {
                        grid.innerHTML = `<div class="dicon-ep-empty">${this.esc(this.i18n.noResult)}</div>`;
                        return;
                    }
                    grid.innerHTML = list
                        .map(
                            (it, i) => `<div class="dicon-ep-item" data-i="${i}" title="${this.esc(it.n || it.s)}">
                                <img src="${this.esc(this.iconUrl(it))}" loading="lazy" decoding="async" alt="">
                            </div>`
                        )
                        .join("");
                    grid._list = list;
                };

                grid.addEventListener("click", async (e) => {
                    const el = e.target.closest(".dicon-ep-item");
                    if (!el) return;
                    const item = (grid._list || [])[Number(el.getAttribute("data-i"))];
                    if (!item) return;
                    const mode = isIconMode() ? "docIcon" : "insert";
                    dialog.remove();
                    await this.run(item, null, mode);
                });

                // 中文输入法：组词时的回车是确认候选词，不能当提交
                let composing = false;
                input.addEventListener("compositionstart", () => {
                    composing = true;
                });
                input.addEventListener("compositionend", () => {
                    composing = false;
                    keyword = input.value;
                    render();
                });
                input.addEventListener("input", () => {
                    if (composing) return;
                    keyword = input.value;
                    render();
                });

                const activate = async () => {
                    header.querySelectorAll('[data-type^="tab-"]').forEach((t) => {
                        t.classList.toggle("block__icon--active", t === tab);
                    });
                    [...body.children].forEach((c) => c.classList.add("fn__none"));
                    pane.classList.remove("fn__none");
                    if (!built) {
                        built = true;
                        try {
                            await this.loadIndex();
                        } catch (err) {
                            /* 索引加载失败就显示空，不影响其他 tab */
                        }
                        render();
                    }
                    setTimeout(() => input.focus(), 30);
                };

                tab.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    activate();
                });
                header.addEventListener(
                    "click",
                    (e) => {
                        const t = e.target.closest('[data-type^="tab-"]');
                        if (t && t !== tab) tab.classList.remove("block__icon--active");
                    },
                    true
                );

                const space = linkTab.nextElementSibling;
                if (space && space.classList.contains("fn__space")) {
                    space.insertAdjacentElement("afterend", tab);
                } else {
                    linkTab.insertAdjacentElement("afterend", tab);
                }
                body.appendChild(pane);
            });
        };

        inject();
        this.emojiTabObserver = new MutationObserver(() => inject());
        this.emojiTabObserver.observe(document.body, { childList: true, subtree: true });
    }

    esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        }[c]));
    }
}

module.exports = DashboardIconsPlugin;
