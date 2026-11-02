# Preview active projects.
use strict;
use warnings;
sub label {
    my ($name, $active) = @_;
    if ($active) {
        return "Project: $name";
    }
    return 'Archived';
}
print label('eenei', 1);
