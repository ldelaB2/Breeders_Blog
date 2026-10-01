import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { useTestApp } from "./setup/harness.js";
import { createPost, createUser } from "./setup/factories.js";

const ctx = useTestApp();

test("the sitemap lists the static pages and every approved post", async () => {
  const author = await createUser();
  const post = await createPost({ author, id: "p1", title: "Hello World" });
  await createPost({ author, id: "hidden", status: "PENDING" });

  const res = await request(ctx.app).get("/sitemap.xml");
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /^application\/xml/);
  const xml = res.text;

  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><urlset'));
  for (const path of ["/", "/about", "/contact", "/topics/gs", "/topics/archive"]) {
    assert.ok(xml.includes(`<loc>http://site.test${path}</loc>`), path);
  }
  assert.ok(
    xml.includes(`<url><loc>http://site.test/posts/p1/hello-world</loc><lastmod>${post.updatedAt.toISOString()}</lastmod></url>`),
  );
  assert.ok(!xml.includes("hidden"));
});
