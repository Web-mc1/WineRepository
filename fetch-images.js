// Downloads every image listed in images.json into /images
// and writes images/credits.json for attribution.
const fs = require("fs");
const path = require("path");

const list = JSON.parse(fs.readFileSync("images.json", "utf8"));
const outDir = "images";
fs.mkdirSync(outDir, { recursive: true });

const extFor = (type, url) => {
  if (type.includes("jpeg")) return ".jpg";
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("svg")) return ".svg";
  return path.extname(new URL(url).pathname) || ".jpg";
};

(async () => {
  const credits = {};
  for (const item of list) {
    try {
      const res = await fetch(item.url, {
        headers: { "User-Agent": "image-fetcher-action/1.0 (GitHub Actions)" },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const type = res.headers.get("content-type") || "";
      if (!type.startsWith("image/")) throw new Error("Not an image: " + type);
      const file = item.name + extFor(type, item.url);
      fs.writeFileSync(path.join(outDir, file), Buffer.from(await res.arrayBuffer()));
      credits[file] = item.credit || "";
      console.log("saved", file);
    } catch (e) {
      console.error("FAILED", item.name, e.message);
      process.exitCode = 1;
    }
  }
  fs.writeFileSync(path.join(outDir, "credits.json"), JSON.stringify(credits, null, 2));
})();
