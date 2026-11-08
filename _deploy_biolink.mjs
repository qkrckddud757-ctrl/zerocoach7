/**
 * 바이오링크 배포 — links.html → https://lab.goodcoach.kr
 *
 *   node _deploy_biolink.mjs
 *
 * links.html 을 고친 뒤 이 파일을 실행하면
 * _biolink_build/ 를 새로 만들어 Cloudflare(zerocoach-links)로 올린다.
 * 깃 푸시(= 옛 주소 github.io)는 따로 해야 한다.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(ROOT, '_biolink_build');
const PUB = path.join(BUILD, 'public');
const OLD = 'https://qkrckddud757-ctrl.github.io/zerocoach7';
const NEW = 'https://lab.goodcoach.kr';

fs.rmSync(BUILD, { recursive: true, force: true });
fs.mkdirSync(path.join(PUB, 'img'), { recursive: true });

let html = fs.readFileSync(path.join(ROOT, 'links.html'), 'utf8');
html = html
  .replaceAll(`${OLD}/img/oglink.jpg`, `${NEW}/img/oglink.jpg`)
  .replaceAll(`${OLD}/links.html`, `${NEW}/`)
  // 같은 저장소의 다른 페이지는 옛 주소(깃허브)를 그대로 쓴다
  .replace(/href="(?!https?:|#|img\/)([^"]+\.html)"/g, `href="${OLD}/$1"`);
fs.writeFileSync(path.join(PUB, 'index.html'), html, 'utf8');

// index.html 이 실제로 쓰는 그림만 복사
const used = [...html.matchAll(/(?:src|content)="(?:https:\/\/lab\.goodcoach\.kr\/)?(img\/[^"]+)"/g)]
  .map(m => m[1]);
for (const rel of [...new Set(used)]) {
  const from = path.join(ROOT, rel);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(BUILD, 'public', rel));
    console.log('그림', rel);
  } else {
    console.warn('없는 그림', rel);
  }
}

fs.writeFileSync(path.join(BUILD, 'wrangler.jsonc'), JSON.stringify({
  name: 'zerocoach-links',
  compatibility_date: '2026-11-04',
  observability: { enabled: true },
  assets: { directory: './public' },
  routes: [{ pattern: 'lab.goodcoach.kr', custom_domain: true }],
}, null, 2), 'utf8');

execSync('npx --yes wrangler@latest deploy', { cwd: BUILD, stdio: 'inherit' });
console.log('\n올라감 → https://lab.goodcoach.kr');
