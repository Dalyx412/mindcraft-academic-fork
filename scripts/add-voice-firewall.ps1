# Mindcraft voice ports — run once as Administrator
$rules = @(
    @{ Name = 'Mindcraft VoiceWeb'; Port = 3099 },
    @{ Name = 'Mindcraft VoiceAudio'; Port = 8081 }
)

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Rule already exists: $($r.Name)"
    } else {
        New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol TCP -LocalPort $r.Port -Action Allow | Out-Null
        Write-Host "Added rule: $($r.Name) (TCP $($r.Port))"
    }
}

Get-NetFirewallRule -DisplayName 'Mindcraft Voice*' | Select-Object DisplayName, Enabled, Direction | Format-Table -AutoSize
