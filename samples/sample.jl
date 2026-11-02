# Preview active projects.
function label(name, active)
    if active
        return "Project: $name"
    end
    return "Archived"
end
println(label("eenei", true))
