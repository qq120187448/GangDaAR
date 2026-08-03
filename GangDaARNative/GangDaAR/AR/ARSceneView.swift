import SwiftUI

struct ARSceneView: UIViewRepresentable {
    let container: ARContainer

    func makeUIView(context: Context) -> ARContainer {
        container
    }

    func updateUIView(_ uiView: ARContainer, context: Context) {}
}
