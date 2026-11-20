alter table public.media add column if not exists taken_place text;
comment on column public.media.taken_place is 'Ortsname aus den Foto-Metadaten (EXIF-GPS), beim Upload ermittelt';
