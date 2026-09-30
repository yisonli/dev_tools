# 工具箱

基于 Vue 3 的本地优先开发者工具箱。数据处理在浏览器中完成，无需后端服务。

线上地址：<https://tool.7ys.top/>

## 功能

| 分类 | 工具 |
| --- | --- |
| 编码 | Base64 编解码、URL 编解码与参数解析、Unicode / UTF-8 / HTML 实体转换 |
| 加密与摘要 | AES、DES / 3DES、RSA、SM2、MD5 / SHA 系列摘要 |
| 格式与文本 | JSON、YAML、文本 / JSON 差异对比、正则表达式、文本处理、JWT 解析 |
| 图码 | 二维码、条形码生成与图片识别 |
| 常用 | 时间戳与时区转换、随机密码、UUID v4 |

JWT 工具解析 Header、Payload 和过期状态，不验证签名。

## 编辑工作区

JSON、YAML、Base64、文本处理和 Diff 使用统一工作区：

- 大编辑区、行号、语法高亮、查找替换、撤销、换行开关和错误定位。
- 可收起导航；分栏支持拖动和方向键调整；可切换上下布局、专注模式或单区放大。
- 窄屏使用输入 / 结果标签切换，可用方向键操作；通过专注模式扩大工作区。
- 工具切换后保留当前会话的草稿、选项、编辑器撤销历史和换行设置；清空或替换后可恢复上一份输入。
- 修改输入或处理选项后，旧结果会标记为待更新，重新处理后才能复制、下载或发送到其他工具。
- 可将结果送入 JSON、YAML、Base64、文本处理或 Diff 的左侧 / 右侧；覆盖目标草稿前会提示。
- 文件导入和结果下载、复制成功 / 失败反馈，以及可取消的后台处理。

| 快捷键 | 操作 |
| --- | --- |
| `Ctrl/Cmd+K` | 搜索工具和当前工具的操作 |
| `Ctrl/Cmd+Enter` | 执行当前编辑区的主要操作 |
| `Ctrl/Cmd+F` | 编辑器内查找 |
| `Esc` | 关闭搜索或退出专注模式 |
| `Esc` 后按 `Tab` | 从编辑器切换到下一个控件 |

### 常见处理流程

- **JSON / YAML：**粘贴或导入 → 格式化、转换或路径查询 → 复制 / 下载。JSON 支持代码和树视图，可复制字段值与路径。
- **Base64：**选择编码 / 解码 → 处理。两种模式分别保留草稿，可以将结果用作反向输入，或将解码后的 JSON 送入 JSON 工具。
- **文本：**选择去空格、删除空行、去重、排序或大小写转换 → 处理 → 点击“结果用作输入”继续下一步。按行去重保留首次出现的行，空格不同的行视为不同内容。
- **Diff：**输入两份内容或分别从其他工具接收 → 选择文本 / JSON 语义比较 → 查看差异。支持交换左右、差异导航、忽略行首尾空白和忽略 JSON 对象键顺序；数组顺序始终参与语义比较。

### 数据与处理限制

工作内容只保存在当前页面会话的内存中，刷新后清空。浏览器仅持久保存收藏、最近使用和布局偏好。

- 一般输入上限 5 MB；自动处理和实时语法诊断上限 100 KB；一般处理超过 8 秒会终止。
- Diff 每侧上限 1 MB，复杂比较有超时限制；每个差异块最多预览 20000 字符，完整原文保留在编辑区。
- JSON 格式化、压缩、查询和转换保留数值精度。格式化保留重复键，语义查询、转换与比较要求先消除重复键歧义。
- JSON 嵌套上限 128 层，树视图上限 256K 字符。路径支持点号、数组索引和双引号键，如 `$.users[0].name`、`$["含点的键"]`，不支持完整 JSONPath 过滤表达式。
- YAML 使用 1.2 core 规则解析并支持合并键；格式化保留注释与数值原文，支持多文档。转 JSON 和查询每次处理一个文档，无法表示的特殊标签、复杂键、循环引用和非有限数值会明确报错。

## 本地开发

需要 Node.js 18+ 和 npm；当前 CI 使用 Node.js 18。依赖版本以 `package-lock.json` 为准。

```bash
git clone https://github.com/yisonli/dev_tools.git
cd dev_tools
npm ci
npm run dev
```

默认开发地址为 `http://localhost:3000`。也可指定端口：

```bash
npm run dev -- --port 5178
```

## 构建与部署

独立域名或根路径部署：

```bash
npm run build
npm run preview
```

GitHub Pages 项目子路径部署：

```bash
npm run build:project
npm run preview -- --base /dev_tools/
```

构建产物位于 `dist/`。项目页默认路径为 `/dev_tools/`，构建时可用 `GITHUB_REPOSITORY_NAME` 指定仓库名。

仓库的 Pages 来源应设置为 **GitHub Actions**。推送到 `main` 会触发 `.github/workflows/deploy.yml`，构建独立域名版本并部署；自定义域名在仓库 Pages 设置中配置，DNS 的 CNAME 指向对应的 GitHub Pages 域名；校验通过后启用 HTTPS。

## 测试

```bash
npm test
npx playwright install chromium
npm run test:e2e
npm run test:e2e:project
```

- `npm test` 检查数据正确性和处理边界。
- `test:e2e` 构建并验证根路径版本；`test:e2e:project` 构建并验证 `/dev_tools/` 版本。
- 浏览器测试自行启动和关闭预览服务，默认端口分别为 4173、4174。可用 `E2E_BASE_URL` 指定已有服务，用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定本机 Chromium / Chrome。
- PR 检查运行数据测试和两种部署路径的浏览器回归。测试报告及构建产物不纳入 Git。

## 常见问题

| 问题 | 检查方式 |
| --- | --- |
| 依赖安装失败 | 检查 Node.js 版本与网络，关闭占用依赖文件的进程后重新执行 `npm ci`，保留 lockfile |
| 开发或测试端口占用 | 开发服务用 `--port` 指定其他端口；浏览器测试可通过 `E2E_BASE_URL` 连接已有预览服务 |
| 部署后白屏 / 资源 404 | 检查 Pages 来源是否为 GitHub Actions，并确认构建的根路径 / 项目子路径与部署地址一致 |
| 复制失败 | 检查浏览器剪贴板权限；也可在编辑区选中文本手动复制 |
| 刷新后草稿消失 | 当前设计只保留页面会话内存，重要内容请先下载 |

## 项目结构

- `src/toolCatalog.js`：工具名称、分类、说明与导航元数据。
- `src/main.js`：路由与应用入口。
- `src/components/tools/`：各工具页面。
- `src/components/workspace/`：共享编辑器、工作区和输入输出操作。
- `src/composables/`：会话草稿、任务状态与快捷命令。
- `src/utils/`、`src/workers/`：数据处理与后台任务。
- `tests/`、`e2e/`：数据回归和浏览器流程测试。

新增工具时，在 `src/components/tools/` 创建页面，在 `src/main.js` 注册路由，再登记到 `src/toolCatalog.js`。导航和首页会自动生成。

主要技术：Vue 3、Vite、Tailwind CSS、CodeMirror 6、jsonc-parser、yaml、diff，以及各工具使用的加密和图码库。
