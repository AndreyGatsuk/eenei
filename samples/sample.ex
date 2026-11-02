defmodule ThemeLab.Project do
  # Preview the active projects.
  def label(project) do
    if project.active do
      "Project: #{project.name}"
    else
      "Archived"
    end
  end
end
project = %{name: "eenei", active: true}
IO.puts(ThemeLab.Project.label(project))
