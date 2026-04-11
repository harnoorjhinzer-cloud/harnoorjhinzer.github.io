# Harnoor Jhinzer — Portfolio Site

Your personal portfolio, ready to deploy for free on GitHub Pages.


## 🚀 How to deploy (5 minutes, free forever)

1. Go to **github.com** and create an account (or log in)
2. Click the **+** button → **New repository**
3. Name it: `harnoorjhinzer.github.io` (replace with your GitHub username)
4. Make it **Public**
5. Click **Create repository**
6. Click **"uploading an existing file"**
7. Drag this entire folder's contents into the upload area
8. Click **Commit changes**
9. Go to **Settings → Pages → Source** → select **main** branch → click **Save**
10. Your site is now live at: `https://harnoorjhinzer.github.io`


## ✏️ How to edit text

Open `index.html` in any text editor (even Notepad works). Look for comments that say `<!-- EDIT: ... -->` — they mark every piece of editable content. Change the text between the tags, save, and re-upload to GitHub.

**Example — changing your tagline:**
Find this line:
```html
<p class="hero-eyebrow">Luxury Consumer Psychology · Brand Strategy · HNW Behavior</p>
```
Change the text between `>` and `</p>` to whatever you want.


## 📄 How to add PDFs

1. Put your PDF file in the `docs/` folder (e.g. `docs/my-research.pdf`)
2. In `index.html`, find the case study you want to link
3. Change the link:

**Before (coming soon):**
```html
<span class="case-soon">Coming soon</span>
```

**After (linked to your PDF):**
```html
<a href="docs/my-research.pdf" class="case-link">Read Case Study</a>
```

4. Upload both the updated `index.html` and the new PDF to GitHub


## 📁 Folder structure

```
/
├── index.html          ← Your website (edit this)
├── docs/               ← Put PDFs here
│   └── (your-pdfs.pdf)
├── images/             ← Put images here (og-image, favicon, etc.)
└── README.md           ← This file
```


## 🔍 SEO

SEO meta tags are already set up in the `<head>` of `index.html`. To customize:

- **Title & description**: Edit the `<title>` and `<meta name="description">` tags
- **Social sharing image**: Create a 1200×630px image, save it as `images/og-image.jpg`, then uncomment the `og:image` line
- **Favicon**: Save your favicon as `images/favicon.ico` and uncomment the favicon line


## 💌 Email

Your email is set to `hello@harnoorjhinzer.com`. To change it, search for `mailto:` in `index.html` and replace both the href and the displayed text.
