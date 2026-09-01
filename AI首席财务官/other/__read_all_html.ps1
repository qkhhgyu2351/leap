param([string]$root1,[string]$root2,[string]$out)
$ErrorActionPreference='SilentlyContinue'
$roots=@($root1,$root2)
$sb=[System.Text.StringBuilder]::new()
[void]$sb.AppendLine('# HTML Full Reading Report')
[void]$sb.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine('')
foreach($root in $roots){
  if(!(Test-Path -LiteralPath $root)){ [void]$sb.AppendLine("## NOT FOUND: $root"); continue }
  $rootName=Split-Path $root -Leaf
  [void]$sb.AppendLine("## Source: $rootName")
  $files=Get-ChildItem -LiteralPath $root -File -Recurse -Force | Where-Object {$_.Extension.ToLower() -in @('.html','.htm')} | Sort-Object FullName
  foreach($f in $files){
    $rel=$f.FullName.Substring($root.Length+1)
    $raw=[System.IO.File]::ReadAllText($f.FullName)
    $title=''
    if($raw -match '(?is)<title[^>]*>(.*?)</title>'){ $title=([System.Net.WebUtility]::HtmlDecode($Matches[1]) -replace '\s+',' ').Trim() }
    $heads=@()
    foreach($m in [regex]::Matches($raw,'(?is)<h[1-6][^>]*>(.*?)</h[1-6]>')){ $t=$m.Groups[1].Value -replace '(?is)<[^>]+>',' '; $t=[System.Net.WebUtility]::HtmlDecode($t) -replace '\s+',' '; if($t.Trim()){ $heads += $t.Trim() } }
    $pngs=@()
    foreach($m in [regex]::Matches($raw,'(?is)(?:src|href)\s*=\s*["'']([^"'']+\.png[^"'']*)["'']')){ $pngs += $m.Groups[1].Value }
    $body=$raw -replace '(?is)<(script|style|noscript|svg|canvas)[^>]*>.*?</\1>',' ' -replace '(?is)<!--.*?-->',' ' -replace '(?is)<[^>]+>',' '
    $body=[System.Net.WebUtility]::HtmlDecode($body) -replace '[\u0000-\u0008\u000B\u000C\u000E-\u001F]',' ' -replace '\s+',' '
    [void]$sb.AppendLine("### $rel")
    [void]$sb.AppendLine("- Size: $($f.Length) bytes")
    [void]$sb.AppendLine("- Title: $title")
    [void]$sb.AppendLine("- Headings: $($heads -join ' / ')")
    [void]$sb.AppendLine("- PNG references: $($pngs -join ' | ')")
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('#### Readable text')
    [void]$sb.AppendLine($body.Trim())
    [void]$sb.AppendLine('')
  }
}
[System.IO.File]::WriteAllText($out,$sb.ToString(),[System.Text.UTF8Encoding]::new($false))
Write-Output "SAVED: $out"
Write-Output "BYTES: $((Get-Item -LiteralPath $out).Length)"
