import Collapsible from "@/components/ui/Collapsible";
import ExternalLink from "@/components/ui/ExternalLink";
import Icon from "@/components/ui/Icon";
import Page from "@/components/ui/Page";
import { cn } from "@/lib/utils/cn";
import { useSeo } from "@/lib/seo/useSeo";
import sampleMarkdown from "../../sample_post/example_markdown.md?url";
import samplePythonQmd from "../../sample_post/example_python.qmd?url";
import sampleRQmd from "../../sample_post/example_r.qmd?url";
import sampleJuliaQmd from "../../sample_post/example_julia.qmd?url";
import sampleRmd from "../../sample_post/example_rmd.Rmd?url";

// Downloadable templates shown in "How to Create a Post" - one plain .md,
// a .qmd per language Quarto commonly runs code chunks in (Python, R,
// Julia), and a classic .Rmd. Each is an annotated skeleton (placeholder
// sections, inline comments, an equation, one runnable chunk) so a new
// author can copy it and start writing.
const SAMPLE_FILES = [
  {
    label: ".md template",
    filename: "example_markdown.md",
    href: sampleMarkdown,
    blurb: "prose only - headings, lists, tables, links, equations; no code",
  },
  {
    label: ".qmd template (Python)",
    filename: "example_python.qmd",
    href: samplePythonQmd,
    blurb: "Quarto + Jupyter kernel, interactive Plotly figure",
  },
  {
    label: ".qmd template (R)",
    filename: "example_r.qmd",
    href: sampleRQmd,
    blurb: "Quarto + knitr, ggplot2 figure",
  },
  {
    label: ".qmd template (Julia)",
    filename: "example_julia.qmd",
    href: sampleJuliaQmd,
    blurb: "Quarto + IJulia kernel, Plots.jl figure",
  },
  {
    label: ".Rmd template (R)",
    filename: "example_rmd.Rmd",
    href: sampleRmd,
    blurb: "classic R Markdown, knit from RStudio",
  },
];

// One collapsible top-level section of the page. Collapsed by default; the
// body stays in the DOM so crawlers can read it.
function Section({ title, as: Tag = "h2", children }) {
  return (
    <Collapsible title={<Tag className="text-xl font-bold">{title}</Tag>} className={Tag === "h1" ? "" : "mt-10"}>
      <div className="mt-4 space-y-4 text-gray-700">{children}</div>
    </Collapsible>
  );
}

// A heading within a section ("The short version", "Voting", ...).
function Subheading({ children }) {
  return <h3 className="font-semibold text-gray-900">{children}</h3>;
}

// A shaded aside box with its own small heading.
function Tip({ title, children }) {
  return (
    <div className="rounded-md bg-canvas p-3">
      <h4 className="mb-1 font-semibold text-gray-900">{title}</h4>
      {children}
    </div>
  );
}

// A site icon sitting in a sentence, so the instructions show exactly what
// to look for. `className` tints it to match the real button.
function InlineIcon({ name, size = "h-5 w-5", className }) {
  return <Icon name={name} inline className={cn(size, "align-text-bottom", className)} />;
}

