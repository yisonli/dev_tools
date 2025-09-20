# 开发者工具集合

一个基于 Vue 3 的纯前端开发者工具集合，包含常用的编码、加密解密功能。所有操作均在本地完成，无需后端服务器，可直接部署到 GitHub Pages。

## ✨ 功能特性

### 🔐 加密解密工具
- **BASE64编码/解码** - 支持中文字符的Base64编码解码
- **AES加密/解密** - 支持多种模式（CBC/ECB/CFB/OFB/CTR）和填充方式
- **DES加密/解密** - 支持DES和3DES加密（包含安全警告）
- **RSA加密/解密** - 支持密钥对生成、加密解密、数字签名
- **SM2加密/解密** - 国密标准椭圆曲线加密算法

### 🌐 编码转换工具
- **URL编码/解码** - 支持 encodeURIComponent 和 encodeURI 两种模式
- **Unicode转换** - 支持Unicode、UTF-8、HTML实体、进制转换
- **URL解析工具** - 完整URL组件分析和查询参数解析

### 📱 图码生成工具
- **二维码工具** - 生成/解析二维码，支持文本、URL、WiFi、联系人等
- **条形码工具** - 生成多种格式条形码（EAN、UPC、Code128等）

### 📄 格式校验工具
- **JSON校验** - 格式化、压缩、校验、路径查询、格式转换
- **YAML校验** - 格式化、校验、JSON互转、配置文件模板

### 🎨 用户体验
- 现代化的响应式UI设计，支持移动端
- 分类导航菜单，工具分组管理
- 实时编码解码和格式校验
- 一键复制功能和文件下载
- 随机密钥生成和示例模板
- 详细的使用说明和安全提示
- 批量转换和路径查询功能

## 🚀 在线体验

访问: [https://yisonli.github.io/dev-tools/](https://yisonli.github.io/dev-tools/)

## 🛠️ 本地开发

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 快速开始

**Windows用户：**
```bash
# 直接运行启动脚本（推荐）
start-fix.bat

# 或手动执行
npm install --no-optional --legacy-peer-deps
npm run dev
```

**Linux/Mac用户：**
```bash
# 运行启动脚本
./start.sh

# 或手动执行
npm install
npm run dev
```

### 完整安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/yisonli/dev-tools.git
cd dev-tools

# 2. 安装依赖
npm install --no-optional --legacy-peer-deps

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build

# 5. 预览生产构建
npm run preview
```

### 🚨 遇到问题？

如果安装或运行时遇到错误，请查看 [故障排除指南](TROUBLESHOOTING.md)

## 📦 部署到 GitHub Pages

### 自动部署（推荐）

1. Fork 或下载此项目到你的 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages，选择 "GitHub Actions" 作为源
3. 修改 `vite.config.js` 中的 `base` 路径为你的仓库名
4. 修改 `package.json` 中的 `homepage` 字段
5. 推送代码到 main 分支，GitHub Actions 会自动构建和部署

### 手动部署

```bash
# 构建项目
npm run build

# 部署到 gh-pages 分支
npm run deploy
```

## 🔒 安全性说明

- **本地处理**: 所有加密解密操作均在浏览器本地完成
- **无数据传输**: 密钥和敏感数据不会发送到任何服务器
- **开源透明**: 代码完全开源，可自由审查和修改

## 🛡️ 加密算法说明

### AES (Advanced Encryption Standard)
- 对称加密算法，支持128/192/256位密钥
- 支持多种工作模式：CBC、ECB、CFB、OFB、CTR
- 推荐使用CBC模式，安全性较高

### RSA (Rivest-Shamir-Adleman)
- 非对称加密算法，支持1024/2048/4096位密钥
- 公钥加密，私钥解密
- 支持数字签名验证

### SM2 (国密标准)
- 基于椭圆曲线的非对称加密算法
- 中国国密标准，广泛应用于国内系统
- 支持C1C2C3和C1C3C2两种模式

## 📋 技术栈

- **框架**: Vue 3 + Vite
- **样式**: Tailwind CSS
- **路由**: Vue Router 4
- **核心库**: 
  - crypto-js (AES/DES加密)
  - jsencrypt (RSA加密)
  - sm-crypto (SM2国密加密)
  - qrcode + qr-scanner (二维码)
  - jsbarcode (条形码生成)
  - js-yaml (YAML解析)

## 🎯 扩展开发

项目采用模块化设计，易于扩展新功能：

1. 在 `src/components/tools/` 目录下创建新的工具组件
2. 在 `src/main.js` 中注册新路由
3. 在 `src/App.vue` 中添加导航链接

### 组件结构示例

```vue
<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <!-- 工具内容 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewTool',
  data() {
    return {
      // 组件数据
    }
  },
  methods: {
    // 工具方法
  }
}
</script>
```

## 📄 许可证

MIT License - 可自由使用、修改和分发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📞 联系方式

如有问题或建议，欢迎创建 Issue 或通过以下方式联系：

- GitHub: [yisonli](https://github.com/yisonli)
- Email: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
