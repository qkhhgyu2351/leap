from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

roots = [Path(r'D:\BaiduSyncdisk\上市公司\AI与科技相关'), Path(r'D:\BaiduSyncdisk\上市公司\整车上市公司')]
out = Path(r'D:\BaiduSyncdisk\上市公司\TXT\leaping\AI首席财务官\other')
font = ImageFont.load_default()
for root in roots:
    files = sorted(root.rglob('*.png'))
    if not files:
        continue
    root_name = root.name
    for batch_no in range((len(files)+11)//12):
        batch = files[batch_no*12:(batch_no+1)*12]
        cells=[]
        for p in batch:
            try:
                im=Image.open(p).convert('RGB')
                im.thumbnail((420,300))
                canvas=Image.new('RGB',(460,350),'white')
                x=(460-im.width)//2; y=8+(300-im.height)//2
                canvas.paste(im,(x,y))
                d=ImageDraw.Draw(canvas)
                label=str(p.relative_to(root))
                if len(label)>72: label='...'+label[-69:]
                d.text((8,315),label,fill='black',font=font)
                d.text((8,332),f'{im.width}x{im.height} | {p.stat().st_size} bytes',fill='black',font=font)
                cells.append(canvas)
            except Exception as e:
                canvas=Image.new('RGB',(460,350),'white'); ImageDraw.Draw(canvas).text((8,8),f'ERROR {p}: {e}',fill='red',font=font); cells.append(canvas)
        sheet=Image.new('RGB',(460*3,350*4),'#dddddd')
        for i,c in enumerate(cells): sheet.paste(c,((i%3)*460,(i//3)*350))
        target=out/f'__png_contact_{root_name}_{batch_no+1:02d}.jpg'
        sheet.save(target,quality=90)
        print(target)
