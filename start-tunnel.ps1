# start-tunnel.ps1  —  cloudflared auto quicklink updater
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── Settings ──────────────────────────────────────────────────────
$CF_EXE  = "C:\james\line_bot\cloudflared.exe"
$CF_ARGS = "tunnel --url http://localhost:5000 --protocol http2"
$LOG     = "$env:TEMP\cloudflared_out.log"
$API     = "http://localhost"
$SECRET  = "beinong2026"
$LABEL   = "合署辦公室交接系統"
# ─────────────────────────────────────────────────────────────────

Write-Host "=== Cloudflared Tunnel Launcher ===" -ForegroundColor Cyan

if (-not (Test-Path $CF_EXE)) {
    Write-Host "[ERROR] Not found: $CF_EXE" -ForegroundColor Red
    exit 1
}

# Clean old log
Remove-Item $LOG -Force -ErrorAction SilentlyContinue

# Start cloudflared, stderr -> log file, stdout visible
$proc = Start-Process -FilePath $CF_EXE -ArgumentList $CF_ARGS `
        -RedirectStandardError $LOG -NoNewWindow -PassThru

Write-Host "[OK] cloudflared PID=$($proc.Id), waiting for tunnel URL..." -ForegroundColor DarkGray

# Poll log for tunnel URL (max 30s)
$url = $null
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 500
    $txt = Get-Content $LOG -Raw -ErrorAction SilentlyContinue
    if ($txt -match 'https://([\w-]+\.trycloudflare\.com)') {
        $url = "https://$($Matches[1])"
        break
    }
}

if ($url) {
    Write-Host "[OK] Tunnel URL: $url" -ForegroundColor Green

    # Update quicklink via API
    try {
        $json = [System.Text.Encoding]::UTF8.GetBytes(
            "{`"label`":`"$LABEL`",`"url`":`"$url`"}"
        )
        $resp = Invoke-RestMethod "$API/api/quicklinks/tunnel" -Method Post `
                    -Body $json -ContentType "application/json; charset=utf-8" `
                    -Headers @{ "x-tunnel-key" = $SECRET }
        Write-Host "[OK] Quicklink updated!" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Quicklink update failed (update manually): $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] Tunnel URL not detected within 30s. Check: $LOG" -ForegroundColor Yellow
}

# Tail log to screen while waiting
Write-Host "--- cloudflared output ---" -ForegroundColor DarkGray
$n = 0
while (-not $proc.HasExited) {
    $lines = Get-Content $LOG -ErrorAction SilentlyContinue
    if ($lines -and $lines.Count -gt $n) {
        $lines[$n..($lines.Count - 1)] | ForEach-Object { Write-Host $_ }
        $n = $lines.Count
    }
    Start-Sleep -Milliseconds 500
}
Write-Host "[cloudflared exited]" -ForegroundColor DarkGray
