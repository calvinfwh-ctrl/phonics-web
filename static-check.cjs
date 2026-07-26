/**
 * Static analysis checks for Phonics Web App
 */
const fs = require('fs');
const basePath = '/Users/clawfan/.openclaw/workspace/phonics-web';

// Read all source files
const files = fs.readdirSync(basePath + '/src', { recursive: true })
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css'));
const appFiles = fs.readdirSync(basePath + '/app', { recursive: true })
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css'));

let allContent = '';
for (const f of [...files.map(f => basePath + '/src/' + f), ...appFiles.map(f => basePath + '/app/' + f)]) {
  try { allContent += fs.readFileSync(f, 'utf8') + '\n'; } catch(e) {}
}

// Also read .env.local and next.config.ts
try { allContent += fs.readFileSync(basePath + '/.env.local', 'utf8'); } catch(e) {}
try { allContent += fs.readFileSync(basePath + '/next.config.ts', 'utf8'); } catch(e) {}
try { allContent += fs.readFileSync(basePath + '/tailwind.config.ts', 'utf8'); } catch(e) {}

// 1. IPA check
const ipaPattern = /[æɪɒɔɛɑʊəʌɜθðʃʒŋʔɹɝʧʤ]/g;
const ipaMatches = allContent.match(ipaPattern) || [];
console.log('1. IPA characters:', ipaMatches.length > 0 ? `FOUND ${ipaMatches.length}: ${ipaMatches.join(',')}` : 'NONE ✅');

// 2. API Key check (exclude comments)
const nonCommentContent = allContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const apiKeyPattern = /(api[_-]?key|api[_-]?secret|access[_-]?token)\s*[=:]\s*['"]([^'"]{8,})['"]/gi;
const apiKeyMatches = nonCommentContent.match(apiKeyPattern) || [];
console.log('2. Hardcoded API keys:', apiKeyMatches.length > 0 ? apiKeyMatches : 'NONE ✅');

// 3. .env.local
const envContent = fs.readFileSync(basePath + '/.env.local', 'utf8');
console.log('3. .env.local:', envContent.trim().substring(0, 200));

// 4. Dexie table structure
const dbContent = fs.readFileSync(basePath + '/src/lib/db.ts', 'utf8');
const storeSection = dbContent.match(/stores\(\{([\s\S]*?)\}\)/);
if (storeSection) {
  const stores = storeSection[1].split(',').map(s => s.trim().split(':')[0].trim());
  console.log('4. Dexie IndexedDB stores:', stores.join(', '));
}

// 5. Word count analysis
const dataContent = fs.readFileSync(basePath + '/src/data/stage2-short-vowels.ts', 'utf8');
const ruleCount = (dataContent.match(/id:\s*['"]short_/g) || []).length;
const familyCount = (dataContent.match(/ending:\s*['"]-/g) || []).length;

// Extract practice words
function extractWords(section) {
  const all = [];
  const regex = new RegExp(section + ':\\s*\\[([\\s\\S]*?)\\]', 'g');
  let match;
  while ((match = regex.exec(dataContent)) !== null) {
    const words = match[1].match(/['"](\w+)['"]/g) || [];
    all.push(...words.map(w => w.replace(/['"]/g, '')));
  }
  return [...new Set(all)];
}

const practiceWords = extractWords('practiceWords');
const transferWords = extractWords('transferWords');
const nonsenseWords = extractWords('nonsenseWords');
const allWords = [...new Set([...practiceWords, ...transferWords, ...nonsenseWords])];

console.log(`5. Knowledge base: ${ruleCount} rules, ${familyCount} word families`);
console.log(`   Practice words: ${practiceWords.length} unique`);
console.log(`   Transfer words: ${transferWords.length}`);
console.log(`   Nonsense words: ${nonsenseWords.length}`);
console.log(`   Total unique words: ${allWords.length}`);
console.log(`   (Spec claims: 5 rules, 29 word families, 200+ words)`);

// 6. Check for dangerous patterns
const forceUnwrap = allContent.match(/!\s*\)/g) || [];
const anyTypes = allContent.match(/: any/g) || [];
console.log(`6. Force unwraps (!): ${forceUnwrap.length}`);
console.log(`   :any types: ${anyTypes.length}`);

// 7. Check next.config.ts for reactStrictMode
const nextConfig = fs.readFileSync(basePath + '/next.config.ts', 'utf8');
console.log(`7. reactStrictMode: ${nextConfig.includes('reactStrictMode: false') ? 'disabled (for speech API compat)' : 'enabled'}`);

console.log('\n=== ANALYSIS COMPLETE ===');
