using System;
// Preview the active projects.
public record Project(string Name, bool Active);
public static class Preview {
    public static string Label(Project project) {
        if (project.Active) {
            return $"Project: {project.Name}";
        }
        return "Archived";
    }
}
