# Cloudflare Pages 静态部署

以下保留早期纯静态部署记录。最新版本已实现独立的百度 JZMD Worker 与前端地址配置，当前操作请以 [百度地图接入部署.md](百度地图接入部署.md) 为准；不再需要自行编写适配层。真实 Worker 地址和线上联调仍待补齐。

## 本次构建

在「就这么定」目录执行 `node build.mjs` 已成功生成 `dist`。该命令与 `npm run build` 等价，本机目前未提供 npm 命令。应用无运行依赖，不需要先安装依赖。

输出文件：index.html、app.js、core.js、style.css、favicon.svg、success.wav、_headers、api/config，共 8 个文件。`api/config` 是无扩展名 JSON 文件，明确返回未配置商家接口。

## 创建并关联 Pages 项目

1. 登录 https://dash.cloudflare.com/ ，选择用于托管应用的 Cloudflare 账户。
2. 进入 **Workers & Pages**，点击 **Create application**，找到 **Pages / Get started**，选择 **Drag and drop your files / Direct Upload**。如果先进入 Worker 创建页，请切换到 Pages 入口。
3. 输入项目名，例如 `jiuzhemeding`，并按页面提示继续。项目名示例不是已占用或已创建的确认结果；实际名称和公开地址以 Cloudflare 返回为准。
4. 该流程把站点关联到所选 Cloudflare 账户下的 Pages 项目，不需要绑定 GitHub 仓库。若已有 Direct Upload 项目，直接进入项目并选择 **Create a new deployment**，环境选 **Production**。

Direct Upload 项目不能直接切换为 Git 自动部署，之后若需要 Git 集成，需新建 Git 集成项目。已有 Git 集成项目不支持控制台拖拽上传，可另建 Direct Upload 项目使用本流程。

## 上传 dist 并取得公开链接

1. 将本项目的整个 `dist` 文件夹拖到上传框，或通过文件夹选择按钮选中它。
2. 检查上传后的根层级直接包含 `index.html`，而不是 `dist/index.html`；保留 `api/config` 子目录结构和 `_headers` 文件。不要上传项目外层目录、`.env`、tests 或 server.mjs。
3. 确认文件上传完毕，点击 **Deploy site / Save and Deploy**。
4. 等待部署状态变为成功，在项目概览或部署详情中点击生产访问地址。通常形如 `https://项目名.pages.dev`；如名称冲突，可能附加字符。复制 Cloudflare 实际生成的地址即可公开分享。
5. 用手机或无痕窗口打开链接，添加至少两项，测试转盘、结果、彩带和音效。浏览器需在点击 GO 后才能正常授权音频播放。
6. 后续更新时，在本地重新执行 `node build.mjs` 或 `npm run build`，进入同一项目的 **Create a new deployment → Production**，上传完整的新 dist。完成后沿用原生产访问链接。

纯静态上传无需设置云端构建命令或服务器启动命令。本次只生成本地部署文件，没有登录 Cloudflare、创建远端项目或发布站点，因此当前没有新生成的公网链接。

## 可选：绑定自己的域名

1. Pages 项目中打开 **Custom domains → Set up a custom domain**。
2. 输入域名，例如 `eat.example.com`，按提示添加并核验 DNS。
3. 若 DNS 由其他服务商管理，子域名通常需创建 CNAME 指向该项目实际的 `项目名.pages.dev`。先在 Pages 中添加域名，再配置 DNS。
4. 若绑定根域名（如 `example.com`），该域名需作为站点加入同一 Cloudflare 账户，并按提示使用 Cloudflare 名称服务器。
5. 等待域名与证书状态生效后，即可用自己的 HTTPS 域名访问；没有自有域名时，直接使用 pages.dev 地址即可。

## 架构约定：Pages 前端 + 现有 JZMD Worker

Pages 仅托管 dist 中的前端文件，百度 POI 代理继续由已有 JZMD Cloudflare Worker 负责。无需在 Pages 新建代理、部署 Node 服务或迁移百度 AK。目标请求链路为：用户浏览器 → JZMD Worker → 百度 POI。百度 AK 只保存在 Worker 的服务端 Secret 中。

