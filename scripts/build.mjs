import fs from "fs";
import path from "path";

const REGISTRY_CONFIG = {
  "chat": {
    name: "chat-ui",
    // This defines the exact folder structure inside the project's 'components' dir
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
      // Only capture valid code files
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
  if (!fs.existsSync(sourcePath)) return;

  const rawFiles = getFiles(sourcePath, sourcePath);

  const registryEntry = {
    name: config.name,
    // Using registry:block tells the CLI this is a feature, not a primitive
    type: "registry:block", 
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    registryDependencies: config.registryDependencies,
    files: rawFiles.map(file => ({
      // Clean up the path and fix the .tsx.tsx naming issue
      path: path.join(config.targetPath, file.innerPath).replace(/\\/g, '/'),
      content: file.content,
      // CRITICAL CHANGE: registry:component respects our path property.
      // registry:ui would override it and force it into components/ui.
      type: "registry:component", 
    })),
    tailwind: config.tailwind,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${dirName}.json`),
    JSON.stringify(registryEntry, null, 2)
  );
  console.log(`✅ Registry built: components/${config.targetPath}`);
});