# Breeders Blog: Frontend

The React single-page app at [www.breedersblog.net](https://www.breedersblog.net). It also has one Vercel Function, [`api/post.js`](api/post.js), which pre-renders post metadata for search engines and link previews (see [SEO](#seo)).

**Stack:** React 19, Vite 8, Tailwind CSS 4, React Router 7, Clerk (`@clerk/react`), `vite-plugin-svgr`.

## Running it

```bash
npm install
cp .env.example .env   # fill in VITE_CLERK_PUBLISHABLE_KEY
npm run dev            # http://localhost:5173 (expects the backend on :4000)
npm run lint
npm run build          # outputs dist/ (gitignored; Vercel builds its own)
```

| Variable | Purpose |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (Clerk dashboard → API Keys) |
| `VITE_API_BASE_URL` | Backend base URL including `/api`: `http://localhost:4000/api` locally, `https://api.breedersblog.net/api` in production |

Only `VITE_`-prefixed variables reach the browser bundle. Set both on the Vercel project too. `api/post.js` reads `VITE_API_BASE_URL` at runtime.

## Folder layout

```
api/post.js          Vercel Function: server-rendered <head> for /posts/:id
public/              served as-is: logo, favicon, headshot, robots.txt
sample_post/         downloadable post templates linked from the About page
vercel.json          rewrites (sitemap, post pages, SPA fallback) and security headers
src/
  main.jsx           providers: Clerk → CurrentUser → Toast → ErrorBoundary → App
  App.jsx            builds the routes from config/routes.jsx
  index.css          Tailwind import + theme colors (accent green, canvas)
  config/            routes.jsx, topics.jsx, site.jsx
  pages/             one thin component per route
  components/
    ui/              shared primitives
    layout/          Header/ (Brand, DesktopNav, MobileMenu, AuthButtons), Footer, ErrorBoundary, RequireRole
    post/            PostTile, PostCarousel, CreatePostModal, LinkPostModal, LinkedPosts, reader/
    admin/ comment/ search/ share/ vote/
  lib/
    api/             client.jsx (all endpoints), useApi.jsx
    auth/            CurrentUserProvider, useCurrentUser, useRequireSignIn
    hooks/           useAsync, useAsyncAction, useDebouncedValue, useClickOutside, useEscapeKey
    post/ comment/ vote/ share/ seo/ toast/ utils/
  assets/icons/      every SVG icon
```

Conventions:
- Imports use `@/` for `src/` (configured in `vite.config.js` and `jsconfig.json`).
- Every file in `src/` is `.jsx` except `lib/seo/seo.js`, which `api/post.js` imports in plain Node and must stay free of imports.

## How it works

### Configuration drives the UI
- **`config/routes.jsx`** is the single route table. Each entry is `{ path, label, element, nav, role }`. `App.jsx` turns it into routes, wrapping any entry with a `role` in `RequireRole`. The header nav (`navRoutes()`) and the footer's citation title (`routeLabel()`) read the same table. Adding a page means adding one row.
- **`config/topics.jsx`** lists the topics. Each topic gets the shared `pages/Topic.jsx` at `/topics/:slug`. It must match `TOPIC_SLUGS` in the backend's `src/config/topics.js`.
- **`config/site.jsx`** holds the site name, author, tagline, logo, headshot and contact links.

### Data flow
- **API client.** `lib/api/client.jsx` defines every endpoint in `createApi(getToken)`. Each call attaches the Clerk session token when there is one. `useApi()` returns a memoized client, so it's safe to list in hook dependencies. `fetchPost` and `fetchComments` are also exported standalone for public reads.
- **Loading data.** `useAsync(fetcher, deps, { enabled, initialData })` loads data and resets when its deps change. It drops responses from superseded requests, and its `setData` lets callers patch the result in place.
- **Mutations.** `useAsyncAction()` returns `{ run, pending, error }` for submit/delete flows. `run` resolves to `true` or `false`.
- **Feature hooks own the state; components render it:**
  - `usePostFeed(fetcher, deps)` returns a post list plus `actions`: vote, pin, lock, archive, delete. The Topic page and every `PostCarousel` use it, and each `PostTile` receives `actions`.
  - `useComments(postId)` returns the comment tree plus `actions`: add, vote, remove, restore.
  - `usePostSearch(query)` is a debounced title/abstract search, used by the header search and the link-posts modal.
- **Optimistic updates.** Votes and pins update the UI immediately through `lib/vote/useOptimisticList.jsx`. Rapid clicks collapse into one request (400 ms debounce, never overlapping), and a failure rolls back to the exact previous state. `lib/vote/voting.jsx` predicts the server's toggle rules exactly.

### Auth and roles
- Clerk handles sign-in and sign-up through modals.
- `CurrentUserProvider` fetches `GET /api/me` once per session to learn the role (`USER`, `MODERATOR`, `ADMIN`). `useCurrentUser()` exposes `isAdmin`, `isModerator` and `hasRole(role)`.
- `useRequireSignIn()` guards reader actions: vote, pin and comment show a "Please sign in" toast when signed out.
- Role checks in the UI are for convenience only. The backend enforces every permission itself.

### Reading a post
- `PostReader` fetches the post, including its moderator-stitched HTML, and renders it in a **sandboxed iframe** (`allow-scripts` without `allow-same-origin`). Quarto/Plotly scripts still run, but in an opaque origin with no access to the app or the Clerk session.
- `lib/post/postHtml.jsx` prepares the HTML:
  - It extracts Quarto's table of contents for the app's own sidebar (`Toc.jsx`).
  - It injects a storage shim, since `localStorage` throws inside the sandbox.
  - It injects a bridge script for `postMessage` traffic.
- `usePostFrame` is the parent side of that bridge. It sizes the iframe to its content, so the page has a single scrollbar, and it handles TOC jumps and in-page anchor links.
- `PostArticle` is keyed by post id, so iframe height and TOC state reset between posts.

### Icons
Every `.svg` in `src/assets/icons/` becomes a React component via `vite-plugin-svgr`. `components/ui/Icon.jsx` picks them all up by file name, so `<Icon name="pin" className="h-5 w-5" />` works with no registration step. The SVGs draw with `currentColor` and have no fixed size, so they take the text color and Tailwind size classes of wherever they're placed. No `dangerouslySetInnerHTML` anywhere.

### UI primitives (`components/ui/`)

| Component | What it is |
| --- | --- |
| `Button` | Text button with a variant (`primary`, `accent`, `danger`, `ghost`, `plain`, `outline`) and size |
| `IconButton` | Single-icon button: required `label`, `tone`, `pressed` toggle, `stopPropagation` |
| `Modal` | Popup shell with backdrop and Escape-to-close; optional `title`, `subtitle`, `showClose`; `ModalActions` footer |
| `ConfirmModal` | "Are you sure?" popup used for delete and archive |
| `Dropdown` | Trigger plus floating panel that closes on outside click |
| `Collapsible` | Show/hide section; the body stays in the DOM so it's crawlable |
| `FilePicker` | Validated single-file chooser |
| `TextField` | Labeled input or textarea with a character counter |
| `Badge`, `Tooltip`, `Message`, `Page`, `ExternalLink` | Small shared pieces |

### Sharing
`lib/share/providers.jsx` is a plain list of share targets: copy link, Facebook, email, Reddit, X, LinkedIn. The first four appear in the share modal; the rest go under "More". To add a platform, add one entry, using `popupProvider()` for web-intent popups.

## SEO

The site is client-rendered, so a few pieces exist only so search engines and link previews see real content.

- **One set of meta tags.** `index.html` holds exactly one of each tag: title, description, robots, canonical, Open Graph and Twitter card, all with the site defaults.
- **In the browser,** `lib/seo/useSeo.jsx` rewrites those tags' values per page; it never adds new tags. Every page calls it:
  - Topic pages pass the topic's description.
  - Post pages pass `postSeo(post)`, which adds `BlogPosting` JSON-LD.
  - Admin and 404 pages pass `noindex`.
- **On the server,** `api/post.js` does the same for post pages, because social scrapers and non-JS crawlers never run React:
  - `vercel.json` rewrites `/posts/:id/:slug?` to it.
  - It fetches `index.html` plus the post's metadata (`GET /api/posts/:id?html=0`), fills in the tags and JSON-LD with `escapeHtml`, and caches for 5 minutes (`s-maxage=300, stale-while-revalidate=3600`).
  - Unknown or unapproved posts get a real `404` with `noindex`. The app still loads, so an author or moderator can see their pending post.
  - It shares `postSeo`, `postUrl` and `SITE_NAME` with the browser through `lib/seo/seo.js`.
- **Link previews.** A post's `og:title` is its bare title; LinkedIn, Facebook and X show the site name and domain beside it. `<title>` keeps the " — Breeders Blog" suffix.
  - A post with a **share image** (uploaded by the author in `CreatePostModal`, or replaced by the admin in `ApprovePostModal`) uses it as `og:image` with `twitter:card=summary_large_image`, which gives the large picture card. The backend serializes it as a public `imageUrl`.
  - Without one, the logo and the small `summary` card from `index.html` stay.
  - Platforms cache previews for days. After changing an image, re-scrape with [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) or the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
- **Post URLs** are `/posts/<id>/<slug>`. The backend computes the slug from the title, and routing ignores it, so old `/posts/<id>` links keep working.
- **Sitemap.** `/sitemap.xml` is generated by the backend and proxied onto this domain by a `vercel.json` rewrite. `public/robots.txt` points at it and disallows `/admin` and `/api/`.
- **Crawlable content.**
  - Post tiles contain real `<Link>`s, not just click handlers.
  - Collapsed About sections stay in the DOM (`hidden`, not unmounted).
- **Citation.** The footer's "Cite this page" line comes from `lib/post/citation.jsx`, which PostReader sets while a post is open.
- **Hardcoded domain.** Production URLs (`www.breedersblog.net`, `api.breedersblog.net`) are hardcoded in `index.html`, `public/robots.txt` and `vercel.json`. Update all three if the domain changes.

## Deployment

Vercel project `breeders-blog`, deployed from this folder. `vercel.json` adds:
- **Security headers:** `nosniff`, `DENY` framing, a referrer policy and a permissions policy.
- **Caching:** a one-year immutable cache for hashed `/assets/*`.
- **Rewrites:** the SPA fallback to `index.html`, after the sitemap and post-page rewrites.
