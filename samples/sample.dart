// Preview the active projects.
class Project {
  final String name;
  final bool active;
  const Project(this.name, this.active);
}
String label(Project project) {
  if (project.active) {
    return "Project: ${project.name}";
  }
  return 'Archived';
}
void main() {
  const project = Project('eenei', true);
  print(label(project));
}
