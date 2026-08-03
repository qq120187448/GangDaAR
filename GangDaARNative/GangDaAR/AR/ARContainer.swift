import ARKit
import Combine
import RealityKit
import UIKit

final class ARContainer: ARView, ARSessionDelegate, ObservableObject {
    @Published var statusText = "正在初始化 AR..."
    @Published var isLiDARAvailable = false
    @Published var isLoading = false
    @Published var selectedModel: ARModelEntry =
        ModelCatalog.shared.models.first ??
        ARModelEntry(
            id: "empty",
            name: "未选择模型",
            file: "",
            heightMeters: 1,
            category: "",
            accent: "#888888",
            rotationYDegrees: 0
        )

    @Published var showSceneMesh = false {
        didSet {
            debugOptions = showSceneMesh ? [.showSceneUnderstanding, .showWorldOrigin] : []
        }
    }

    @Published var occlusionEnabled = true {
        didSet { applySceneUnderstanding() }
    }

    @Published var environmentLightEnabled = true {
        didSet { applyLighting() }
    }

    @Published var shadowsEnabled = true {
        didSet { applyLighting() }
    }

    private var placedAnchor: AnchorEntity?
    private var placedEntity: Entity?
    private var lightAnchor: AnchorEntity?
    private var sunLight: DirectionalLight?
    private var fillLight: DirectionalLight?

    override init(frame: CGRect) {
        super.init(frame: frame, cameraMode: .ar, automaticallyConfigureSession: true)
        configure()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        configure()
    }

    private func configure() {
        setupGestures()
        setupSession()
        setupLights()
    }

