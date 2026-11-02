@echo off
rem Preview the active projects.
set "PROJECT=eenei"
if defined PROJECT (
  echo %PROJECT%
) else (
  echo "No project"
)
for %%F in (*.json) do echo %%F
exit /b 0
