# Preview the active projects.
function Get-ProjectLabel {
    param([string]$Name, [bool]$Active)
    if ($Active) {
        return "Project: $Name"
    }
    return 'Archived'
}
$project = @{ Name = 'eenei'; Active = $true }
Get-ProjectLabel -Name $project.Name -Active $project.Active
