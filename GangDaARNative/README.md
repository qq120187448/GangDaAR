# GangDaARNative

原生 SwiftUI + ARKit + RealityKit 版高达 AR。和根目录的 ViroReact 工程并存，互不影响。

## 已实现

- 中文界面：模型列表、设置面板、状态提示
- LiDAR 场景网格遮挡：`sceneReconstruction = .meshWithClassification` + RealityKit `OcclusionMaterial`
- 实时环境光：`environmentTexturing = .automatic`，亮度随真实环境变化
- 方向光阴影 + 补光，开启 `receivesLighting` 让虚拟阴影投到真实网格
- 平面放置：桌面、地面、墙面均可用；拖动调整位置，按钮旋转 90 度
- 1:1 尺度：模型按动漫设定高度换算，高达统一 2 米，人物按设定身高
- 9 个内置 USDZ 模型，贴图统一 2K 以内

## 模型清单

| 模型 | 高度 |
| --- | --- |
| RX-78-2 高达 | 2.0 米 |
| 夏亚专用扎古 II | 2.0 米 |
| RX-78-2 武装型 | 2.0 米 |
| 勇者莱丁 | 2.0 米 |
| 初音未来 | 1.58 米 |
| 潘西·初音 | 1.58 米 |
| 地球酱 | 1.55 米 |
| 复古洋装少女 | 1.62 米 |
| 哆啦A梦 | 1.293 米 |

模型来源和授权说明见根目录 `MODEL_LICENSES.md`。MMD 社区模型仅用于个人学习演示，商用需取得原作者许可。

## 本地构建（需要 macOS + Xcode）

部署目标为 iOS 18.0，适用于 iPhone 12 Pro 等已升级到 iOS 18 的 LiDAR 机型。

```bash
brew install xcodegen
cd GangDaARNative
xcodegen generate
open GangDaAR.xcodeproj
```

在 Xcode 里选择真机签名后运行。也可以命令行出 IPA：

```bash
xcodebuild -project GangDaAR.xcodeproj -scheme GangDaAR -configuration Release \
  -destination generic/platform=iOS -derivedDataPath build/DerivedData build
```

## GitHub Actions 出 IPA

推送后运行 `Build Native iOS IPA`，产物为 `GangDaAR-Native-iOS` artifact。配置签名 secrets 后可直接安装到 iPhone 12 Pro；未配置时输出 unsigned IPA。

## 模型转换

`Models/*.usdz` 由 `assets/models/*.glb` 通过 Blender 转换生成：

```bash
python3 GangDaARNative/scripts/convert_models.py /path/to/blender
```

转换脚本会把模型统一缩放到指定真实高度，并把贴图限制在 2K 以内。
