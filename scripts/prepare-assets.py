from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'
OUT.mkdir(exist_ok=True)
ART=ROOT/'design-source'/'02_art'
images={
 'home.jpg':ART/'scene'/'mog_art_003_home_hero_v03_1672x941.png',
 'work.jpg':ART/'action'/'mog_art_004_work_default_v03_1672x941.png',
 'think.jpg':ART/'action'/'mog_art_005_idle_think_v03_1672x941.png',
 'phone.jpg':ART/'action'/'mog_art_006_idle_phone_v03_1672x941.png',
 'pretend.jpg':ART/'action'/'mog_art_007_pretend_busy_v03_1672x941.png',
 'wrap.jpg':ART/'action'/'mog_art_008_phone_wrap_up_v03_1672x941.png',
 'boss.jpg':ART/'patrol'/'mog_art_009_boss_observing_work_v03_1672x941.png',
 'caught.jpg':ART/'patrol'/'mog_art_010_boss_caught_phone_v03_1672x941.png',
 'exposed.jpg':ART/'patrol'/'mog_art_011_boss_exposed_pretend_v03_1672x941.png',
 'event-e01.jpg':ART/'event'/'mog_art_014_event_e01_colleague_help_v03_1672x941.png',
 'event-e02.jpg':ART/'event'/'mog_art_015_event_e02_extra_task_v03_1672x941.png',
 'event-e03.jpg':ART/'event'/'mog_art_016_event_e03_computer_stall_v03_1672x941.png',
 'event-e04.jpg':ART/'event'/'mog_art_013_event_e04_afternoon_tea_v03_1672x941.png',
 'event-e05.jpg':ART/'event'/'mog_art_017_event_e05_key_task_v03_1672x941.png',
 'event-e06.jpg':ART/'event'/'mog_art_018_event_e06_friday_message_v03_1672x941.png',
}
for name,src in images.items():
 im=Image.open(src).convert('RGB'); im.thumbnail((960,540),Image.Resampling.LANCZOS)
 im.save(OUT/name,'JPEG',quality=72,optimize=True,progressive=True)

print('Prepared',len(images),'images in',OUT,'; music is synthesized by src/music.js')
