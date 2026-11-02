# Preview the active projects.
class Project
  attr_reader :name
  def initialize(name, active)
    @name, @active = name, active
  end
  def label
    if @active
      "Project: #{@name}"
    else
      'Archived'
    end
  end
end
puts Project.new('eenei', true).label
