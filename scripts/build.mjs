import fs from "fs";
import path from "path";

// 1. Configuration: Add new top-level folders here to create new registry files
const REGISTRY_CONFIG = {
  "chat": {
    name: "chat-ui",
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
            },
            animation: {
              "fade-in": "fade-in 0.5s ease-out",
            },
            keyframes: {
              "fade-in": {
                "0%": { opacity: "0", transform: "translateY(10px)" },
                "100%": { opacity: "1", transform: "translateY(0)" },
              },
            },
          },
        },
      },
    },
  },
};

const OUTPUT_DIR = "./registry";

/**
 * Recursively gets all files in a directory and formats them for the shadcn registry.
 */
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
      // We only want to package component files
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push({
          path: path.relative(baseDir, filePath),
          content: fs.readFileSync(filePath, "utf8"),
          type: "registry:ui",
        });
      }
    }
  });
  return results;
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate the JSON files
Object.entries(REGISTRY_CONFIG).forEach(([dirName, config]) => {
  const sourcePath = path.join(process.cwd(), dirName);
  
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Source directory "${dirName}" not found. Skipping...`);
    return;
  }

  const registryEntry = {
    name: config.name,
    type: "registry:ui",
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    registryDependencies: config.registryDependencies,
    files: getFiles(sourcePath, sourcePath),
    tailwind: config.tailwind,
  };

  const fileName = `${dirName}.json`;
  const outputPath = path.join(OUTPUT_DIR, fileName);
  
  fs.writeFileSync(outputPath, JSON.stringify(registryEntry, null, 2));
  console.log(`✅ Registry built: ${outputPath} (${registryEntry.files.length} files)`);
});

console.log("\n🚀 All registries are ready to be pushed to GitHub.");