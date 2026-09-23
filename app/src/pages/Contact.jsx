// src/pages/Contact.jsx
import { useSeo } from "../lib/useSeo";

// Fill these in with your real profile URLs. Anything left as "#" still
// renders, it just doesn't go anywhere yet.
const LINKS = {
  linkedin: "https://www.linkedin.com/in/will-de-la-bretonne-8a95a1218/", // e.g. https://www.linkedin.com/in/your-handle
  github: "https://github.com/ldelaB2", // e.g. https://github.com/your-handle
  youtube: "https://www.youtube.com/@SquidBillyWilly", // e.g. https://www.youtube.com/@your-handle
};

const EMAIL = "ldelab2@outlook.com";

// Drop the headshot at app/public/headshot.jpg (Vite serves /public at the
// site root, same as the logo in Header.jsx). Square-ish crop looks best.
const HEADSHOT = "/headshot.jpg";

// External links open in a new tab, matching the posting guide on About.
function ExtLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {children}
    </a>
  );
}

function Contact() {
  useSeo({
    title: "Contact",
    description:
      "About Will de la Bretonne — plant breeding, data science, and how to get in touch with Breeders Blog.",
    path: "/contact",
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold">Contact</h1>

      <div className="mt-4 text-gray-700 space-y-4">
        <p>
          Hi, I'm Will de la Bretonne. I'm just a guy passionate about science,
          plants, and learning new things.
        </p>

        {/* Headshot: floats beside the text on desktop, full width on mobile. */}
        <img
          src={HEADSHOT}
          alt="Will de la Bretonne"
          className="mx-auto w-48 rounded-lg object-cover sm:float-right sm:ml-6 sm:mb-4 sm:w-56"
        />

        <p>
          I have a B.S. in Chemistry from Louisiana State University and an M.S.
          in Plant Breeding and Plant Genetics from the University of
          Wisconsin–Madison.
        </p>
        <p>
          My work sits at the intersection of plant breeding, data science, and
          agriculture. I've spent much of my career working directly with
          crops—spending summers as a consulting crop scout in sugarcane and
          working as a research assistant with applied breeding programs in
          rice, corn, beet, and potato. During graduate school, I shifted toward
          the data science side of plant breeding, developing algorithms for
          processing drone imagery.
        </p>
        <p>
          Along the way, I had the opportunity to intern with Syngenta, where I
          worked on machine learning and genomic selection pipelines. Today, I
          work at PepsiCo as a Breeding Data Curator, supporting data management
          and breeding research across the Frito-Lay and Quaker Oats breeding
          programs.
        </p>
        <p>
          For my most up-to-date CV and résumé, visit my{" "}
          <ExtLink href={LINKS.linkedin}>LinkedIn profile</ExtLink>. You can
          also find my projects on <ExtLink href={LINKS.github}>GitHub</ExtLink>{" "}
          and videos on <ExtLink href={LINKS.youtube}>YouTube</ExtLink>.
        </p>
        <p className="clear-both">
          If you have a question, a suggestion for the site, or just want to
          connect, feel free to reach out at{" "}
          <a href={`mailto:${EMAIL}`} className="underline">
            {EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default Contact;