function About() {
  useSeo({
    title: "About",
    description:
      "Why Breeders Blog exists, how to write and submit a post in Markdown, Quarto or R Markdown, and how voting, comments, linked posts and sharing work.",
    path: "/about",
  });

  return (
    <Page>
      {/* Manifesto Section */}
      <Section title="Breeders Blog Manifesto" as="h1">
        <p>
          For thousands of years, the written word has been the primary way
          humans have shared academic ideas. Today, we have something our
          predecessors could hardly have imagined: all of human knowledge at
          our fingertips.
        </p>
        <p className="font-semibold">That changes how we do science.</p>
        <p>
          Blogs, open-source projects, online communities, and interactive
          media let us share ideas faster, more openly, and in ways a printed
          page never could. An interactive plot lets you explore an idea
          yourself. An animation can make a complex process intuitive. Code
          can turn an equation into something you can experiment with.
        </p>
        <p>
          We no longer have to simply tell someone what we discovered. We can
          give them the tools to see it, question it, break it, and build upon
          it.
        </p>
        <p className="font-semibold">
          I believe plant breeding is uniquely positioned to benefit from this
          change.
        </p>
        <p>
          Agriculture faces enormous challenges, and meeting them will require
          more than refining the tools we already have. It will require new
          ideas, unexpected connections, and the willingness to share results
          before everything is perfectly polished.
        </p>
        <p>That is what I want Breeders Blog to be.</p>
        <p>
          A place for free thought, open discussion, and experimentation. A
          place to ask questions before they are ready for a journal, to
          explore ideas that might fail, and to build on ideas that might lead
          somewhere unexpected.
        </p>
        <p>
          A place where a plant breeder can learn from a computer scientist,
          where a quantitative geneticist can find inspiration in machine
          learning, and where someone just beginning their journey can
          contribute alongside someone who has spent decades in the field.
        </p>
        <p>
          Scientific progress has never belonged to a single discipline,
          institution, or generation. It has always come from regular people
          sharing ideas, challenging assumptions, and building something new
          from what came before.
        </p>
        <p>The tools to do that have never been more powerful.</p>
        <p>So let's use them.</p>
        <p className="font-semibold">Welcome to Breeders Blog.</p>
        <p className="font-semibold">Are you ready to change the world?</p>
      </Section>

      {/* How to Create a Post Section */}
      <Section title="How to Create a Post">
        <Subheading>The short version</Subheading>
        <ol className="list-decimal space-y-1 pl-6">
          <li>Pick the topic your post belongs in and open it.</li>
          <li>
            Click the create-post icon <InlineIcon name="add-post" /> (you'll
            need to be signed in).
          </li>
          <li>
            Enter a <strong>title</strong> (up to 100 characters), an{" "}
            <strong>abstract</strong> (up to about 600 words), and upload a
            single <strong>.md, .qmd, .Rmd, or .zip</strong> file under{" "}
            <strong>50 MB</strong>.
          </li>
          <li>
            Optionally, add a <strong>share image</strong>: the cover photo
            shown when your post's link is shared.
          </li>
          <li>
            Submit. A moderator renders and reviews it, and you'll get an
            email—usually within 24 hours—when it goes live.
          </li>
        </ol>

        <Subheading>Choosing a format</Subheading>
        <p>
          Every format is plain text you can write in any editor, and the
          moderator renders all of them with{" "}
          <ExternalLink href="https://quarto.org/">Quarto</ExternalLink>, so headings,
          tables, links, and LaTeX equations work everywhere. The difference
          is whether your post runs code.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <code>.md</code> (Markdown) — prose only. Best for essays, opinion
            pieces, reviews, and anything without code. Nothing to install.
          </li>
          <li>
            <code>.qmd</code> (Quarto) — Markdown plus runnable{" "}
            <strong>Python, R, or Julia</strong> chunks whose output (tables,
            static or interactive plots) is embedded in the post. Our
            recommendation for anything with analysis or simulation.
          </li>
          <li>
            <code>.Rmd</code> (R Markdown) — the classic R-only ancestor of{" "}
            <code>.qmd</code>. If you already write R Markdown, keep doing so;
            there's no need to switch.
          </li>
          <li>
            <code>.zip</code> — any of the above plus an <code>images/</code>{" "}
            or <code>data/</code> folder referenced by relative path. Use this
            whenever your post needs photos, pre-made figures, or a dataset.
          </li>
        </ul>

        <Subheading>Setting up your environment</Subheading>
        <p>
          For a <code>.md</code> post you need nothing beyond a text editor;
          skim{" "}
          <ExternalLink href="https://www.markdownguide.org/basic-syntax/">
            Markdown basic syntax
          </ExternalLink>{" "}
          or{" "}
          <ExternalLink href="https://quarto.org/docs/authoring/markdown-basics.html">
            Quarto's markdown basics
          </ExternalLink>{" "}
          and you're set. For <code>.qmd</code>, install Quarto by following{" "}
          <ExternalLink href="https://quarto.org/docs/get-started/">
            Get Started with Quarto
          </ExternalLink>
          —it has tabs for VS Code (with the Quarto extension), RStudio,
          Jupyter, and plain text editors—then pick your language:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>R</strong> — Quarto uses <code>knitr</code>, so an R
            install with <code>rmarkdown</code> and your plotting packages is
            all you need. See{" "}
            <ExternalLink href="https://quarto.org/docs/computations/r.html">
              Using R
            </ExternalLink>
            .
          </li>
          <li>
            <strong>Python</strong> — Quarto runs chunks through Jupyter:{" "}
            <code>pip install jupyter</code> (plus <code>pandas</code>,{" "}
            <code>plotly</code>, etc.) and set <code>jupyter: python3</code>{" "}
            in the YAML header. See{" "}
            <ExternalLink href="https://quarto.org/docs/computations/python.html">
              Using Python
            </ExternalLink>
            .
          </li>
          <li>
            <strong>Julia</strong> — install the <code>IJulia</code> package
            to register a Jupyter kernel, then reference it in the header. See{" "}
            <ExternalLink href="https://quarto.org/docs/computations/julia.html">
              Using Julia
            </ExternalLink>
            .
          </li>
          <li>
            <strong>.Rmd</strong> — RStudio with the <code>rmarkdown</code>{" "}
            package; the{" "}
            <ExternalLink href="https://bookdown.org/yihui/rmarkdown/">
              R Markdown book
            </ExternalLink>{" "}
            covers everything from the YAML header to chunk options.
          </li>
        </ul>
        <p>
          The full{" "}
          <ExternalLink href="https://quarto.org/docs/guide/">
            Quarto Guide
          </ExternalLink>{" "}
          is the reference for figures, cross-references, callouts, and
          citations. Whatever you write in, render it locally first (
          <code>quarto render my_post.qmd</code>, the Preview button in your
          editor, or Knit in RStudio) and read the HTML—if it looks right on
          your machine it will look right here.
        </p>

        <Subheading>Equations with LaTeX</Subheading>
        <p>
          Wrap LaTeX in single dollar signs for inline math and double dollar
          signs for a display equation on its own line. Both work in every
          format:
        </p>
        <pre className="overflow-x-auto rounded-md bg-canvas p-3 text-xs font-mono text-gray-800">
          {`Narrow-sense heritability is $h^2 = \\sigma_A^2 / \\sigma_P^2$.

$$
R = i \\, h^2 \\, \\sigma_P
$$`}
        </pre>
        <p>
          See{" "}
          <ExternalLink href="https://quarto.org/docs/authoring/markdown-basics.html#equations">
            Quarto's equation docs
          </ExternalLink>{" "}
          for numbering and cross-references, and{" "}
          <ExternalLink href="https://www.overleaf.com/learn/latex/Mathematical_expressions">
            Overleaf's math guide
          </ExternalLink>{" "}
          for the LaTeX syntax itself.
        </p>

        <Subheading>Templates to start from</Subheading>
        <p>
          Each template is an annotated skeleton: a commented YAML header,
          placeholder sections, an example equation, and one small runnable
          chunk. Download one, fill in the sections, delete the comments, and
          submit.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          {SAMPLE_FILES.map((sample) => (
            <li key={sample.filename}>
              <a
                href={sample.href}
                download={sample.filename}
                className="font-medium underline"
              >
                {sample.label}
              </a>{" "}
              — {sample.blurb}
            </li>
          ))}
        </ul>

        <Subheading>What makes a good post</Subheading>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Lead with the question.</strong> Say what problem you're
            looking at and why it matters in the first paragraph or two. Your
            abstract is what readers see on the topic page, so make it stand
            on its own.
          </li>
          <li>
            <strong>Use headings.</strong> <code>##</code> sections with{" "}
            <code>toc: true</code> in the header give your post a sidebar
            table of contents; two levels is plenty.
          </li>
          <li>
            <strong>Show runnable code.</strong> Prefer a code chunk over a
            pasted screenshot. Give chunks a <code>label</code> and figures a{" "}
            <code>fig-cap</code>, and leave <code>code-fold: true</code> on so
            readers can expand the code without it dominating the page.
          </li>
          <li>
            <strong>Make it self-contained.</strong> Keep{" "}
            <code>embed-resources: true</code> so plots and images are bundled
            into the HTML, and set a random seed in any simulation so others
            get the same result.
          </li>
          <li>
            <strong>Cite your sources.</strong> Link papers by DOI and end
            with a short "Further reading" list.
          </li>
          <li>
            <strong>Respect the reader's time.</strong> Aim for something
            readable in 5–15 minutes. If your work runs longer, consider
            splitting it into a series of shorter posts (say, background,
            methods, and results) and linking each part to the others so
            readers can follow the thread from any of them (see{" "}
            <strong>Linking posts</strong> below).
          </li>
        </ul>

        <Subheading>Adding a share image</Subheading>
        <p>
          When someone shares your post on LinkedIn, Facebook, X, or anywhere
          else that shows link previews, the preview card is built from your{" "}
          <strong>title</strong>, the start of your <strong>abstract</strong>,
          and your <strong>share image</strong>. The image is optional but
          makes a shared post far more eye-catching; without one, the preview
          uses a small Breeders Blog logo instead.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Format:</strong> a <code>.png</code>, <code>.jpg</code>,
            or <code>.webp</code> file up to <strong>5 MB</strong>, uploaded
            in the create-post form next to your post file. It's separate
            from your post, so it doesn't count toward the 50 MB limit.
          </li>
          <li>
            <strong>Shape:</strong> landscape, ideally{" "}
            <strong>1200×630</strong> pixels. Preview cards crop to roughly
            that shape, so keep anything important away from the edges.
          </li>
          <li>
            <strong>Content:</strong> your most striking figure, a field
            photo, or a diagram that sums up the post. Large text in the
            image is hard to read at preview size.
          </li>
        </ul>
        <p>
          Only the first 160 or so characters of your abstract fit in the
          card, so make its opening sentence count.
        </p>

        <Tip title="Tip: compressing images">
          <p className="text-sm">
            Photos straight off a phone or camera can easily be several MB
            each and add up fast against the 50 MB limit (or the 5 MB share
            image limit).{" "}
            <ExternalLink href="https://ffmpeg.org/download.html">ffmpeg</ExternalLink>{" "}
            is a free command-line tool that can shrink an image in seconds by
            resizing it and re-encoding it at a lower (but still perfectly
            readable) quality:
          </p>
          <pre className="mt-2 overflow-x-auto bg-canvas text-xs font-mono text-gray-800">
            ffmpeg -i input.jpg -vf scale=1600:-1 -q:v 3 output.jpg
          </pre>
        </Tip>

        <Subheading>What happens after you submit</Subheading>
        <p>
          Your post is marked <strong>pending</strong> and only you and the
          moderators can see it. A moderator renders your file, checks that it
          displays correctly, and approves it—or emails you with what needs
          fixing. Either way you'll hear back within about 24 hours. A
          moderator may also add or swap in a share image while approving.
          To keep things sane for the moderators, each user can submit up
          to <strong>5 posts every 24 hours</strong>.
        </p>
        <p>
          Once it's live, your post can be voted on, commented on, shared,
          and linked to related posts, covered in the next section.
        </p>
      </Section>

      {/* How to Interact with the Site Section */}
      <Section title="How to Interact with the Site">
        <p>
          Anyone can read every post. Voting, commenting, and pinning need
          you to be signed in; you'll be prompted to sign in when you try.
        </p>

        <Subheading>Voting</Subheading>
        <p>
          Every post and every comment has an upvote{" "}
          <InlineIcon name="upvote" className="text-accent" /> and a downvote{" "}
          <InlineIcon name="downvote" className="text-red-600" /> arrow with
          its score (upvotes minus downvotes) in between. Click an arrow to
          vote, and click it again to take your vote back. Votes decide where
          posts sit within a topic: posts are ranked by their score plus a
          bonus for comment activity, so the most useful and most discussed
          work rises to the top. They also shape the posts recommended to you
          on the home page.
        </p>

        <Subheading>Commenting</Subheading>
        <p>
          Open a post and scroll past it to the <strong>Comments</strong>{" "}
          section. Click the add-comment icon{" "}
          <InlineIcon name="add-comment" /> next to the heading to start a
          new thread, or the same icon on any comment to reply to it.
          Replies nest underneath the comment they answer, and the arrow{" "}
          <InlineIcon name="chevron" size="h-4 w-4" /> beside a comment
          hides or shows its replies. Moderators can lock comments on a
          post and remove comments that break the one rule below.
        </p>

        <Subheading>Pinning</Subheading>
        <p>
          The pin icon <InlineIcon name="pin" /> on a post saves it for
          later. Pinned posts appear in <strong>Your Pinned Posts</strong> on
          the home page and always sort to the top of their topic for you.
          Pins are just for you; they don't change how anyone else sees
          the post.
        </p>

        <Subheading>Linking posts</Subheading>
        <p>
          Linked posts connect related work: a follow-up to an earlier
          analysis, a method applied in another post, or the background a
          reader should see next. They appear in a{" "}
          <strong>Linked Posts</strong> carousel between the end of a post
          and its comments.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Who can link:</strong> a post's author and the
            moderators. On your own published post you'll see the link icon{" "}
            <InlineIcon name="link" /> on its tile in the topic list.
          </li>
          <li>
            <strong>How:</strong> click the link icon, search for the post you
            want by title, and click it to add it. The same window lists
            everything already linked, with a delete button to remove a link.
            Changes take effect immediately.
          </li>
          <li>
            <strong>One direction:</strong> linking your post to another
            shows that post under yours only. It doesn't add yours to theirs.
            Only published posts can be linked.
          </li>
        </ul>

        <Subheading>Sharing</Subheading>
        <p>
          Every published post has a share icon <InlineIcon name="share" />{" "}
          in its header, on the right across from the Back arrow. Clicking
          it opens a share window that shows a preview of exactly how the
          link will look when shared: the post's share image (or the
          Breeders Blog logo if it has none), the site address, the title,
          and the start of the abstract. Below the preview are the ways to
          share:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <InlineIcon name="copy-link" /> <strong>Copy link</strong>: copies
            the post's address to paste anywhere.
          </li>
          <li>
            <InlineIcon name="facebook" /> <strong>Facebook</strong>,{" "}
            <InlineIcon name="reddit" /> <strong>Reddit</strong>, and, under{" "}
            <InlineIcon name="more" /> <strong>More</strong>,{" "}
            <InlineIcon name="x-logo" /> <strong>X</strong> and{" "}
            <InlineIcon name="linkedin" /> <strong>LinkedIn</strong>: open
            that site's share window in a popup with the link already filled
            in. You still press that site's own Post or Share button, so
            nothing is posted on your behalf.
          </li>
          <li>
            <InlineIcon name="email" /> <strong>Email</strong>: opens your
            email app with the title as the subject and the link in the
            body.
          </li>
        </ul>
      </Section>

      {/* Rules of Contribution Section */}
      <Section title="Rules of Contribution">
        <p>
          Breeders Blog welcomes posts, comments, and ideas from anyone — the
          only rule is <strong>be kind!</strong>
        </p>
      </Section>
    </Page>
  );
}

export default About;
