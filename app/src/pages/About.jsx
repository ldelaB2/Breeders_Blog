// src/pages/About.jsx
import { useState } from "react";
import Icon from "../components/Icon";
import chevronIcon from "../assets/chevron.svg?raw";
import addPostIcon from "../assets/add_post.svg?raw";
import sampleMarkdown from "../../sample_post/example_markdown.md?url";
import samplePythonQmd from "../../sample_post/example_python.qmd?url";
import sampleRQmd from "../../sample_post/example_r.qmd?url";
import sampleJuliaQmd from "../../sample_post/example_julia.qmd?url";

// Downloadable starting points shown in "How to Create a Post" - one plain
// .md example plus a .qmd example per language Quarto commonly runs code
// chunks in (Python, R, Julia), so a new author can see the format before
// writing their own.
const SAMPLE_FILES = [
  { label: ".md example", filename: "example_markdown.md", href: sampleMarkdown },
  { label: ".qmd example (Python)", filename: "example_python.qmd", href: samplePythonQmd },
  { label: ".qmd example (R)", filename: "example_r.qmd", href: sampleRQmd },
  { label: ".qmd example (Julia)", filename: "example_julia.qmd", href: sampleJuliaQmd },
];

// Header + chevron toggle shared by each section below; body is only
// rendered while open.
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
      {open && children}
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
            Perhaps the easiest way to understand plant breeding is to start
            with what we're trying to accomplish. At its simplest,{" "}
            <strong>
              plant breeding is the science and art of making better crops
            </strong>
            . Maybe that means higher yield, better disease resistance, improved
            nutrition, or the ability to handle heat, drought, or other
            environmental stresses.
          </p>
          <p className="font-semibold">
            So how do you actually make a better plant?
          </p>
          <p>
            Traditionally, it starts pretty simply. A breeder finds two plants
            with traits they like and crosses them together. Their offspring
            each get a different mix of characteristics from their parents, so
            even though they all came from the same cross, no two plants are
            quite the same. A breeder might end up with thousands—or even
            hundreds of thousands—of plants to sort through, looking for the few
            that have the right combination of traits. Those plants are then
            grown, tested, and selected again and again, often over{" "}
            <strong>7–10 years</strong>.
          </p>
          <p>
            In a lot of ways, plant breeding is a giant search problem. You make
            a huge haystack and then spend years looking for the needle.
          </p>
          <p className="font-semibold">
            But what if we could make the haystack smaller?
          </p>
          <p>
            That's where some of the really exciting changes in plant breeding
            are happening. With modern <strong>DNA sequencing</strong>, we can
            look at a plant's genes and use that information to help predict
            what the plant might be like before we've spent years growing and
            testing it. By combining this genetic information with what we know
            about how plants actually perform, breeders can make much better
            guesses about which plants are worth keeping.
          </p>
          <p>Of course, this creates a whole new problem: data. Lots of it.</p>
          <p>
            And that's where plant breeding starts borrowing ideas from all over
            the place. The statistics used to connect a plant's DNA to its
            traits aren't really "plant breeding math." The same kinds of ideas
            can be used to study everything from plants to people. More
            recently,{" "}
            <strong>machine learning and artificial intelligence</strong> are
            giving us even more ways to find patterns in these enormous
            datasets.
          </p>
          <p>
            At the same time, we're getting much better at collecting the data
            in the first place. Drones, cameras, satellites, and other sensors
            can measure thousands of plants in a fraction of the time it would
            take a person to walk through a field and do it by hand.
          </p>
          <p>And then there is gene editing.</p>
          <p>
            For most of plant breeding's history, if we wanted a particular
            trait, we had to find a plant that already had it and figure out how
            to bring that trait into our crop. Technologies like{" "}
            <strong>CRISPR</strong> are starting to change that. Instead of only
            searching for the plant we want, we can increasingly make precise
            changes to a plant's DNA and help create the traits we're looking
            for.
          </p>
          <p>And honestly, this is just scratching the surface.</p>
          <p>
            Plant breeding brings together genetics, biology, statistics,
            agriculture, mathematics, computer science, engineering, machine
            learning, remote sensing, and molecular biology. It is a field that
            has always borrowed ideas from somewhere else—and that is exactly
            what makes it so much fun.
          </p>
          <p>
            At the end of the day, all of these tools are helping us tackle the
            same simple question:
          </p>
          <p className="font-semibold text-lg">
            How do we make a better plant?
          </p>
          <p>The question is simple. The answer is anything but.</p>
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
          <p>
            To start a post, click the create-post icon{" "}
            <Icon
              svg={addPostIcon}
              className="h-5 w-5 inline-block align-text-bottom"
            />{" "}
            on any topic you'd like to write about. You'll be asked for a{" "}
            <strong>title</strong>, a brief <strong>abstract</strong> (around
            600 words), and a single{" "}
            <strong>.md, .qmd, or .zip file</strong> containing your post.
          </p>
          <p>
            A <code>.md</code> (Markdown) file is just plain text with a few
            simple symbols for formatting—things like headings, bold text,
            and links. A <code>.qmd</code> (Quarto) file is the same idea, but
            can also include runnable code and its output. Both can be
            written in any text editor. If you're new to Markdown or Quarto,{" "}
            <a
              href="https://quarto.org/docs/authoring/markdown-basics.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Quarto's markdown basics guide
            </a>{" "}
            is a great place to see the syntax in action.
          </p>
          <div>
            <p className="mb-2">
              Not sure where to start? Download an example and use it as a
              template:
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_FILES.map((sample) => (
                <a
                  key={sample.filename}
                  href={sample.href}
                  download={sample.filename}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {sample.label}
                </a>
              ))}
            </div>
          </div>
          <p>
            If your post needs images, charts, or a dataset, bundle
            everything into a single <code>.zip</code> instead—your{" "}
            <code>.md</code>/<code>.qmd</code> file plus an{" "}
            <code>images/</code> folder (or whatever you'd like to call it)
            referenced by relative path. The moderator pulls those files in
            when stitching together your final page. Whichever file type you
            upload, it must be under <strong>50 MB</strong>.
          </p>
          <p className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm">
            <strong>Tip:</strong> photos straight off a phone or camera can
            easily be several MB each and add up fast against that 50 MB
            limit.{" "}
            <a
              href="https://ffmpeg.org/download.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ffmpeg
            </a>{" "}
            is a free command-line tool that can shrink an image in seconds
            by resizing it and re-encoding it at a lower (but still
            perfectly readable) quality:
          </p>
          <pre className="overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-800">
            ffmpeg -i input.jpg -vf scale=1600:-1 -q:v 3 output.jpg
          </pre>
          <p>
            Once submitted, your post is marked <strong>pending</strong> and a
            moderator is notified to review it and stitch together the final
            page. You'll typically get an email within about 24 hours letting
            you know whether it was approved or, if not, why—after approval,
            your post goes live for the whole community to see.
          </p>
          <p>
            To keep things sane for our moderators, each user can submit up
            to <strong>5 posts every 24 hours</strong>.
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
