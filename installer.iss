[Setup]
AppName=LoL Coach
AppVersion=1.0
DefaultDirName={autopf}\LoL Coach
DefaultGroupName=LoL Coach
OutputDir=dist
OutputBaseFilename=LoLCoach-Setup
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
SetupIconFile=flutter_app\windows\runner\resources\app_icon.ico
DisableProgramGroupPage=yes

[Files]
; The Flutter App files
Source: "flutter_app\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; The standalone Bridge Executable
Source: "bridge\dist\bridge.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\LoL Coach"; Filename: "{app}\lol_coach.exe"
Name: "{autodesktop}\LoL Coach"; Filename: "{app}\lol_coach.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"
