# 寒煦 · Hanxu

寒煦的公开个人网站。品牌主张：**寒处有煦，作品通途**。
GitHub Pages 从 `main` 分支根目录发布到 <https://hanxuzz.github.io>。

## 本地预览

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8080>。无构建步骤、无运行时依赖。

## 页面与功能

- 冷蓝与暖阳首屏：日出入场、指针光线偏移、磨砂地平线。
- 作品集：分类筛选、卡册与终端概念视觉、详情弹窗。
- 个人介绍、创作路径、公开作品更新、GitHub 联系入口。
- 全站快捷搜索（`⌘ K` / `Ctrl K`）、深浅主题、复制 GitHub 地址。
- 手机适配、键盘焦点、原生对话框、减少动态效果偏好支持。
- 字体与视觉资源全部本地提供，不依赖第三方图片或脚本。

## 维护内容

编辑 `projects.json`，作品列表、搜索和更新记录会一起更新。

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定的英文标识，使用字母、数字或连字符 |
| `name` | 对外名称 |
| `one_liner` | 一句话介绍 |
| `description` | 详情介绍 |
| `category` | `产品` 或 `开源` |
| `status` | `开发中`、`进行中`、`已上线` 或 `搁置` |
| `stack` | 技术栈标签数组 |
| `highlights` | 详情特点数组 |
| `links` | 公开链接数组，每项包含 `label` 和 `url` |
| `updated` | 可选，`YYYY-MM-DD`，展示为公开作品更新日期 |

个人介绍与品牌文案在 `index.html`；视觉在 `css/site.css`；交互在 `js/site.js`。
作品主视觉为概念演绎，不是产品截图。新增作品时可在 `artwork()` 中扩展独立视觉。

## 公开边界

仅展示仓库中已确认的公开身份与作品。联系方式使用 <https://github.com/hanxuzz>。
不要加入私人邮箱、电话、住址、内部项目、订单、密钥或私有仓库链接。
未经确认不添加履历、客户数量、产品使用数据或外部评价。

## 设计依据与许可

参考 [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) 的品牌导向设计方法，围绕“寒”与“煦”的冷暖关系建立原创视觉。
英文字体 [Instrument Sans](https://github.com/Instrument/instrument-sans) 按 SIL Open Font License 保存在 `fonts/`；中文使用系统字体。

## 验证

```bash
node --check js/site.js
python3 -m json.tool projects.json > /dev/null
```

浏览器中检查：作品分类、详情关闭与 Escape、搜索匹配与空结果、主题切换、复制反馈、手机布局。

## 认证与学习方向

`index.html` 包含 AWS Solutions Architect – Professional 与 DevOps Engineer – Professional 的认证展示，以及 AI 学习方向（LLM、RAG、Agent）。学习方向是个人计划，不代表已完成课程或取得 AI 认证。

两枚 AWS 徽章来自本人[公开 GitHub 仓库](https://github.com/hanxuzz/hanxuzz)，保存在 `assets/certifications/`，展示链接指向原始公开资料，不作为有效期验证。未填写未经确认的获证日期、有效期或认证编号。

剧变（DramaShift）按本次用户指定展示为「开发中」，不提供未公开的仓库或本地试玩链接。作品介绍聚焦 AI 互动叙事，不公开内部世界包、凭证和部署信息。
