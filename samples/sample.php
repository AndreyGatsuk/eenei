<?php
// Preview the active projects.
function label(array $project): string {
    if ($project['active']) {
        return "Project: {$project['name']}";
    }
    return 'Archived';
}
$project = ['name' => 'eenei', 'active' => true];
echo label($project);
?>
<p class="preview">Project preview</p>
