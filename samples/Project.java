package preview;

import java.util.List;
import java.util.Objects;

/** A project with a stable identifier. */
public record Project(String id, String name, boolean archived) {
    public Project {
        Objects.requireNonNull(id, "Project ID is required");
    }

    public String displayName() {
        return name == null || name.isBlank() ? "Untitled" : name.strip();
    }

    public static List<String> activeNames(List<Project> projects) {
        // Preserve the input order for the navigation panel.
        return projects.stream()
            .filter(project -> !project.archived())
            .map(Project::displayName)
            .toList();
    }
}
