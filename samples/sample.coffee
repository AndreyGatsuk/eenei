# Preview active projects.
label = (name, active) ->
  if active
    "Project: #{name}"
  else
    'Archived'
console.log label('eenei', true)
