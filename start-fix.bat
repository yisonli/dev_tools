@echo off
echo 开发者工具集合 - Windows启动脚本
echo ================================

echo 检查Node.js版本...
node --version
if errorlevel 1 (
    echo 错误: 请先安装Node.js
    pause
    exit /b 1
)

echo.
echo 检查npm版本...
npm --version
if errorlevel 1 (
    echo 错误: npm未找到
    pause
    exit /b 1
)

echo.
echo 检查是否存在node_modules...
if not exist node_modules (
    echo node_modules不存在，开始安装依赖...
    echo.
    echo 如果遇到安装错误，将尝试修复...
    npm install --no-optional --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo 安装失败，尝试清理缓存后重新安装...
        npm cache clean --force
        rmdir /s /q node_modules 2>nul
        del package-lock.json 2>nul
        npm install --no-optional --legacy-peer-deps
        if errorlevel 1 (
            echo.
            echo 安装仍然失败，请检查网络连接或防病毒软件设置
            pause
            exit /b 1
        )
    )
) else (
    echo node_modules存在，跳过安装步骤
)

echo.
echo 启动开发服务器...
echo 服务器将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo.
npm run dev
