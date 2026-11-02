# Preview active projects.
sub label(Str $name, Bool $active) {
    if $active {
        return "Project: $name";
    }
    return 'Archived';
}
say label('eenei', True);
