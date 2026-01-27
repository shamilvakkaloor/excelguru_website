# Hosting Your Website on GitHub Pages

Follow this step-by-step guide to host your Excel Guru website for free using GitHub Pages.

## Prerequisites
- You need a [GitHub account](https://github.com/).
- Git installed on your computer.

## Step 1: Initialize Git in Your Project Folder

1.  Open your project folder `d:\CODING\Antigravity\excelguru Website` in VS Code or Terminal.
2.  Run the following commands in the terminal:

```bash
git init
git add .
git commit -m "Initial commit - Excel Guru Website"
```

## Step 2: Create a Repository on GitHub

1.  Log in to GitHub.
2.  Click the **+** icon in the top right and select **New repository**.
3.  Name it `excelguru-website` (or similar).
4.  Make it **Public** (required for free GitHub Pages).
5.  Click **Create repository**.

## Step 3: Push Your Code

1.  Copy the commands shown on the "Quick setup" page under *"...or push an existing repository from the command line"*. It looks like this:

```bash
git remote add origin https://github.com/YOUR_USERNAME/excelguru-website.git
git branch -M main
git push -u origin main
```

2.  Paste and run them in your terminal.

## Step 4: Enable GitHub Pages

1.  Go to your repository page on GitHub.
2.  Click **Settings** (top tab).
3.  In the left sidebar, click **Pages**.
4.  Under **Build and deployment** > **Source**, select **Deploy from a branch**.
5.  Under **Branch**, select `main` and keep the folder as `/ (root)`.
6.  Click **Save**.

## Step 5: Live Website

- After a minute or two, refresh the Pages settings.
- You will see a message: "Your site is live at `https://YOUR_USERNAME.github.io/excelguru-website/`".
- Click that link to see your website!

## Domain Setup (excelguru.co.in)

To use your custom domain `excelguru.co.in`:

1.  In the GitHub Pages settings, under **Custom domain**, type `excelguru.co.in` and click **Save**.
2.  Go to your Domain Registrar (where you bought the domain, e.g., GoDaddy, Namecheap).
3.  Find DNS Settings.
4.  Add following record:
    - **Type**: `CNAME`
    - **Name/Host**: `www`
    - **Value/Points to**: `YOUR_USERNAME.github.io`
5.  Add **A Records** for the root domain to point to GitHub's IPs:
    - `185.199.108.153`
    - `185.199.109.153`
    - `185.199.110.153`
    - `185.199.111.153`

It may take up to 24-48 hours for DNS to propagate.
