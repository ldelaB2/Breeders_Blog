// src/pages/Contact.jsx
import { useSeo } from "../lib/useSeo";

function Contact() {
  useSeo({ title: "Contact", description: "Get in touch with Breeders Blog.", path: "/contact" });
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold">Contact</h1>
      <p className="mt-4 text-gray-700">
        This is where you write about yourself or the blog.
      </p>
    </div>
  );
}

export default Contact;
