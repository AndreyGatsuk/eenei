const std = @import("std");

// Preview active projects.
const Project = struct {
    name: []const u8,
    active: bool,
};

/// Return a label for an active project.
pub fn label(project: Project) ![]const u8 {
    if (!project.active) return error.Archived;
    return project.name;
}

const escaped = "line\nnext";
const multiline =
    \\Project preview
    \\Second line
;
const scale: f64 = 1.5e2;
const max_count = @as(usize, 6);

test "project label" {
    const project = Project{ .name = "eenei", .active = true };
    const name = try label(project);
    try std.testing.expectEqualStrings("eenei", name);
    var count: usize = 0;
    for ([_]u8{ 1, 2, 3 }) |value| {
        count += value;
    }
    try std.testing.expect(count > 0 and scale > 0 and count <= max_count);
    _ = escaped;
    _ = multiline;
}
