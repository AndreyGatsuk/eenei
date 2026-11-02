#include <stdio.h>
// Preview the active projects.
struct Project { const char *name; int active; };
int main(void) {
    struct Project project = { "eenei", 1 };
    if (project.active) {
        printf("Project: %s\n", project.name);
    }
    return 0;
}
