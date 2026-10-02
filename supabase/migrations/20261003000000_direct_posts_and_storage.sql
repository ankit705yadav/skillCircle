-- Drop the Edge Functions: posts are inserted directly by clients (no text
-- moderation for now) and poster images live in Supabase Storage instead of
-- ImageKit.

-- ---------------------------------------------------------------------------
-- Posters are stored as a path inside the `post-images` bucket, never as an
-- arbitrary URL. The client derives the public URL from the path.
-- ---------------------------------------------------------------------------

alter table public.skill_posts rename column poster_image_url to poster_image_path;

alter table public.skill_posts alter column author_id set default auth.uid();

-- Clients may insert only the content columns; author_id defaults to the
-- caller, archived/created_at keep their defaults.
grant insert (type, title, description, poster_image_path) on public.skill_posts to authenticated;

create policy "users create posts as themselves"
  on public.skill_posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      poster_image_path is null
      or poster_image_path like (select auth.uid())::text || '/%'
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket, uploads only into the uploader's own folder.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

create policy "users upload post images to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own post images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
