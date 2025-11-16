// Tạo file tạm để lưu changelog tạm thời
import createTempFile from 'tempfile';
// conventional-changelog tạo changelog tự động theo chuẩn commit
import conventionalChangelog from 'conventional-changelog';
// Module core để thao tác file
import { resolve } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
// Đọc version từ package.json tại thư mục gốc
import packageJson from '../../package.json' assert { type: 'json' };

// Xác định thư mục gốc (monorepo root)
const baseDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// File changelog chính (đầy đủ)
const fullChangelogFile = resolve(baseDir, 'CHANGELOG.md');

// File changelog riêng cho version hiện tại (dùng cho PR, review)
const versionChangelogFile = resolve(baseDir, `CHANGELOG-${packageJson.version}.md`);

// Tạo luồng stream sinh changelog cho version mới nhất
const changelogStream = conventionalChangelog({
  preset: 'angular',      // Định dạng commit style: Angular convention
  releaseCount: 1,        // Chỉ lấy changelog cho version mới nhất
  tagPrefix: 'n8n@',      // Tag sẽ có dạng "n8n@1.2.3"

  // Loại bỏ các commit không nên ghi vào changelog
  transform: (commit, callback) => {
    const hasNoChangelogInHeader = commit.header.includes('(no-changelog)');
    const isBenchmarkScope = commit.scope === 'benchmark';

    // Bỏ qua commit có header chứa "(no-changelog)" hoặc scope là "benchmark"
    // Ignore commits that have 'benchmark' scope or '(no-changelog)' in the header
    callback(null, hasNoChangelogInHeader || isBenchmarkScope ? undefined : commit);
  },
}).on('error', (err) => {
  console.error(err.stack);
  process.exit(1);
});

// Ghi changelog mới vào file `CHANGELOG-<version>.md`
// File này thường dùng để chèn vào PR hoặc release notes
await pipeline(changelogStream, createWriteStream(versionChangelogFile));

// --- Gộp changelog mới vào changelog tổng (CHANGELOG.md) ---

// Vì không thể vừa đọc vừa ghi cùng 1 file → cần file tạm
const tmpFile = createTempFile(); // tạo file tạm
const tmpStream = createWriteStream(tmpFile);

// Bước 1: ghi nội dung changelog mới (version) vào file tạm
await pipeline(createReadStream(versionChangelogFile), tmpStream, { end: false });

// Bước 2: nối nội dung changelog cũ (full) vào sau changelog mới
await pipeline(createReadStream(fullChangelogFile), tmpStream);

// Bước 3: ghi file tạm (đã gộp cả changelog mới và cũ) trở lại vào `CHANGELOG.md`
await pipeline(createReadStream(tmpFile), createWriteStream(fullChangelogFile));