-- Secret Link für einen einzelnen Beitrag (ohne Zugriff auf die ganze Reise)
alter type public.share_role add value if not exists 'post';
alter table public.share_links add column if not exists post_id uuid references public.posts (id) on delete cascade;
create index if not exists share_links_post_idx on public.share_links (post_id);
comment on column public.share_links.post_id is 'Nur bei role = post: Secret Link für genau diesen Beitrag';
