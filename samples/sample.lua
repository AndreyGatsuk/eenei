-- Preview the active projects.
--[[ A multiline note
     for the preview. ]]
--- Build a display label.
local function label(project)
  if project.active then
    return "Project: " .. project.name
  elseif project.archived then
    return 'Archived'
  else
    return [=[No ]] active project]=]
  end
end

local projects = {
  { name = "eenei", active = true },
  { name = 'Draft', active = false },
}
local count <const> = 0x2A
local scale = 1.5e+2
local escaped = "line\nnext\tcolumn"
local sum = 2 + 3 * 4
local bits = 1 << 2 | 3
local ready = not false and count > 0
for index, project in ipairs(projects) do
  print(index, label(project))
end
local remaining = 3
while remaining > 0 do
  remaining = remaining - 1
  if remaining == 1 then break end
end
repeat
  remaining = remaining + 1
until remaining >= 2
local Project = {}
function Project:rename(name)
  self.name = name
end
return Project
