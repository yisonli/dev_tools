# 故障排除指南

## 🚨 常见问题及解决方案

### 1. npm install 失败

**症状：** 出现 esbuild、vite 等依赖安装错误

**解决方案：**
```bash
# 方案1：清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --no-optional --legacy-peer-deps

# 方案2：使用yarn替代npm
npm install -g yarn
yarn install

# 方案3：使用cnpm（中国用户）
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### 2. Windows上权限问题

**症状：** 出现 EPERM、EBUSY 等权限错误

**解决方案：**
1. **以管理员身份运行命令行**
2. **关闭防病毒软件的实时保护**（临时）
3. **添加项目文件夹到防病毒软件白名单**
4. **使用PowerShell而不是CMD**

### 3. 端口被占用

**症状：** 启动时提示端口3000已被使用

**解决方案：**
```bash
# 查看占用端口的进程
netstat -ano | findstr :3000

# 杀死进程（替换PID为实际进程ID）
taskkill /PID 进程ID /F

# 或者使用其他端口
npm run dev -- --port 3001
```

### 4. 浏览器白屏或加载失败

**症状：** 打开localhost:3000显示白屏

**解决方案：**
1. **检查控制台错误**（F12开发者工具）
2. **清除浏览器缓存**（Ctrl+Shift+Delete）
3. **尝试无痕模式**
4. **检查防火墙设置**

### 5. 热重载不工作

**症状：** 修改代码后页面不自动刷新

**解决方案：**
1. **重启开发服务器**
2. **检查文件保存是否成功**
3. **使用硬刷新**（Ctrl+F5）

### 6. 构建失败

**症状：** npm run build 出错

**解决方案：**
```bash
# 清理dist目录
rm -rf dist

# 重新构建
npm run build

# 如果还是失败，尝试
npm run build -- --mode development
```

## 🔧 推荐的开发环境

### Node.js版本
- **推荐：** Node.js 16.x 或 18.x
- **最低：** Node.js 14.x

```bash
# 检查版本
node --version
npm --version
```

### IDE推荐
- **VS Code** + Vue Language Features (Volar) 插件
- **WebStorm**

### 浏览器支持
- Chrome 87+
- Firefox 78+
- Safari 14+
- Edge 88+

## 📋 完整的重置步骤

如果遇到无法解决的问题，可以完全重置项目：

```bash
# 1. 删除所有依赖和缓存
rm -rf node_modules
rm -rf .vite
rm -rf dist
rm package-lock.json

# 2. 清理npm缓存
npm cache clean --force

# 3. 重新安装
npm install --no-optional --legacy-peer-deps

# 4. 启动项目
npm run dev
```

## 🌐 网络问题

### 中国用户网络优化

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或者使用cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### 企业网络环境

```bash
# 如果在企业网络环境下
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# 取消代理设置
npm config delete proxy
npm config delete https-proxy
```

## 🆘 获取帮助

如果以上方案都无法解决问题：

1. **检查错误日志**：完整的错误信息通常在npm debug日志中
2. **查看系统要求**：确保系统满足所有依赖要求
3. **搜索相似问题**：在GitHub Issues中搜索相似错误
4. **提交Issue**：提供完整的错误日志和系统信息

---

💡 **小提示**：大部分问题都可以通过清理缓存和重新安装解决！
