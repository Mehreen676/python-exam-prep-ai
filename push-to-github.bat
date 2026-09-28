@echo off
REM Push this project to your GitHub repo.
REM Run this script after extracting the project on your computer.
REM
REM Steps:
REM   1. Create an empty repo on GitHub (https://github.com/new)
REM      Owner: Mehreen676  /  Name: python-exam-prep-ai
REM      DO NOT tick "Initialize with README".
REM   2. Generate a Personal Access Token at https://github.com/settings/tokens
REM      (scope: repo). Copy it.
REM   3. Run this script. It will ask for your token. The token is NOT saved
REM      to disk permanently.

setlocal enabledelayedexpansion

set REPO_URL=https://github.com/Mehreen676/python-exam-prep-ai.git

echo === Pushing to %REPO_URL% ===
echo.

set /p TOKEN=Paste your GitHub Personal Access Token (ghp_...):

if "%TOKEN%"=="" (
  echo No token entered. Aborting.
  exit /b 1
)

REM Set your name/email for this repo only
git config user.name "Mehreen Zohair"
git config user.email "Mehreen676@users.noreply.github.com"

REM Add the remote (no token saved in URL)
git remote remove origin 2>nul
git remote add origin %REPO_URL%

REM Push using the token temporarily in the URL
git push "https://Mehreen676:%TOKEN%@github.com/Mehreen676/python-exam-prep-ai.git" main:main

if %errorlevel% neq 0 (
  echo.
  echo Push failed. Check the error above and try again.
  exit /b 1
)

echo.
echo Done! Your code is at https://github.com/Mehreen676/python-exam-prep-ai
