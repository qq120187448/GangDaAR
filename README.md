# GangDaAR

基于 ViroReact (React Native + Expo) 的 iOS AR 应用：在房间或户外空地点击地面，放置一个 2 米高的动漫/高达 3D 模型。内置 12 个模型，包含两台高达。

## 功能

- 平面检测：自动检测地板、桌面等水平面，轻点放置模型
- 12 个模型切换，均统一为 2 米高、脚底贴地
- 拖动调整位置，90 度步进旋转，随时重新放置
- 内置模型已解除 Draco 压缩、WebP 贴图转为 PNG，保证 ViroReact 兼容
- GitHub Actions 一键产出 IPA（配置签名后可直接安装到 iPhone）

## 本地运行

```bash
yarn install
npx expo prebuild --clean
npx expo run:ios
```

ViroReact 需要原生代码，不能在 Expo Go 中运行；需要用 development build。

## 在 GitHub 上编译 IPA

1. 把本仓库推送到 GitHub。
2. 打开仓库 Settings → Secrets and variables → Actions，添加以下 Secrets（用于正式签名；不添加也能跑，会输出未签名 IPA）：
   - `IOS_CERTIFICATE_BASE64`：`base64 -i Certificates.p12` 的输出
   - `IOS_CERTIFICATE_PASSWORD`：p12 密码
   - `IOS_PROVISIONING_PROFILE_BASE64`：Ad Hoc / Development 描述文件 base64
   - `IOS_TEAM_ID`：Apple 开发者 Team ID
   - `IOS_EXPORT_METHOD`：可选，默认 `ad-hoc`，也可以是 `development`
3. 在 Actions 页面手动运行 **Build iOS IPA**。
4. 构建完成后下载 `GangDaAR-iOS` artifact 中的 `.ipa`。

Ad Hoc 包需要把 iPhone 12 Pro 的 UDID 加入描述文件对应的设备列表，安装时用 Apple Configurator、Xcode 或第三方工具（如爱思助手）安装。

## 项目结构

```text
app/                  Expo Router 入口与 AR 页面
components/           AR 场景与模型目录
stores/               模型选择/放置状态的轻量 store
assets/models/        12 个已归一化 GLB
model_src/            原始 GLB 备份
tools/                模型转换、预览、WebP 转 PNG 脚本
.github/workflows/    IPA 构建工作流
```

## 模型许可

见 [MODEL_LICENSES.md](./MODEL_LICENSES.md)。高达等角色模型仅限个人学习演示，商用需取得权利方授权。
