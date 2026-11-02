# Preview active projects.
label <- function(name, active) {
  if (active) {
    return(paste("Project:", name))
  }
  "Archived"
}
print(label("eenei", TRUE))
