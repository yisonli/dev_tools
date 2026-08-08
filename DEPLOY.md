# 部署指南

本项目当前发布为独立工具站：`https://tool.7ys.top/`。本指南说明 GitHub Pages 与自定义子域名的实际配置。

## 🚀 快速部署步骤

### 1. 准备仓库

1. **Fork 或下载代码**
   - Fork 此仓库到你的 GitHub 账户
   - 或者下载代码并创建新的 GitHub 仓库

2. **保持现有配置**

   GitHub Actions 会运行 `npm run build`。不要把构建基础路径改为 `/dev_tools/`；自定义域名必须在 GitHub Pages 的 Custom domain 设置中保存，不能仅靠仓库中的 `CNAME` 文件。

### 2. 启用 GitHub Pages

1. 进入你的 GitHub 仓库设置页面
2. 找到 "Pages" 选项
3. 在 "Source" 部分选择 "GitHub Actions"

### 3. 推送代码

将代码推送到 `main` 分支：

```bash
git add .
git commit -m "部署开发者工具集合"
git push origin main
```

### 4. 配置 DNS 并等待部署完成

- GitHub Actions 会自动开始构建和部署流程
- 在 "Actions" 标签页可以查看部署进度
- 在域名服务商添加 CNAME 记录：主机记录 `tool`，记录值 `yisonli.github.io`；不要带 `https://`、端口或路径
- 在 GitHub 仓库 Settings -> Pages -> Custom domain 填入 `tool.7ys.top`，DNS 校验成功后启用 `Enforce HTTPS`
- 部署完成后，网站访问地址为 `https://tool.7ys.top/`

## 🔧 本地开发

### 环境要求

- Node.js 16 或更高版本
- npm 或 yarn

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📝 自定义配置

### 修改网站标题

编辑 `index.html`：
```html
<title>你的网站名称</title>
```

编辑 `src/App.vue`：
```vue
<h1 class="text-2xl font-bold text-primary-600">你的网站名称</h1>
```

### 添加自定义域名

1. 在仓库 Settings -> Pages -> Custom domain 中填写 `tool.7ys.top`
2. 在域名服务商处配置 CNAME 记录：`tool` 指向 `yisonli.github.io`
3. 等待 GitHub 完成 DNS 校验后启用 `Enforce HTTPS`

### 修改主题颜色

编辑 `tailwind.config.js`：
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // 修改这里的颜色值
        500: '#你的主色调',
        600: '#你的主色调深一点',
        // ...
      }
    }
  }
}
```

## 🛠️ 故障排除

### 部署失败

1. **检查仓库名称**：确保 `vite.config.js` 中的 `base` 路径正确
2. **检查分支名称**：确保推送到了 `main` 分支
3. **检查 Actions 权限**：在仓库设置 → Actions → General 中启用写入权限

### 页面无法访问

1. **等待传播**：DNS 传播可能需要几分钟
2. **清除缓存**：尝试强制刷新浏览器缓存
3. **检查 GitHub Pages 状态**：在仓库设置中确认 Pages 服务已启用

### 资源加载失败

- 检查 `vite.config.js` 中的 `base` 配置是否正确
- 确保路径前缀与仓库名一致

## 🔒 安全性注意事项

- 所有加密操作都在浏览器本地进行
- 不会向任何服务器发送敏感数据
- 代码完全开源，可以自行审查

## 📞 需要帮助？

如果部署过程中遇到问题：

1. 查看 [GitHub Actions 文档](https://docs.github.com/en/actions)
2. 查看 [GitHub Pages 文档](https://docs.github.com/en/pages)
3. 在项目中创建 Issue 寻求帮助

---

🎉 部署成功后，你就拥有了一个完全免费的在线开发者工具网站！
