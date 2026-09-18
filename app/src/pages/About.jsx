// src/pages/About.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { useSeo } from "../lib/useSeo";
import chevronIcon from "../assets/chevron.svg?raw";
import addPostIcon from "../assets/add_post.svg?raw";
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

// External links in the posting guide all open in a new tab.
function ExtLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  );
}

// Header + chevron toggle shared by each section below. The body stays in
// the DOM while collapsed (hidden, not unmounted) so crawlers can read it.
function Section({ title, as: Tag, open, onToggle, children }) {
  return (
    <div className={Tag === "h1" ? "" : "mt-10"}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <Icon
          svg={chevronIcon}
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
        <Tag className="text-xl font-bold">{title}</Tag>
      </button>
      <div hidden={!open}>{children}</div>
    </div>
  );
}

function About() {
  const [open, setOpen] = useState({
    manifesto: false,
    plantBreeding: false,
    howToPost: false,
    rules: false,
  });
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  useSeo({
    title: "About",
    description:
      "Why Breeders Blog exists, what plant breeding is, and how to write and submit a post in Markdown, Quarto or R Markdown.",
    path: "/about",
  });

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      {/* Manifesto Section */}
      <Section
        title="Breeders Blog Manifesto"
        as="h1"
        open={open.manifesto}
        onToggle={() => toggle("manifesto")}
      >
        <div className="mt-4 text-gray-700 space-y-4">
          <p>
            Blogs, open-source projects, preprints, online communities, and
            interactive media let us share ideas faster, more openly, and in
            ways a printed page never could. An interactive plot can let you
            explore an idea yourself. An animation can make a complex process
            intuitive. Code can turn an equation into something you can
            experiment with. We no longer have to simply tell people what we
            discovered. We can give them the tools to see it, question it,
            and build upon it.
          </p>
          <p className="font-semibold">
            I believe plant breeding is uniquely positioned to benefit from
            this change.
          </p>
          <p>
            Breeders Blog is a place for{" "}
            <strong>
              free thought, open discussion, experimentation, and rapid
              sharing of ideas
            </strong>{" "}
            in plant breeding and quantitative genetics. Because the
            challenges facing agriculture are enormous, we need more than
            better tools—we need new ways of thinking, new connections
            between disciplines, and the freedom to experiment before an idea
            is perfectly polished.
          </p>
          <p>
            I want Breeders Blog to be a place where a plant breeder learns
            from a computer scientist, a quantitative geneticist finds new
            applications for machine learning, an agronomist challenges a
            statistician, and{" "}
            <strong>
              someone just beginning their journey can contribute alongside
              someone who has spent decades in the field
            </strong>
            .
          </p>
          <p>
            Scientific progress has never belonged to a single discipline,
            institution, or generation. It has always come from people
            sharing ideas, challenging one another, and building something
            new from what came before.
          </p>
          <p className="font-semibold">
            The tools for doing that have never been more powerful.
          </p>
          <p className="font-semibold">So let's use them.</p>
          <p>Welcome to Breeders Blog.</p>
          <p className="font-semibold">
            Are you ready to change the world?
          </p>
        </div>
      </Section>

      {/* What is Plant Breeding Section */}
      <Section
        title="What is Plant Breeding?"
        as="h2"
        open={open.plantBreeding}
        onToggle={() => toggle("plantBreeding")}
      >
        <div className="mt-4 text-gray-700 space-y-4">
          <p>
            <strong>
              Plant breeding is the science and art of making better crops
            </strong>
            —higher yield, better disease resistance, improved nutrition, or
            the ability to handle heat, drought, and other stresses.
          </p>
          <p>
            The classic recipe is simple: cross two plants with traits you
            like, grow their offspring, keep the few that combine the best of
            both, and repeat—often for <strong>7–10 years</strong> before a
            new variety is ready. Every cross produces thousands of unique
            plants, so breeding is really a giant search problem: build a
            haystack, then spend years looking for the needle.
          </p>
          <p>
            What's changing is how we search. Cheap{" "}
            <strong>DNA sequencing</strong> lets us predict how a plant will
            perform before it's ever grown; drones, cameras, and sensors
            measure whole fields in minutes; <strong>machine learning</strong>{" "}
            finds patterns in the resulting mountains of data; and gene
            editing tools like <strong>CRISPR</strong> let us create traits
            rather than only hunt for them. Along the way the field borrows
            freely from statistics, computer science, engineering, and
            molecular biology—which is exactly what makes it so much fun.
          </p>
          <p>
            All of it serves one simple question:{" "}
            <span className="font-semibold">How do we make a better plant?</span>{" "}
            The question is simple. The answer is anything but.
          </p>
          <p>
            Want the long version—from the first domesticated grasses to
            genomic selection? Head over to the{" "}
            <Link to="/topics/history" className="underline">
              History of Breeding
            </Link>{" "}
            topic.
          </p>
        </div>
      </Section>

      {/* How to Create a Post Section */}
      <Section
        title="How to Create a Post"
        as="h2"
        open={open.howToPost}
        onToggle={() => toggle("howToPost")}
      >
        <div className="mt-4 text-gray-700 space-y-4">
          <h3 className="font-semibold text-gray-900">The short version</h3>
          <ol className="list-decimal space-y-1 pl-6">
            <li>Pick the topic your post belongs in and open it.</li>
            <li>
              Click the create-post icon{" "}
              <Icon
                svg={addPostIcon}
                className="h-5 w-5 inline-block align-text-bottom"
              />{" "}
              (you'll need to be signed in).
            </li>
            <li>
              Enter a <strong>title</strong> (up to 100 characters), an{" "}
              <strong>abstract</strong> (up to about 600 words), and upload a
              single <strong>.md, .qmd, .Rmd, or .zip</strong> file under{" "}
              <strong>50 MB</strong>.
            </li>
            <li>
              Submit. A moderator renders and reviews it, and you'll get an
              email—usually within 24 hours—when it goes live.
            </li>
          </ol>

          <h3 className="font-semibold text-gray-900">Choosing a format</h3>
          <p>
            Every format is plain text you can write in any editor, and the
            moderator renders all of them with{" "}
            <ExtLink href="https://quarto.org/">Quarto</ExtLink>, so
            headings, tables, links, and LaTeX equations work everywhere.
            The difference is whether your post runs code.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <code>.md</code> (Markdown) — prose only. Best for essays,
              opinion pieces, reviews, and anything without code. Nothing to
              install.
            </li>
            <li>
              <code>.qmd</code> (Quarto) — Markdown plus runnable{" "}
              <strong>Python, R, or Julia</strong> chunks whose output
              (tables, static or interactive plots) is embedded in the post.
              Our recommendation for anything with analysis or simulation.
            </li>
            <li>
              <code>.Rmd</code> (R Markdown) — the classic R-only ancestor
              of <code>.qmd</code>. If you already write R Markdown, keep
              doing so; there's no need to switch.
            </li>
            <li>
              <code>.zip</code> — any of the above plus an{" "}
              <code>images/</code> or <code>data/</code> folder referenced by
              relative path. Use this whenever your post needs photos,
              pre-made figures, or a dataset.
            </li>
          </ul>

          <h3 className="font-semibold text-gray-900">
            Setting up your environment
          </h3>
          <p>
            For a <code>.md</code> post you need nothing beyond a text
            editor; skim{" "}
            <ExtLink href="https://www.markdownguide.org/basic-syntax/">
              Markdown basic syntax
            </ExtLink>{" "}
            or{" "}
            <ExtLink href="https://quarto.org/docs/authoring/markdown-basics.html">
              Quarto's markdown basics
            </ExtLink>{" "}
            and you're set. For <code>.qmd</code>, install Quarto by
            following{" "}
            <ExtLink href="https://quarto.org/docs/get-started/">
              Get Started with Quarto
            </ExtLink>
            —it has tabs for VS Code (with the Quarto extension), RStudio,
            Jupyter, and plain text editors—then pick your language:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>R</strong> — Quarto uses <code>knitr</code>, so an R
              install with <code>rmarkdown</code> and your plotting packages
              is all you need. See{" "}
              <ExtLink href="https://quarto.org/docs/computations/r.html">
                Using R
              </ExtLink>
              .
            </li>
            <li>
              <strong>Python</strong> — Quarto runs chunks through Jupyter:{" "}
              <code>pip install jupyter</code> (plus <code>pandas</code>,{" "}
              <code>plotly</code>, etc.) and set <code>jupyter: python3</code>{" "}
              in the YAML header. See{" "}
              <ExtLink href="https://quarto.org/docs/computations/python.html">
                Using Python
              </ExtLink>
              .
            </li>
            <li>
              <strong>Julia</strong> — install the <code>IJulia</code> package
              to register a Jupyter kernel, then reference it in the header.
              See{" "}
              <ExtLink href="https://quarto.org/docs/computations/julia.html">
                Using Julia
              </ExtLink>
              .
            </li>
            <li>
              <strong>.Rmd</strong> — RStudio with the{" "}
              <code>rmarkdown</code> package; the{" "}
              <ExtLink href="https://bookdown.org/yihui/rmarkdown/">
                R Markdown book
              </ExtLink>{" "}
              covers everything from the YAML header to chunk options.
            </li>
          </ul>
          <p>
            The full{" "}
            <ExtLink href="https://quarto.org/docs/guide/">Quarto Guide</ExtLink>{" "}
            is the reference for figures, cross-references, callouts, and
            citations. Whatever you write in, render it locally first
            (<code>quarto render my_post.qmd</code>, the Preview button in
            your editor, or Knit in RStudio) and read the HTML—if it looks
            right on your machine it will look right here.
          </p>

          <h3 className="font-semibold text-gray-900">Equations with LaTeX</h3>
          <p>
            Wrap LaTeX in single dollar signs for inline math and double
            dollar signs for a display equation on its own line. Both work
            in every format:
          </p>
          <pre className="overflow-x-auto rounded-md bg-canvas p-3 text-xs font-mono text-gray-800">
{`Narrow-sense heritability is $h^2 = \\sigma_A^2 / \\sigma_P^2$.

$$
R = i \\, h^2 \\, \\sigma_P
$$`}
          </pre>
          <p>
            See{" "}
            <ExtLink href="https://quarto.org/docs/authoring/markdown-basics.html#equations">
              Quarto's equation docs
            </ExtLink>{" "}
            for numbering and cross-references, and{" "}
            <ExtLink href="https://www.overleaf.com/learn/latex/Mathematical_expressions">
              Overleaf's math guide
            </ExtLink>{" "}
            for the LaTeX syntax itself.
          </p>

          <h3 className="font-semibold text-gray-900">Templates to start from</h3>
          <p>
            Each template is an annotated skeleton: a commented YAML header,
            placeholder sections, an example equation, and one small runnable
            chunk. Download one, fill in the sections, delete the comments,
            and submit.
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

          <h3 className="font-semibold text-gray-900">
            What makes a good post
          </h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Lead with the question.</strong> Say what problem you're
              looking at and why it matters in the first paragraph or two.
              Your abstract is what readers see on the topic page, so make it
              stand on its own.
            </li>
            <li>
              <strong>Use headings.</strong> <code>##</code> sections with{" "}
              <code>toc: true</code> in the header give your post a sidebar
              table of contents; two levels is plenty.
            </li>
            <li>
              <strong>Show runnable code.</strong> Prefer a code chunk over a
              pasted screenshot. Give chunks a <code>label</code> and figures
              a <code>fig-cap</code>, and leave <code>code-fold: true</code>{" "}
              on so readers can expand the code without it dominating the
              page.
            </li>
            <li>
              <strong>Make it self-contained.</strong> Keep{" "}
              <code>embed-resources: true</code> so plots and images are
              bundled into the HTML, and set a random seed in any simulation
              so others get the same result.
            </li>
            <li>
              <strong>Cite your sources.</strong> Link papers by DOI and end
              with a short "Further reading" list.
            </li>
            <li>
              <strong>Respect the reader's time.</strong> Aim for something
              readable in 5–15 minutes. Long posts are welcome—just split them
              into sections.
            </li>
          </ul>

          <div className="rounded-md bg-canvas p-3">
            <h4 className="mb-1 font-semibold text-gray-900">
              Tip: compressing images
            </h4>
            <p className="text-sm">
              Photos straight off a phone or camera can easily be several MB
              each and add up fast against the 50 MB limit.{" "}
              <ExtLink href="https://ffmpeg.org/download.html">ffmpeg</ExtLink>{" "}
              is a free command-line tool that can shrink an image in
              seconds by resizing it and re-encoding it at a lower (but
              still perfectly readable) quality:
            </p>
            <pre className="mt-2 overflow-x-auto bg-canvas text-xs font-mono text-gray-800">
              ffmpeg -i input.jpg -vf scale=1600:-1 -q:v 3 output.jpg
            </pre>
          </div>

          <h3 className="font-semibold text-gray-900">
            What happens after you submit
          </h3>
          <p>
            Your post is marked <strong>pending</strong> and only you and the
            moderators can see it. A moderator renders your file, checks
            that it displays correctly, and approves it—or emails you with
            what needs fixing. Either way you'll hear back within about 24
            hours. To keep things sane for the moderators, each user can
            submit up to <strong>5 posts every 24 hours</strong>.
          </p>
        </div>
      </Section>

      {/* Rules of Contribution Section */}
      <Section
        title="Rules of Contribution"
        as="h2"
        open={open.rules}
        onToggle={() => toggle("rules")}
      >
        <div className="mt-4 text-gray-700 space-y-4">
          <p>
            Breeders Blog welcomes posts, comments, and ideas from anyone —
            the only rule is <strong>be kind!</strong>
          </p>
        </div>
      </Section>
    </div>
  );
}

export default About;
