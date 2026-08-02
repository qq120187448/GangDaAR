# 模型来源与许可

本项目内置的 12 个 GLB 模型均已做以下处理：解除 Draco 压缩、统一方向、把高度归一化为 1 单位（App 内放大到 2 米）。

| 文件名 | 展示名称 | 来源 | 原始链接 |
| --- | --- | --- | --- |
| rx78.glb | RX-78-2 高达 | Poly Pizza, Tipatat Chennavasin | https://poly.pizza/m/26x_0PKFg-l |
| zaku2.glb | 夏亚专用扎古 II | Poly Pizza, Tipatat Chennavasin | https://poly.pizza/m/a-XvQuq7Lvv |
| rx78_weapons.glb | RX-78-2 武装型 | Poly Pizza, Tipatat Chennavasin | https://poly.pizza/m/fHalccv7ORh |
| kira.glb | Kira | three.js 官方示例 | https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf |
| bath_day.glb | 浴衣少女 | three.js 官方示例 | https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf |
| miku.glb | 初音未来 | Poly Pizza, sugamo | https://poly.pizza/m/2KgrjYOJPmf |
| doraemon.glb | 哆啦A梦 | Poly Pizza, sugamo | https://poly.pizza/m/bjWib-18r-C |
| princess.glb | 和风公主 | Poly Pizza, Aya Kawa | https://poly.pizza/m/aw7KVVWIhVL |
| omega_sisters.glb | Ω姐妹 | Poly Pizza, sugamo | https://poly.pizza/m/9BUk7hTIGzO |
| saber.glb | Saber | Poly Pizza, sugamo | https://poly.pizza/m/9YZ3eXy0imf |
| kakashi.glb | 卡卡西 | Poly Pizza, talibano | https://poly.pizza/m/3v0wITFgeg |
| raideen.glb | 勇者莱丁 | Poly Pizza, Tipatat Chennavasin | https://poly.pizza/m/9zLa6J13KAv |

## 注意事项

- Poly Pizza 上的模型为免费模型，具体授权以各模型页面标注为准（通常为 CC0 或 CC-BY）。
- three.js 官方示例模型随 MIT 许可的示例代码分发，但模型本身的原始权利属于各自作者。
- 高达、哆啦A梦、初音未来等属于 Bandai Namco / 藤子·F·不二雄制作公司 / Crypton Future Media 等权利方的角色与商标。
  当前仓库仅用于个人学习和技术演示，请勿在未获得授权的情况下用于商业发布。
- 原内置模型 `littlest_tokyo.glb`（小东京）在 iOS 加载时闪退，已从应用与源文件中删除。
- 原始 GLB 文件保留在 `model_src/`，转换脚本与参数在 `tools/` 下，方便替换或重建模型。
