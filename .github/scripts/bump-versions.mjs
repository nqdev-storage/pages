// Import các thư viện cần thiết
import semver from 'semver';
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import child_process from 'child_process';
import { promisify } from 'util';
import assert from 'assert';

// Chuyển `exec` từ callback sang Promise
const exec = promisify(child_process.exec);

// Gốc thư mục của project (monorepo)
const rootDir = process.cwd();

// Loại release: patch | minor | major
const releaseType = process.env.RELEASE_TYPE;

// TODO: nếu releaseType là 'auto', nên đọc từ changelog để tự xác định loại release

// Đảm bảo RELEASE_TYPE hợp lệ
assert.match(releaseType, /^(patch|minor|major)$/, 'Invalid RELEASE_TYPE');

// TODO: if releaseType is `auto` determine release type based on the changelog

// Lấy tag gần nhất theo định dạng "n8n@*" (ví dụ: "n8n@1.4.0")
const lastTag = (await exec('git describe --tags --match "n8n@*" --abbrev=0')).stdout.trim();

// Lấy danh sách các package (dạng JSON) trong monorepo
const packages = JSON.parse((await exec('pnpm ls -r --only-projects --json')).stdout);

// Bản đồ lưu thông tin các package
const packageMap = {};

for (let { name, path, version, private: isPrivate, dependencies } of packages) {
  // Bỏ qua package private không phải là root
  if (isPrivate && path !== rootDir) continue;

  // Đặt tên đặc biệt cho root package
  if (path === rootDir) name = 'monorepo-root';

  // Kiểm tra xem package có thay đổi kể từ tag gần nhất không
  const isDirty = await exec(`git diff --quiet HEAD ${lastTag} -- ${path}`)
    .then(() => false)
    .catch((error) => true); // nếu `git diff` có khác biệt → dirty

  // Lưu thông tin vào bản đồ
  packageMap[name] = { path, isDirty, version };
}

// Nếu tất cả các package đều không thay đổi → dừng lại
assert.ok(
  Object.values(packageMap).some(({ isDirty }) => isDirty),
  'No changes found since the last release',
);

// Đồng bộ version của monorepo root với version hiện tại của `n8n`
packageMap['monorepo-root'].version = packageMap['n8n'].version;

// Duyệt qua từng package để cập nhật version mới
for (const packageName in packageMap) {
  const { path, version, isDirty } = packageMap[packageName];
  const packageFile = resolve(path, 'package.json');
  const packageJson = JSON.parse(await readFile(packageFile, 'utf-8'));

  // Nếu bản thân package hoặc một dependency của nó bị thay đổi → bump version
  const shouldBump =
    isDirty ||
    Object.keys(packageJson.dependencies || {}).some(
      (dependencyName) => packageMap[dependencyName]?.isDirty,
    );

  // Tính version mới nếu cần
  packageJson.version = packageMap[packageName].nextVersion = shouldBump
    ? semver.inc(version, releaseType)
    : version;

  // Ghi lại file package.json đã cập nhật version
  await writeFile(packageFile, JSON.stringify(packageJson, null, 2) + '\n');
}

// In ra version mới của package `n8n` (dùng để tag hoặc publish)
console.log(packageMap['n8n'].nextVersion);