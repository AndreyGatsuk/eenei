// Preview active projects.
def label(String name, boolean active) {
    if (active) {
        return "Project: ${name}"
    }
    return 'Archived'
}
println label('eenei', true)
