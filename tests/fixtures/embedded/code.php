<?php
// Preview standalone PHP code.
function label(array $project): string {
    if ($project['active']) {
        return "Project: {$project['name']}";
    }
    return 'Archived';
}
$project = ['name' => 'eenei', 'active' => true];
echo label($project);
