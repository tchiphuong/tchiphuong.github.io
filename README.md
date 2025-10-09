# Portfolio Website - Phuong Tran

Portfolio cá nhân được thiết kế theo phong cách Netflix với hiệu ứng glassmorphism và dark mode.

## 🌟 Tính năng

-   ✨ **Netflix-style Design** - Thiết kế theo phong cách Netflix với màu đỏ đặc trưng
-   🌓 **Dark/Light Mode** - Chuyển đổi theme với Tailwind CSS 4
-   💎 **Glassmorphism Effects** - Hiệu ứng kính mờ đẹp mắt
-   📱 **Responsive Design** - Tối ưu cho mọi thiết bị (Mobile, Tablet, Desktop)
-   🎯 **Skills Section** - Hiển thị skills với icons đầy màu sắc
-   🖼️ **Projects Gallery** - Carousel ngang với thumbnails từ GitHub
-   📧 **Contact Cards** - 4 cards contact với hover effects
-   🔗 **Social Links** - GitHub, LinkedIn, Facebook
-   ⚡ **Fast Performance** - Built với Vite + React 19

## 🚀 Demo

Xem live demo tại: [https://tchiphuong.github.io](https://tchiphuong.github.io)

## 🛠️ Công nghệ sử dụng

### Core

-   **React 19.1.0** - UI Library
-   **Vite 7.0.0** - Build tool & Dev server
-   **Tailwind CSS 4.1.11** - Utility-first CSS framework

### Icons & Assets

-   **react-icons 5.5.0** - Icon library (Font Awesome, Simple Icons)
-   **GitHub OpenGraph API** - Project thumbnails

### DevOps

-   **ESLint** - Code linting
-   **gh-pages** - GitHub Pages deployment

## 📦 Cài đặt

### Yêu cầu

-   Node.js >= 18.0.0
-   npm hoặc yarn

### Các bước cài đặt

1. **Clone repository**

```bash
git clone https://github.com/tchiphuong/tchiphuong.github.io.git
cd tchiphuong.github.io
```

2. **Cài đặt dependencies**

```bash
npm install
```

3. **Chạy development server**

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu bận)

4. **Build production**

```bash
npm run build
```

Files build sẽ được tạo trong folder `dist/`

5. **Preview production build**

```bash
npm run preview
```

## 🎨 Cấu trúc project

```
tchiphuong.github.io/
├── public/               # Static assets
│   └── vite.svg
├── src/
│   ├── assets/          # Images & media
│   │   ├── avatar.png   # Profile picture
│   │   └── react.svg
│   ├── App.jsx          # Main component (All-in-one)
│   ├── index.css        # Global styles + Tailwind
│   └── main.jsx         # Entry point
├── .gitignore
├── eslint.config.js     # ESLint config
├── index.html           # HTML template
├── package.json         # Dependencies & scripts
├── postcss.config.mjs   # PostCSS config
├── tailwind.config.js   # Tailwind CSS config
├── vite.config.js       # Vite config
└── README.md
```

## 🎯 Các sections

### 1. Hero Section (About)

-   Full-screen banner với ảnh background
-   Tên, title, description
-   CTA buttons (View Projects, More Info)

### 2. Skills Section

-   Hiển thị skills theo categories:
    -   Core Technologies (C#, .NET, Blazor, Entity Framework, LINQ)
    -   Frontend (JavaScript, HTML, CSS, React, Angular, jQuery, Bootstrap, Tailwind, SASS)
    -   Backend & APIs (REST APIs, JWT, Hangfire, Redis, Windows Services)
    -   Databases (SQL Server, MySQL)
    -   Tools & DevOps (Git, GitHub Copilot, ChatGPT, DevExpress, Figma, Photoshop)
-   Tự động wrap xuống dòng
-   Icons màu sắc cho mỗi skill

### 3. Projects Section

-   Horizontal scroll carousel
-   Fetch projects từ GitHub API
-   Thumbnails từ GitHub OpenGraph
-   Hover effects: scale + shadow
-   Navigation arrows (hiện khi hover)
-   Thông tin: Name, Description, Language, Stars

### 4. Contact Section

-   4 cards với glassmorphism:
    -   Email
    -   GitHub
    -   LinkedIn
    -   Facebook
-   Hover effects: scale + translate + color change
-   Responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile)

