<#
.SYNOPSIS
  Measures how fast Raku starts and how much memory it uses while idle.

.DESCRIPTION
  Launches the app several times and reports, per run:
    - Window shown: time until the main window exists (the window is created before the notes
      have loaded, so this is the lower bound)
    - Settled:      time until the app (including its WebView2 processes) stops being busy, a good
      approximation of "ready to type"
    - Idle memory:  private memory of the whole process tree after it has been idle for a few seconds
      (this is what Task Manager adds up; WebView2 child processes are included)

  The app opens with your normal notes, so close Raku before running. Nothing is modified.
  Results depend on the machine, so always report the CPU and RAM next to the numbers.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File bench/startup.ps1
  powershell -ExecutionPolicy Bypass -File bench/startup.ps1 -Runs 15 -Exe "C:\path\to\raku-app.exe"
#>
param(
  [string]$Exe,
  [int]$Runs = 10,
  [int]$WarmUp = 1,        # runs discarded so the first cold start does not skew the result
  [int]$IdleSeconds = 6,   # how long to wait before reading memory
  [int]$TimeoutSeconds = 40
)

$ErrorActionPreference = "Stop"

function Resolve-Exe([string]$given) {
  if ($given) { return (Resolve-Path $given).Path }
  $candidates = @(
    "$env:LOCALAPPDATA\Raku\raku-app.exe",
    "$env:LOCALAPPDATA\Programs\Raku\raku-app.exe",
    "$PSScriptRoot\..\src-tauri\target\release\raku-app.exe"
  )
  foreach ($c in $candidates) { if (Test-Path $c) { return (Resolve-Path $c).Path } }
  throw "Could not find raku-app.exe. Pass it with -Exe `"C:\path\to\raku-app.exe`"."
}

# Fast process-tree lookup (Toolhelp snapshot, a few ms; Get-CimInstance would take ~300 ms per call
# and distort the startup timings)
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class RakuProcTree {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct PROCESSENTRY32 {
    public uint dwSize; public uint cntUsage; public uint th32ProcessID; public IntPtr th32DefaultHeapID;
    public uint th32ModuleID; public uint cntThreads; public uint th32ParentProcessID; public int pcPriClassBase;
    public uint dwFlags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string szExeFile;
  }
  [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr CreateToolhelp32Snapshot(uint flags, uint pid);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern bool Process32First(IntPtr h, ref PROCESSENTRY32 e);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern bool Process32Next(IntPtr h, ref PROCESSENTRY32 e);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
  public static int[] Tree(int root) {
    var parents = new Dictionary<uint, uint>();
    IntPtr snap = CreateToolhelp32Snapshot(2, 0);
    var e = new PROCESSENTRY32(); e.dwSize = (uint)Marshal.SizeOf(typeof(PROCESSENTRY32));
    if (Process32First(snap, ref e)) { do { parents[e.th32ProcessID] = e.th32ParentProcessID; } while (Process32Next(snap, ref e)); }
    CloseHandle(snap);
    var ids = new List<uint> { (uint)root };
    for (int i = 0; i < ids.Count; i++) foreach (var kv in parents) if (kv.Value == ids[i] && !ids.Contains(kv.Key)) ids.Add(kv.Key);
    return ids.ConvertAll(x => (int)x).ToArray();
  }
}
"@

function Get-Tree([int]$rootPid) { return [RakuProcTree]::Tree($rootPid) }

function Get-TreeCpuMs([int[]]$ids) {
  $total = 0.0
  foreach ($id in $ids) {
    try { $total += (Get-Process -Id $id -ErrorAction Stop).TotalProcessorTime.TotalMilliseconds } catch { }
  }
  return $total
}

function Get-TreePrivateMB([int[]]$ids) {
  $sum = 0.0
  foreach ($id in $ids) {
    $perf = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process -Filter "IdProcess=$id" -ErrorAction SilentlyContinue
    if ($perf) { $sum += $perf.WorkingSetPrivate } else {
      try { $sum += (Get-Process -Id $id -ErrorAction Stop).PrivateMemorySize64 } catch { }
    }
  }
  return $sum / 1MB
}

function Stop-Tree([int]$rootPid) {
  & taskkill.exe /PID $rootPid /T /F 2>&1 | Out-Null
  Start-Sleep -Milliseconds 600
}

function Median($values) {
  $s = @($values | Sort-Object)
  if ($s.Count -eq 0) { return [double]::NaN }
  return $s[[math]::Floor($s.Count / 2)]
}

$exePath = Resolve-Exe $Exe
$name = [IO.Path]::GetFileNameWithoutExtension($exePath)
if (Get-Process -Name $name -ErrorAction SilentlyContinue) {
  throw "$name is already running. Close it first so the measurement starts cold and your data is not shared."
}

$cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name.Trim()
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
Write-Host "Raku startup benchmark | $cpu | $ram GB RAM"
Write-Host "Executable: $exePath"
Write-Host "Runs: $Runs (+$WarmUp warm-up)`n"

$shown = @(); $settled = @(); $memory = @()

for ($run = 1; $run -le ($Runs + $WarmUp); $run++) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $proc = Start-Process -FilePath $exePath -PassThru
  $tWindow = $null; $tSettled = $null
  $lastCpu = 0.0; $quiet = 0

  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    Start-Sleep -Milliseconds 40
    $proc.Refresh()
    if ($proc.HasExited) { throw "The app exited during startup (run $run)." }
    if ($null -eq $tWindow -and $proc.MainWindowHandle -ne 0) { $tWindow = $sw.Elapsed.TotalMilliseconds }

    if ($null -ne $tWindow) {
      # "Settled": total CPU used by the whole tree barely changes for ~0.5 s
      $ids = Get-Tree $proc.Id
      $cpuNow = Get-TreeCpuMs $ids
      if (($cpuNow - $lastCpu) -lt 25) { $quiet++ } else { $quiet = 0 }
      $lastCpu = $cpuNow
      if ($quiet -ge 5) { $tSettled = $sw.Elapsed.TotalMilliseconds; break }
    }
  }
  if ($null -eq $tWindow) { Stop-Tree $proc.Id; throw "No window appeared within $TimeoutSeconds s (run $run)." }
  if ($null -eq $tSettled) { $tSettled = $sw.Elapsed.TotalMilliseconds }

  Start-Sleep -Seconds $IdleSeconds
  $mem = Get-TreePrivateMB (Get-Tree $proc.Id)
  Stop-Tree $proc.Id

  $tag = ""
  if ($run -le $WarmUp) { $tag = " (warm-up, discarded)" } else {
    $shown += $tWindow; $settled += $tSettled; $memory += $mem
  }
  "{0,2}: window {1,6:N0} ms | settled {2,6:N0} ms | idle memory {3,6:N0} MB{4}" -f $run, $tWindow, $tSettled, $mem, $tag
}

Write-Host ""
Write-Host "| Metric | Median | Best | Worst |"
Write-Host "|---|---:|---:|---:|"
function Row($label, $vals, $unit) {
  $m = Median $vals
  $mn = ($vals | Measure-Object -Minimum).Minimum
  $mx = ($vals | Measure-Object -Maximum).Maximum
  "| {0} | {1:N0} {4} | {2:N0} {4} | {3:N0} {4} |" -f $label, $m, $mn, $mx, $unit
}
Row "Window shown" $shown "ms"
Row "Settled (ready)" $settled "ms"
Row "Idle memory (all processes)" $memory "MB"
