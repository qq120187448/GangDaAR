import Foundation

struct ARModelEntry: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let file: String
    let heightMeters: Double
    let category: String
    let accent: String
    let rotationYDegrees: Double
}

struct ARModelCatalog: Codable {
    let models: [ARModelEntry]
}

enum ModelError: LocalizedError {
    case invalidModelFile

    var errorDescription: String? {
        switch self {
        case .invalidModelFile:
            return "模型文件不存在"
        }
    }
}

enum ModelCatalog {
    static let shared: ARModelCatalog = {
        guard
            let url = Bundle.main.url(forResource: "models", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let catalog = try? JSONDecoder().decode(ARModelCatalog.self, from: data)
        else {
            return ARModelCatalog(models: [])
        }
        return catalog
    }()
}
