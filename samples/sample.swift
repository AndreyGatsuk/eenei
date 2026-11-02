// Preview active projects.
func label(_ name: String, active: Bool) -> String {
    if active {
        return "Project: \(name)"
    }
    return "Archived"
}
print(label("eenei", active: true))
