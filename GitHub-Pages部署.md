# GitHub Pages 与 JZMD Worker

前端目标地址：https://da-12-da.github.io/-/ 。仓库 main 更新后，`.github/workflows/pages.yml` 自动执行测试、生成 dist 并发布；GitHub 仓库 Settings → Pages 的 Source 选择 GitHub Actions。

前端仅提供静态页面。`deployment.json` 的公开后端地址为 `https://jzmd.1185846721.workers.dev`，构建后写入 `dist/config.json`。资源均采用相对地址，支持 `/-/` 仓库子路径与 hash 页面刷新。页面刷新会重置临时转盘结果，并保留浏览器中已录入的选项。

## 后端

继续使用百度，代码为 `worker/jzmd-worker.js`，配置为 `worker/wrangler.jsonc`。登录自己的 Cloudflare 账户后执行：

```powershell
npx wrangler login
npx wrangler secret put BAIDU_AK --config worker/wrangler.jsonc
npx wrangler deploy --config worker/wrangler.jsonc
```

在 secret 提示中安全输入百度 Web 服务 AK，或在 Cloudflare 的 JZMD → Settings → Variables and Secrets 中添加同名 Secret。不要把 AK 放入源码、GitHub 变量、聊天或截图。跨域允许来源为 `https://da-12-da.github.io`（不包含仓库路径）及本地开发地址。配置保留已有远端变量；发布前应确认账户与已有 Worker 名称。

## 验证与更新

本地执行 `node --test tests/*.test.mjs`、`node build.mjs`。安装 Playwright 的环境可执行 `node tests/browser.mjs`、`node tests/worker-browser.mjs` 和 `node tests/dist.mjs`；接口测试使用明确标记的测试数据，不代表真实百度接口已可用。

在电脑与手机打开 HTTPS 网站，添加两项、点击 GO、查看独立结果，再定位或输入区域查询。网络请求应发送到 JZMD Worker，不能含 AK；检查商家来源、所选商家与导航坐标一致。拒绝定位后应能输入区域，接口失败应显示错误且无虚构商家。真机地图唤起需在安装地图应用的手机确认。

修改前端后提交并推送 main，等待 Actions 的 Deploy GitHub Pages 成功即可，无需手动上传 dist。修改 Worker 后单独执行上述 wrangler deploy；GitHub Actions 不持有商家密钥，也不会发布后端。

网站和真实商家查询是独立部署状态：前端上线不等于 Worker 已配置密钥或百度账号权限、额度已验证。
