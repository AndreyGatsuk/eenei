// Preview active projects.
let label name active =
    if active then
        "Project: " + name
    else
        "Archived"
printfn "%s" (label "eenei" true)
