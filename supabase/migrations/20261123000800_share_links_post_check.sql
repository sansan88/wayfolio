alter table public.share_links add constraint share_links_post_role_check check ((role = 'post') = (post_id is not null));
