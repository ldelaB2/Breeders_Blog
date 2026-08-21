import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 text-center py-6 px-4 mt-10">
      <p className="text-base mb-2">
        Thanks for visiting — remember the only people that change the world are
        the ones crazy enough to think they can
      </p>
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Breeders Blog. All rights reserved.
      </p>
      <p className="text-xs mt-1">
        Cite this site: breedersblog.com ({new Date().getFullYear()}).{" "}
        <em>Breeders Blog</em>. Retrieved from https://yoursite.com
      </p>
    </footer>
  );
}

export default Footer;
