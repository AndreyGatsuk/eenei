module Main where
-- Preview the active projects.
data Project = Project { name :: String, active :: Bool }
label :: Project -> String
label project =
  if active project
    then "Project: " ++ name project
    else "Archived"
main :: IO ()
main = putStrLn (label (Project "eenei" True))
