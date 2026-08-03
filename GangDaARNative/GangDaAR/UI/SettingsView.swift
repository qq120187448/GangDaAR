import SwiftUI

struct SettingsView: View {
    @ObservedObject var container: ARContainer
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("AR 功能")) {
                    Toggle("LiDAR 深度遮挡", isOn: $container.occlusionEnabled)
                    Toggle("实时环境光", isOn: $container.environmentLightEnabled)
                    Toggle("方向光阴影", isOn: $container.shadowsEnabled)
                    Toggle("显示场景网格", isOn: $container.showSceneMesh)
                }

                Section(header: Text("设备")) {
                    LabeledContent("LiDAR", value: container.isLiDARAvailable ? "可用" : "不可用")
                    LabeledContent("内置模型", value: "\(ModelCatalog.shared.models.count) 个")
                }

                Section(
                    footer: Text("模型按动漫设定高度 1:1 展示，高达机体统一为 2 米。")
                ) {
                    EmptyView()
                }
            }
            .navigationTitle("设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") { dismiss() }
                }
            }
        }
    }
}
