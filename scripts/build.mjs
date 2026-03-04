import fs from "fs";
import path from "path";

const REGISTRY_CONFIG = {
  "chat": {
    name: "chat-ui",
    targetPath: "cascaide-ui/chat",
    dependencies: [
      "@cascaide-ts/react",
      "lucide-react",
      "uuid",
      "clsx",
      "tailwind-merge",
      "react-markdown",
      "remark-gfm",
      "rehype-highlight",
      "remark-math",
      "rehype-katex",
      "recharts"
    ],
    devDependencies: ["@types/uuid"],
    registryDependencies: [
      "button",
      "scroll-area",
      "badge",
      "separator",
      "avatar",
      "card"
    ],
    tailwind: {
      config: {
        theme: {
          extend: {
            colors: {
              "sidebar-bg": "#030712",
            }
          }
        }
      }
    }
  }
};

const OUTPUT_DIR = "./registry";

function getFiles(dir, baseDir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, baseDir));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push({
          innerPath: path.relative(baseDir, filePath),
          content: fs.readFileSync(filePath, "utf8"),
        });
      }
    }
  });
  return results;
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

Object.entries(REGISTRY_CONFIG).forEach(([dirName, config]) => {
  const sourcePath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Source directory not found, skipping: ${sourcePath}`);
    return;
  }

  const rawFiles = getFiles(sourcePath, sourcePath);

  const registryEntry = {
    name: config.name,
    type: "registry:block",
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    registryDependencies: config.registryDependencies,
    files: rawFiles.map(file => {
      // Normalize to forward slashes on all platforms
      const resolvedPath = path
        .join(config.targetPath, file.innerPath)
        .replace(/\\/g, '/');

      return {
        path: resolvedPath,
        content: file.content,
        type: "registry:component",
        // KEY FIX: target forces shadcn to place the file at this exact path,
        // bypassing all internal path resolution heuristics
        target: resolvedPath,
      };
    }),
    tailwind: config.tailwind,
  };

  const outputFile = path.join(OUTPUT_DIR, `${dirName}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(registryEntry, null, 2));

  console.log(`✅ Registry built: ${outputFile}`);
  console.log(`   Files included (${registryEntry.files.length}):`);
  registryEntry.files.forEach(f => console.log(`     → ${f.target}`));
});