本次检查源码未找到 JZMD Worker 的完整地址、路由、请求参数或返回结构。因此本次构建仍明确显示「商家数据未接入」，不能声称已与现有 Worker 连通。Pages 上的 `/api/config` 是静态状态文件，不是 POI 代理。

完成联调需要 JZMD Worker 的完整 HTTPS 地址、接口调用示例或源码（不需要百度 AK）。确认接口后，前端商家请求应改为该 Worker 地址，按实际接口映射位置、半径、品类与响应字段；构建生成的 `_headers` 中 `connect-src` 也需加入该 Worker 的准确来源。目前 `connect-src` 仅允许同源，这是待接入项，不能仅手工改 URL 就认定完成。

Worker 需允许实际 Pages 生产来源跨域访问，并在需要时处理 OPTIONS 预检；失败响应也应带正确 CORS 头。用现有 Worker 配置实现，不把 AK 或服务端访问令牌作为前端参数。若 Worker 使用百度 BD-09 坐标，必须先核对并适配坐标系，不能直接冒充当前导航约定的 GCJ-02。接口返回若缺少评分、评价数或好评率，保留缺失状态。

在 Worker 信息补齐前，当前 dist 可以独立提供前端交互及未接入状态，但真实商家与导航业务端到端验收尚未完成。五页源码与原有 UI 均保留。

## 部署后验收方法

1. 电脑浏览器打开 Cloudflare 实际生成的生产 HTTPS 地址，建议使用无痕窗口，避免之前保存的清单干扰。确认页面资源正常、无白屏，新增两个自定义选项，检查空白与重复校验。
2. 点击 GO，确认转动期间无法重复触发，停止后自动进入独立结果页，结果与指针扇区一致，彩带正常，设备未静音时播放指定 WAV 音效。
3. 手机分别用 Wi-Fi 和移动网络打开同一生产链接，验证竖屏、横屏，检查转盘圆形、按钮可点、无横向滚动或裁切。iPhone Safari 与 Android Chrome 各至少一次；开启减少动态效果时彩带不播放属于预期。
4. 在浏览器开发者工具 Network 中检查 index.html、app.js、core.js、style.css、success.wav 均成功加载。当前构建的 `/api/config` 应返回 `{"configured":false}`，商家页应显示未接入，而不是报 JSON 解析错误。
5. Worker 接入后再检查：商家查询的 Request URL 必须为 JZMD Worker 的真实地址，而非 pages.dev/api/shops 或浏览器直接访问百度 POI；请求和静态文件中没有百度 AK，没有 CORS 或 CSP 报错。
6. 完成位置授权与拒绝后手动区域选择、3/5/10 公里切换、商家不足三家、零结果和接口错误验证。检查切换位置或范围后旧选店清空；选择商家进入确认页后，分别测试高德和百度地图的实际终点。
7. 对静态资源返回 404：确认 index.html 在上传根层级，音效和 api 子目录未遗漏；对 Worker 跨域失败：检查 Worker 的 CORS 和 Pages `_headers` 的 connect-src。两者不能相互替代。

## 后续版本更新

修改项目源码后，在「就这么定」子目录执行：

```powershell
node build.mjs
node tests/dist.mjs
```

安装了 npm 的环境也可使用 `npm run build`。浏览器验收脚本需要本机 Playwright 和 Chromium/Edge，配置方式见 README；构建本身无第三方依赖。

然后进入原 Pages 项目 → Create a new deployment → Production，上传完整新 dist，点击 Save and Deploy。成功后生产域名继续指向新版本；刷新或用无痕窗口复测。不要另建项目，也不要只上传单个 app.js。该操作仅更新 Pages 前端，不会更新或覆盖 JZMD Worker 及其 Secret。

官方文档（本次已核对）：

- [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Worker CORS 代理示例](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)

