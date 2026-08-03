import SwiftUI

struct ModelPickerView: View {
    @ObservedObject var container: ARContainer
    @Environment(\.dismiss) private var dismiss

    private var groupedModels: [(String, [ARModelEntry])] {
        let order = ["高达", "机甲", "角色"]
        return order.compactMap { category in
            let items = ModelCatalog.shared.models.filter { $0.category == category }
            return items.isEmpty ? nil : (category, items)
        }
    }

    var body: some View {
        NavigationView {
            List {
                ForEach(groupedModels, id: \.0) { section in
                    Section(section.0) {
                        ForEach(section.1) { model in
                            Button {
                                container.selectedModel = model
                                dismiss()
                            } label: {
                                row(model)
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("模型列表")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") { dismiss() }
                }
            }
        }
    }

    private func row(_ model: ARModelEntry) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(hex: model.accent))
                Text(String(model.name.prefix(1)))
                    .font(.headline)
                    .foregroundStyle(.white)
            }
            .frame(width: 40, height: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(model.name)
                    .font(.body.weight(.medium))
                    .foregroundStyle(.primary)
                Text("\(model.category) · 高 \(String(format: "%.2f", model.heightMeters)) 米")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18))
                .foregroundStyle(container.selectedModel.id == model.id ? Color.accentColor : Color.secondary.opacity(0.25))
        }
    }
}
