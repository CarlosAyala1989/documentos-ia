// extraerVideos.js
import fs from 'fs';
import path from 'path';

// Buscar todos los index.html en subcarpetas
function findHtmlReports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...findHtmlReports(fullPath));
    } else if (entry.isFile() && entry.name === 'index.html') {
      paths.push(fullPath);
    }
  }
  return paths;
}

const htmlFiles = findHtmlReports(path.resolve('reportes'));

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf-8');
  const matches = [...html.matchAll(/<source src="data:video\/webm;base64,([^"]+)"/g)];

  const baseDir = path.dirname(htmlFile);
  const outputDir = path.join(baseDir, 'videos');
  fs.mkdirSync(outputDir, { recursive: true });

  matches.forEach((match, index) => {
    const base64 = match[1];
    const buffer = Buffer.from(base64, 'base64');
    const filename = `video-${index + 1}.webm`;
    const filePath = path.join(outputDir, filename);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ Guardado: ${filePath}`);
    } else {
      console.log(`⚠️ Ya existe (omitido): ${filePath}`);
    }
  });

  if (matches.length === 0) {
    console.log(`⚠️ No se encontraron videos en: ${htmlFile}`);
  }
}
