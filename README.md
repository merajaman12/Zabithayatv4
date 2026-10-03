# Zabit Hayat Tele — Supabase Edition

This version uses:
- GitHub Pages for hosting
- Supabase Auth for a real private admin login
- Supabase Postgres for site settings, posts and social links
- Supabase Storage for real image/video uploads
- Row Level Security (RLS)

## 1. Create Supabase project
Create a project at Supabase, then open SQL Editor and run `supabase.sql`.

## 2. Create the first admin
In Supabase Dashboard → Authentication → Users, create a user with email/password.
Then copy that user's UUID and run:

update public.admins set enabled = true where user_id = 'YOUR-USER-UUID';

The SQL creates the admin table and policies. Only enabled admin users can write.

## 3. Configure the website
Open `config.js` and replace:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Use the project's public URL and anon/publishable key. NEVER put the service_role/secret key in GitHub.

## 4. GitHub Pages
Upload all files, preserving the `admin/` folder.
Set GitHub Pages to deploy from the main branch.

Public site:
`https://YOUR-USERNAME.github.io/YOUR-REPO/`

Admin:
`https://YOUR-USERNAME.github.io/YOUR-REPO/admin/`

The admin page is not linked from the public site, but security comes from Supabase Auth + RLS, not from hiding the URL.

## 5. Storage
The SQL creates a `media` bucket and policies. The admin can upload images and videos from the admin panel.

## 6. What the admin can manage
- 8 posts
- Post title
- Description
- Purchase/link URL
- Image/video upload
- Publish/unpublish
- Telegram purchase CTA title, description and link
- Telegram, Pinterest, VK and Facebook Page links
- Website name and description

## Important
Do not use the old frontend-password version. This version does not store an admin password in JavaScript.
