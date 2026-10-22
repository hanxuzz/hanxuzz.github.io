# hanxuzz.github.io

Hanxu Zhao / 赵晗旭 的公开个人主页。GitHub Pages 从 `main` 分支的根目录发布到 <https://hanxuzz.github.io>。

页面只放已经公开的身份和作品。联系方式是 GitHub 主页：<https://github.com/hanxuzz>。

## 修改作品

编辑根目录的 [`projects.json`](projects.json)。首页脚本读取这个文件，画出作品卡片。

| 字段 | 说明 |
| --- | --- |
| `id` | 稳定的英文标识 |
| `name` | 对外名称 |
| `one_liner` | 一句话介绍 |
| `status` | `进行中`、`已上线` 或 `搁置` |
| `stack` | 技术栈标签 |
| `links` | 公开链接，每项包含 `label` 和 `url` |
| `updated` | 可选，格式 `YYYY-MM-DD` |

合并到 `main` 之后，Pages 会自动更新站点。

只写已经公开的内容。不要写入私人邮箱、电话、住址、内部代号、订单、密钥，或未公开仓库的链接。

## 本地预览

```bash
python3 -m http.server 8080
```

打开 <http://127.0.0.1:8080>。

英文字体是 [Instrument Sans](https://github.com/Instrument/instrument-sans)，按 SIL Open Font License 放在 `fonts/`。
