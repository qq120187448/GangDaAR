import SwiftUI

struct RootView: View {
    @StateObject private var container = ARContainer(frame: .zero)
    @State private var showModelPicker = false
    @State private var showSettings = false

    var body: some View {
        ZStack(alignment: .top) {
            ARSceneView(container: container)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                header
                Spacer()
                hintBar
                controlBar
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            if container.isLoading {
                LoadingOverlay()
            }
        }
        .sheet(isPresented: $showModelPicker) {
            ModelPickerView(container: container)
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(container: container)
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text("高达 AR")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                Text(container.statusText)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.86))
                    .lineLimit(2)
            }
            Spacer(minLength: 8)
            Button {
                showSettings = true
            } label: {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .buttonStyle(.plain)
        }
    }

    private var hintBar: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(container.isLiDARAvailable ? Color.green : Color.orange)
                .frame(width: 8, height: 8)
            Text(container.isLiDARAvailable ? "LiDAR 遮挡已启用" : "此设备无 LiDAR")
                .font(.caption2.weight(.medium))
                .foregroundStyle(.white)
            Text("轻点屏幕放置，拖动可移动")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.8))
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(.ultraThinMaterial, in: Capsule())
        .padding(.bottom, 10)
    }

    private var controlBar: some View {
        HStack(spacing: 10) {
            ControlButton(icon: "square.grid.2x2", label: "模型") {
                showModelPicker = true
            }
            ControlButton(icon: "rotate.right", label: "旋转") {
                container.rotatePlacedModel(byDegrees: 90)
            }
            ControlButton(icon: "trash", label: "移除") {
                container.removePlacedModel()
            }
            ControlButton(icon: "viewfinder", label: "放置") {
                container.placeSelectedModelAtCenter()
            }
        }
        .padding(.bottom, 8)
    }
}