### 5. Footer

-   Logo
-   Social links
-   Navigation links
-   Copyright

## 🎨 Customization

### Thay đổi thông tin cá nhân

**File: `src/App.jsx`**

```jsx
// Thay đổi tên
<h1>Your Name</h1>

// Thay đổi title
<p>Your Title</p>

// Thay đổi description
<p>Your description...</p>

// Thay đổi email
<a href="mailto:your@email.com">your@email.com</a>

// Thay đổi social links
<a href="https://github.com/yourusername">...</a>
<a href="https://linkedin.com/in/yourusername">...</a>
<a href="https://facebook.com/yourusername">...</a>
```

### Thay đổi ảnh profile

1. Thay file `src/assets/avatar.png` bằng ảnh của bạn
2. Hoặc update import trong `App.jsx`:

```jsx
import avatar from "./assets/your-image.png";
```

### Thay đổi skills

**File: `src/App.jsx`**

```jsx
const skills = {
    "Your Category": [
        "Skill 1",
        "Skill 2",
        // ...
    ],
    // ...
};
```

### Thêm icon cho skill mới

**File: `src/App.jsx`**

```jsx
// 1. Import icon từ react-icons
import { YourIcon } from "react-icons/fa";

// 2. Thêm case trong getSkillIcon()
case "Your Skill":
    return <YourIcon className={`${iconClass} text-your-color`} />;
```

### Thay đổi GitHub username

**File: `src/App.jsx`**

```jsx
// Tìm và thay đổi
fetch(`https://api.github.com/users/YOURUSERNAME/repos`);
```

### Thay đổi màu sắc theme

**File: `src/index.css`**

```css
/* Thay đổi màu Netflix red */
.text-red-600 {
    color: #YOUR_COLOR;
}
.bg-red-600 {
    background-color: #YOUR_COLOR;
}
```

Hoặc dùng Tailwind config để định nghĩa màu custom.

## 🚀 Deploy lên GitHub Pages

### Cách 1: Tự động (Recommended)

1. **Cập nhật thông tin**

```bash
# Sửa file theo hướng dẫn trên
```

2. **Commit changes**

```bash
git add .
git commit -m "Update portfolio"
git push origin master
```

3. **Deploy**

```bash
npm run deploy
```

Website sẽ được deploy tại: `https://yourusername.github.io`

### Cách 2: GitHub Actions (Advanced)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
    push:
        branches: [master]

jobs:
    build-and-deploy:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"

            - name: Install dependencies
              run: npm install

            - name: Build
              run: npm run build

            - name: Deploy
              uses: peaceiris/actions-gh-pages@v3
              with:
                  github_token: ${{ secrets.GITHUB_TOKEN }}
                  publish_dir: ./dist
```

## 🔧 Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Check code với ESLint
npm run deploy   # Build + Deploy lên GitHub Pages
```

## 🌐 Browser Support

-   Chrome (latest)
-   Firefox (latest)
-   Safari (latest)
-   Edge (latest)
-   Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## 🤝 Contributing

Mọi đóng góp đều được chào đón! Feel free to:

-   Report bugs
-   Suggest features
-   Submit pull requests

## 📧 Contact

-   **GitHub**: [@tchiphuong](https://github.com/tchiphuong)
-   **LinkedIn**: [Phuong Tran](https://www.linkedin.com/in/tchiphuong/)
-   **Facebook**: [@tchiphuong](https://www.facebook.com/tchiphuong)
-   **Email**: tchiphuong@example.com

## 🙏 Credits

-   Design inspiration: [Netflix](https://netflix.com)
-   Icons: [React Icons](https://react-icons.github.io/react-icons/)
-   Thumbnails: [GitHub OpenGraph API](https://github.blog/2021-06-22-framework-building-open-graph-images/)
-   Built with: [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)

---

Made with ❤️ by Phuong Tran
