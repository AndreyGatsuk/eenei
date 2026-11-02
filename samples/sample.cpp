#include <iostream>
#include <optional>
#include <string>
#include <vector>

namespace preview {

struct Project {
    std::string name;
    bool archived = false;
};

/// Find the first project that is still active.
std::optional<Project> first_active(const std::vector<Project>& projects) {
    for (const auto& project : projects) {
        if (project.archived) {
            continue; // Archived projects stay out of navigation.
        }
        return project;
    }
    return std::nullopt;
}

} // namespace preview

int main() {
    const std::vector<preview::Project> projects{{"Navigate", false}};
    if (const auto project = preview::first_active(projects)) {
        std::cout << "Project: " << project->name << '\n';
    }
}
