# Dashboard 图标

[English](README.md) · **简体中文**

思源笔记插件。搜 [dashboard-icons](https://github.com/homarr-labs/dashboard-icons) 里的 3400 多个自托管服务图标，插进正文，或者设成文档图标。

图标不是我画的，全部来自 homarr-labs/dashboard-icons。上游一直在加新的，这边用脚本同步。

![预览](preview.png)

## 怎么用

顶栏、工具栏、面包屑栏都有入口，快捷键 `⌥⇧D`。

打开面板直接打字搜。左键把图标插到光标处，右键还有几个选项：设为文档图标、复制链接、只下载不插入。

搜索有优先级：slug 完全匹配 > slug 前缀 > 显示名前缀 > 其他。搜 `plex`，第一个就是 Plex，`plexdrive` 排在后面。

## 关于分类

上游 3450 条记录里只有 1711 条填了分类，而且两套命名规则混着用（`Networking-Tools` 和 `network` 指的是同一件事）。我归成了 12 个大类，没分类的按 slug 关键词猜，猜不出来就丢进「其他」，现在有 1696 个在里面。

所以分类只适合缩小范围，找具体图标还是靠搜。

搜索默认匹配 slug、显示名、别名、分类。嫌结果多的话，设置里有「只匹配名称」开关，开了以后 `home` 从 125 条降到 25 条，`media server` 从 55 条降到 1 条。

## 文件落在哪

| 动作 | 位置 |
| --- | --- |
| 设为文档图标 | `data/emojis/dashboard-icons/` |
| 插入正文 | `assets/dashboard-icons/` |

都是点了才下载，不会把 3400 个图标塞进你的工作空间。想清理直接删这两个目录。

不想占笔记仓库空间，把设置里的插图方式改成「直接引用外链」，图片只存 CDN 地址。

## 明暗变体

每个图标有两种变体，`-light` 是给深色背景用的，`-dark` 是给浅色背景用的。这个命名确实容易记反，插件的选择逻辑跟着思源的明暗模式走，你不用手动挑。

## 设置

图标源（jsDelivr / GitHub raw / 自定义镜像）、插图方式、只匹配名称、最近使用数量、面包屑按钮、状态栏按钮。

## 更新图标数据

```bash
python3 scripts/sync-icons.py
```

抓上游 `metadata.json`，归一化分类、补猜缺失的部分，生成 `icons.json`（343 KB，gzip 后 59 KB）。完事重新打包。

`scripts/make-assets.py` 重新生成集市图标和预览图，需要 Pillow。

## 授权

插件代码 MIT。

图标来自 homarr-labs/dashboard-icons，Apache-2.0，全文在 `licenses/dashboard-icons-LICENSE.txt`。插件不打包任何图标文件，全部按需从 CDN 拉。

商标归各自所有者，图标只用于标识对应服务，不表示任何背书。这插件跟 Homarr Labs 没有隶属关系。