    private func setupSession() {
        guard ARWorldTrackingConfiguration.isSupported else {
            statusText = "此设备不支持 ARKit"
            return
        }

        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic

        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
            configuration.sceneReconstruction = .meshWithClassification
            isLiDARAvailable = true
        }
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            configuration.frameSemantics.insert(.sceneDepth)
            configuration.frameSemantics.insert(.smoothedSceneDepth)
        }

        session.delegate = self
        session.run(configuration, options: [.removeExistingAnchors, .resetTracking])
        applySceneUnderstanding()
        applyLighting()
        statusText = isLiDARAvailable
            ? "LiDAR 遮挡已就绪，轻点屏幕放置模型"
            : "已就绪，轻点屏幕放置模型"
    }

    private func setupLights() {
        lightAnchor = AnchorEntity(world: matrix_identity_float4x4)
        guard let lightAnchor else { return }

        let sun = DirectionalLight()
        sun.light.intensity = 1100
        sun.light.color = UIColor(red: 1.00, green: 0.97, blue: 0.90, alpha: 1)
        sun.light.castsShadow = true
        sun.light.shadowMaximumDistance = 10
        sun.light.shadowDepthBias = 0.02
        sun.orientation =
            simd_quatf(angle: -0.7, axis: SIMD3<Float>(1, 0, 0)) *
            simd_quatf(angle: 0.6, axis: SIMD3<Float>(0, 1, 0))
        sunLight = sun

        let fill = DirectionalLight()
        fill.light.intensity = 180
        fill.light.color = UIColor(red: 0.75, green: 0.85, blue: 1.00, alpha: 1)
        fill.orientation =
            simd_quatf(angle: 0.35, axis: SIMD3<Float>(1, 0, 0)) *
            simd_quatf(angle: 2.7, axis: SIMD3<Float>(0, 1, 0))
        fillLight = fill

        lightAnchor.addChild(sun)
        lightAnchor.addChild(fill)
        scene.addAnchor(lightAnchor)
        applyLighting()
    }

    private func applyLighting() {
        environment.lighting.intensityExponent = environmentLightEnabled ? 1.0 : 0.2
        sunLight?.light.castsShadow = shadowsEnabled
        sunLight?.light.intensity = environmentLightEnabled ? 1100 : 250
        fillLight?.light.intensity = environmentLightEnabled ? 180 : 60
    }

    private func applySceneUnderstanding() {
        var options = environment.sceneUnderstanding.options
        if occlusionEnabled {
            options.insert(.occlusion)
        } else {
            options.remove(.occlusion)
        }
        options.insert(.receivesLighting)
        environment.sceneUnderstanding.options = options
    }

    private func setupGestures() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        addGestureRecognizer(tap)

        let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        pan.minimumNumberOfTouches = 1
        pan.maximumNumberOfTouches = 1
        addGestureRecognizer(pan)
    }

    @objc private func handleTap(_ sender: UITapGestureRecognizer) {
        guard sender.state == .ended else { return }
        placeSelectedModel(at: sender.location(in: self))
    }

    @objc private func handlePan(_ sender: UIPanGestureRecognizer) {
        guard placedAnchor != nil else { return }
        switch sender.state {
        case .began, .changed:
            let results = raycast(from: sender.location(in: self), allowing: .estimatedPlane, alignment: .any)
            if let hit = results.first {
                placedAnchor?.transform = Transform(matrix: hit.worldTransform)
            }
        default:
            break
        }
    }

    func placeSelectedModel(at point: CGPoint) {
        guard !isLoading, !selectedModel.file.isEmpty else { return }
        let results = raycast(from: point, allowing: .estimatedPlane, alignment: .any)
        guard let hit = results.first else {
            statusText = "未检测到平面，请移动手机扫描桌面或地面"
            return
        }

        let transform = hit.worldTransform
        let planeAnchor = hit.anchor as? ARPlaneAnchor
        let isHorizontal = planeAnchor?.alignment == .horizontal
        let surfaceNormal: SIMD3<Float>
        if let planeAnchor {
            surfaceNormal = SIMD3<Float>(
                planeAnchor.transform.columns.1.x,
                planeAnchor.transform.columns.1.y,
                planeAnchor.transform.columns.1.z
            )
        } else {
            surfaceNormal = SIMD3<Float>(0, 1, 0)
        }

        isLoading = true
        let entry = selectedModel
        Task { @MainActor in
            do {
                try await loadAndPlace(
                    entry: entry,
                    transform: transform,
                    surfaceNormal: surfaceNormal,
                    isHorizontal: isHorizontal
                )
                isLoading = false
            } catch {
                isLoading = false
                statusText = "模型加载失败：\(error.localizedDescription)"
            }
        }
    }

    func placeSelectedModelAtCenter() {
        placeSelectedModel(at: CGPoint(x: bounds.midX, y: bounds.midY))
    }

    @MainActor
    private func loadAndPlace(
        entry: ARModelEntry,
        transform: simd_float4x4,
        surfaceNormal: SIMD3<Float>,
        isHorizontal: Bool
    ) async throws {
        removePlacedModel()
        let name = (entry.file as NSString).deletingPathExtension
        guard !name.isEmpty else {
            throw ModelError.invalidModelFile
        }

        let entity = try await Entity(named: name, in: Bundle.main)
        let anchor = AnchorEntity(world: transform)
        anchor.addChild(entity)
        scene.addAnchor(anchor)
        placeEntity(
            entity,
            in: anchor,
            entry: entry,
            surfaceNormal: surfaceNormal,
            isHorizontal: isHorizontal
        )
        placedAnchor = anchor
        placedEntity = entity
        statusText = "已放置 \(entry.name)，高 \(String(format: "%.2f", entry.heightMeters)) 米"
    }

    private func placeEntity(
        _ entity: Entity,
        in anchor: AnchorEntity,
        entry: ARModelEntry,
        surfaceNormal: SIMD3<Float>,
        isHorizontal: Bool
    ) {
        let rawBounds = entity.visualBounds(relativeTo: anchor)
        let rawHeight = max(rawBounds.extents.y, 0.0001)
        let scale = Float(entry.heightMeters) / rawHeight
        entity.scale = SIMD3<Float>(repeating: scale)

        var yaw: Float = 0
        if isHorizontal {
            if let camera = session.currentFrame?.camera {
                let anchorPosition = SIMD3<Float>(anchor.position.x, 0, anchor.position.z)
                let cameraPosition = SIMD3<Float>(
                    camera.transform.columns.3.x,
                    0,
                    camera.transform.columns.3.z
                )
                let toCamera = simd_normalize(cameraPosition - anchorPosition)
                if simd_length_squared(toCamera) > 0.0001 {
                    yaw = atan2f(toCamera.x, toCamera.z)
                }
            }
        } else {
            let flatNormal = simd_normalize(SIMD3<Float>(surfaceNormal.x, 0, surfaceNormal.z))
            if simd_length_squared(flatNormal) > 0.0001 {
                yaw = atan2f(flatNormal.x, flatNormal.z)
            }
        }

        let catalogRotation = simd_quatf(
            angle: Float(entry.rotationYDegrees) * Float.pi / 180,
            axis: SIMD3<Float>(0, 1, 0)
        )
        let baseRotation = simd_quatf(angle: yaw, axis: SIMD3<Float>(0, 1, 0))
        entity.setOrientation(baseRotation * catalogRotation, relativeTo: anchor)

        let scaledBounds = entity.visualBounds(relativeTo: anchor)
        var position = SIMD3<Float>(0, -scaledBounds.min.y, 0)
        if !isHorizontal {
            let depth = max(scaledBounds.extents.z, 0.05)
            position += SIMD3<Float>(surfaceNormal.x, 0, surfaceNormal.z) * (depth * 0.5)
        }
        entity.position = position
    }

    func rotatePlacedModel(byDegrees degrees: Float) {
        guard let entity = placedEntity, let anchor = placedAnchor else { return }
        let current = entity.orientation(relativeTo: anchor)
        let delta = simd_quatf(angle: degrees * Float.pi / 180, axis: SIMD3<Float>(0, 1, 0))
        entity.setOrientation(delta * current, relativeTo: anchor)
    }

    func removePlacedModel() {
        if let anchor = placedAnchor {
            scene.removeAnchor(anchor)
        }
        placedAnchor = nil
        placedEntity = nil
    }

    func session(_ session: ARSession, didFailWithError error: Error) {
        statusText = "AR 会话失败：\(error.localizedDescription)"
    }
}
