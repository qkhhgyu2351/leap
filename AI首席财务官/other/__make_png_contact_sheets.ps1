param([string]$root1,[string]$root2,[string]$out)
Add-Type -AssemblyName System.Drawing
$roots=@($root1,$root2)
$font=New-Object System.Drawing.Font('Arial',8)
foreach($root in $roots){
  if(!(Test-Path -LiteralPath $root)){ Write-Output "NOT_FOUND: $root"; continue }
  $files=Get-ChildItem -LiteralPath $root -Filter '*.png' -File -Recurse -Force | Sort-Object FullName
  $name=Split-Path $root -Leaf
  for($b=0;$b -lt [math]::Ceiling($files.Count/12);$b++){
    $batch=$files | Select-Object -Skip ($b*12) -First 12
    $sheet=New-Object System.Drawing.Bitmap(1380,1050)
    $g=[System.Drawing.Graphics]::FromImage($sheet); $g.Clear([System.Drawing.Color]::Gainsboro)
    $i=0
    foreach($f in $batch){
      $x=($i%3)*460; $y=[int]([math]::Floor($i/3)*260)
      try{
        $im=[System.Drawing.Image]::FromFile($f.FullName)
        $scale=[math]::Min(430/$im.Width,205/$im.Height)
        $w=[int]($im.Width*$scale); $h=[int]($im.Height*$scale)
        $g.DrawImage($im,$x+([int]((460-$w)/2)),$y+5,$w,$h); $im.Dispose()
      }catch{}
      $rel=$f.FullName.Substring($root.Length+1); if($rel.Length -gt 62){$rel='...'+$rel.Substring($rel.Length-59)}
      $g.DrawString($rel,$font,[System.Drawing.Brushes]::Black,$x+5,$y+215)
      $g.DrawString("$($f.Length) bytes",$font,[System.Drawing.Brushes]::Black,$x+5,$y+232)
      $i++
    }
    $target=Join-Path $out ("__png_contact_{0}_{1:00}.jpg" -f $name,($b+1))
    $sheet.Save($target,[System.Drawing.Imaging.ImageFormat]::Jpeg); $g.Dispose(); $sheet.Dispose(); Write-Output $target
  }
}
