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
 * Recursively gets all files in a directory.
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
      // Filter for code files
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

  const rawFiles = getFiles(sourcePath, sourcePath);

  const registryEntry = {
    name: config.name,
    // Using registry:block ensures shadcn respects our custom folder structure
    type: "registry:block", 
    dependencies: config.dependencies,
    devDependencies: config.devDependencies,
    registryDependencies: config.registryDependencies,
    files: rawFiles.map(file => ({
      // Combine targetPath with the inner file structure
      path: path.join(config.targetPath, file.innerPath).replace(/\\/g, '/'),
      content: file.content,
      type: "registry:ui",
    })),
    tailwind: config.tailwind,
  };

  const outputPath = path.join(OUTPUT_DIR, `${dirName}.json`);
  
  fs.writeFileSync(outputPath, JSON.stringify(registryEntry, null, 2));
  console.log(`✅ Registry built: ${outputPath}`);
  console.log(`📂 Destination: components/${config.targetPath}`);
});

console.log("\n🚀 Build complete. Push the 'registry/' folder to GitHub.");