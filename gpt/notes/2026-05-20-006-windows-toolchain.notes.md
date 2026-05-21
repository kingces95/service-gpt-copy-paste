# Windows Toolchain Notes

## Python

Install Python so Codex can run small repository scripts without falling back to
PowerShell one-offs.

Prefer the official Python installer or `winget` with PATH enabled. The normal
installer path has the nice Windows properties:

- appears in Apps & Features / uninstall
- installs the `py` launcher
- can add `python.exe` to PATH

## PowerShell and .NET

During the GPT docs filename sweep, Windows PowerShell could not find:

```powershell
[System.IO.Path]::GetRelativePath(...)
```

That usually means the shell is running on older .NET Framework APIs. The
practical fix is to install PowerShell 7 (`pwsh`), which runs on modern .NET and
has newer `System.IO.Path` helpers available.

Suggested additions:

```txt
PowerShell 7
└─ modern .NET runtime for scripts

.NET SDK
└─ useful if we write or run C# helper tools
```

The .NET SDK is optional for this JavaScript repo, but it is a good fit for the
project's C# lineage and for any future reflection/prototype experiments that
would benefit from small C# comparison tools.
