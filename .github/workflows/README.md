
# GitHub Actions Workflows

Thư mục này chứa các workflow tự động hóa cho dự án FinTrack.

## 📋 Danh sách Workflows

### 1. `publish_ghcr.yml` - Publish Docker Image to GHCR

Workflow này tự động build và publish Docker image lên GitHub Container Registry (ghcr.io).

#### Khi nào workflow chạy?

- ✅ **Manual dispatch**: Chạy thủ công từ GitHub Actions tab
- ✅ **Repository dispatch**: Kích hoạt từ hệ thống bên ngoài hoặc workflow khác
- ✅ **Release created**: Tự động chạy khi tạo release mới

#### Workflow thực hiện các bước:

1. Checkout source code từ repository
2. Thiết lập môi trường Node.js v22
3. Cấu hình Docker Buildx cho việc build nâng cao
4. Đăng nhập vào GitHub Container Registry sử dụng `GITHUB_TOKEN`
5. Trích xuất metadata và tạo các tags cho Docker image
6. Build Docker image từ `Dockerfile`
7. Push image lên `ghcr.io/nguyenquy0710/financial-tracking`
8. Sử dụng GitHub Actions cache để tăng tốc độ build

#### Tags được tạo tự động:

- `latest` - Build mới nhất từ branch main
- `v{major}.{minor}.{patch}` - Semantic version từ releases
- `{major}.{minor}` - Version tags theo major.minor
- `{major}` - Version tags theo major
- `1.0.{run_number}` - Custom version dựa trên run number

#### Cách chạy workflow thủ công:

1. Truy cập repository trên GitHub
2. Click vào tab **Actions**
3. Chọn workflow **"Publish: Docker Image to GHCR"**
4. Click nút **"Run workflow"**
5. Chọn branch và click **"Run workflow"**

#### Sử dụng Docker image đã publish:

```bash
# Pull image mới nhất
docker pull ghcr.io/nguyenquy0710/financial-tracking:latest

# Chạy container
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongodb:27017/fintrack \
  -e JWT_SECRET=your-secret-key \
  --name fintrack-api \
  ghcr.io/nguyenquy0710/financial-tracking:latest
```

#### Sử dụng với Docker Compose:

Cập nhật `docker-compose.yml`:
```yaml
services:
  api:
    image: ghcr.io/nguyenquy0710/financial-tracking:latest
    # ... phần còn lại của cấu hình
```

### 2. `publish_npm.yml` - Publish Package to npmjs

Workflow này publish package lên npmjs khi có release mới.

**Yêu cầu**: Cần thiết lập `NPM_TOKEN` trong repository secrets.

### 3. `changelog.yml` - Generate Changelog

Workflow này tự động tạo changelog cho các release.

## 🔐 Repository Secrets

Các secrets cần thiết lập trong repository settings:

- `GITHUB_TOKEN` - Tự động có sẵn, không cần thiết lập
- `NPM_TOKEN` - Cần thiết lập cho npm publish workflow

## 📚 Tài liệu tham khảo

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Publishing Docker images](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 🛠️ Troubleshooting

### Workflow bị lỗi khi build Docker image

1. Kiểm tra `Dockerfile` có đúng cú pháp không
2. Xem logs trong Actions tab để xác định lỗi cụ thể
3. Đảm bảo tất cả dependencies trong `package.json` đã đúng

### Không thể pull Docker image từ GHCR

1. Kiểm tra xem image đã được publish chưa trong Packages tab
2. Nếu repository là private, cần đăng nhập:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

### Workflow không chạy khi tạo release

1. Kiểm tra workflow triggers trong file `.yml`
2. Đảm bảo release được tạo với đúng type (created/published)
3. Kiểm tra permissions trong workflow file

## 💡 Best Practices

1. **Semantic Versioning**: Sử dụng semantic versioning cho releases (v1.0.0, v1.1.0, etc.)
2. **Testing**: Test workflow trên branch riêng trước khi merge vào main
3. **Cache**: Workflow sử dụng GitHub Actions cache để giảm thời gian build
4. **Security**: Không bao giờ commit secrets vào source code
5. **Documentation**: Cập nhật README khi thay đổi workflow

## 🤝 Contributing

Khi thêm hoặc sửa đổi workflow:

1. Test kỹ lưỡng trước khi merge
2. Cập nhật documentation
3. Sử dụng actions version mới nhất và ổn định
4. Tuân thủ best practices của GitHub Actions
