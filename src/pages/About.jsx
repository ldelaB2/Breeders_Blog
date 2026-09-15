// src/pages/About.jsx
import { useState } from "react";
import Icon from "../components/Icon";
import chevronIcon from "../assets/chevron.svg?raw";

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
            For thousands of years, the primary way humans have exchanged
            academic ideas has been through the written word. From the Greeks,
            to the great mathematicians of the Islamic Golden Age, through the
            Renaissance and the scientific revolutions that followed,
            generations of thinkers have built upon one another through books,
            letters, and eventually the modern scientific paper. The paper has
            served us remarkably well. But for the first time in centuries, the
            way we share knowledge is changing.
          </p>
          <p>
            Today, we are blessed with something our predecessors could scarcely
            have imagined:{" "}
            <strong>the entirety of human knowledge at our fingertips</strong>,
            accessible instantly to anyone with an internet connection. At the
            same time, the pace at which new knowledge is being created has
            accelerated dramatically. Nowhere is this more apparent than in the
            recent explosion of artificial intelligence, where ideas, methods,
            and technologies can advance faster than the traditional publishing
            process can keep up.
          </p>
          <p>
            This changing landscape has given rise to new forms of scientific
            communication. Blogs, online communities, open-source projects,
            preprints, and interactive media allow researchers to share ideas
            rapidly, openly, and at a scale that simply was not possible before.
            More importantly, the internet allows us to communicate ideas in
            ways that a printed page never could. Interactive plots can let a
            reader explore a concept for themselves. Animations can make complex
            processes intuitive. Code can turn an equation into something you
            can experiment with. Instead of simply telling someone what you
            discovered, we can give them the tools to see it, play with it,
            question it, and build upon it.
          </p>
          <p>
            I believe{" "}
            <strong>
              plant breeding is uniquely positioned to benefit from this change
            </strong>
            . Plant breeding has always been a wonderfully messy,
            multidisciplinary science. It draws on genetics, statistics,
            biology, agriculture, computer science, and engineering, bringing
            together ideas from fields that might otherwise have little reason
            to interact. Perhaps that is what makes plant breeding so exciting:
            some of its greatest advances happen not within these disciplines
            individually, but in the connections between them.
          </p>
          <p>
            Breeders Blog exists to explore those spaces. The goal of this site
            is to create a place for{" "}
            <strong>
              free thought, open discussion, experimentation, and rapid sharing
              of ideas
            </strong>{" "}
            in plant breeding and quantitative genetics. It is a place to ask
            questions that may not yet be ready for a journal. To explore ideas
            that might fail. To explain concepts that deserve a better
            explanation. To build interactive demonstrations that make difficult
            ideas intuitive. And, most importantly, to connect ideas from
            different fields and see what happens when we put them together.
          </p>
          <p>
            Agriculture faces enormous challenges, and keeping pace with them
            will require more than simply improving the tools we already have.
            It will require new ways of thinking, new connections between
            disciplines, and a willingness to experiment with ideas before they
            are perfectly polished. It will require us to look beyond the
            boundaries of our own fields and learn from one another.
          </p>
          <p>
            I want Breeders Blog to be a place where a plant breeder can learn
            something from a computer scientist, where a quantitative geneticist
            can discover a new application for an idea from machine learning,
            where an agronomist can challenge an assumption made by a
            statistician, and where{" "}
            <strong>
              someone just beginning their journey can participate in the
              conversation alongside someone who has spent decades in the field
            </strong>
            .
          </p>
          <p>
            Because the challenges facing agriculture are too important, and the
            tools available to us are too powerful, to keep thinking in the same
            boxes we always have.
          </p>
          <p>
            Scientific progress has never belonged to a single discipline,
            institution, or generation. It has always been built by people
            sharing ideas, challenging one another, and building something new
            from what came before. The tools for doing that have never been more
            powerful. So let's use them.
          </p>
          <p className="font-semibold">
            Welcome to Breeders Blog. Are you ready to change the world?
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

      {/* Rules of Contribution Section */}
      <Section
        title="Rules of Contribution"
        as="h2"
        open={open.rules}
        onToggle={() => toggle("rules")}
      >
        <div className="mt-4 text-gray-700 space-y-4">
          <p>
            {/* TODO: Replace with your own guidelines */}
            Breeders Blog welcomes posts, comments, and ideas from anyone —
            students, researchers, and practitioners alike. Contributions should
            be honest about uncertainty, open to critique, and focused on
            advancing shared understanding rather than promoting any single
            person or product.
          </p>
        </div>
      </Section>
    </div>
  );
}

export default About;
