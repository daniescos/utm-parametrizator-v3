# UTM Link Generator - Setup Instructions

Due to permission issues with Google Drive paths on Windows, the npm install process has some challenges. Here are the recommended setup steps:

## Option 1: Move to Standard Windows Directory (Recommended)

1. Move the `utm-generator` folder to `C:\projects\utm-generator`
2. Open PowerShell/Command Prompt in that directory
3. Run `npm install`
4. Run `npm run dev`

## Option 2: Use WSL (Windows Subsystem for Linux)

1. Open WSL terminal
2. Navigate to your project using the Linux path
3. Run `npm install`
4. Run `npm run dev`

## Option 3: Docker

If you have Docker installed, create a Dockerfile at the root level:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
```

Then run:
```bash
docker build -t utm-generator .
docker run -p 5173:5173 utm-generator
```

## Manual Setup (If npm continues to fail)

If npm install fails, you can manually download and place node_modules:

1. Try npm install with verbose mode:
   ```bash
   npm install --verbose --no-audit
   ```

2. If still failing, use npm ci (requires package-lock.json):
   ```bash
   npm ci --prefer-offline
   ```

## Files Created

All necessary application files have been created:

### Source Code
- `src/components/UserGenerator.tsx` - Main user interface
- `src/components/AdminPanel.tsx` - Admin configuration interface
- `src/components/PasswordGuard.tsx` - Admin authentication
- `src/lib/types.ts` - TypeScript interfaces
- `src/lib/storage.ts` - localStorage management
- `src/lib/utils.ts` - Utility functions
- `src/App.tsx` - Main app component
- `src/index.css` - Tailwind CSS imports
- `src/main.tsx` - Entry point

### Configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `package.json` - Project dependencies

## Usage

Once npm install completes:

### Development
```bash
npm run dev
```
Visit http://localhost:5173

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## Features

### User Generator
- Enter base URL
- Select UTM parameters from dropdowns
- Conditional dropdowns based on dependency rules
- Generate complete URL
- Copy to clipboard

### Admin Panel (password: "admin123")
- Manage UTM fields
- Configure field options
- Set dependency rules
- Export/import configuration
- Change admin password

## Troubleshooting npm Issues

### Issue: "EBADF: bad file descriptor"
- This is a Google Drive permission issue
- Solution: Move project to C:\ drive or use WSL

### Issue: "TAR_ENTRY_ERROR"
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules`
- Try again: `npm install`

### Issue: "EPERM: operation not permitted"
- Close all instances of the project
- Clear npm cache
- Disable Google Drive sync temporarily
- Try npm install again

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy with default settings
4. Visit your deployed URL

### Netlify
1. Push code to GitHub
2. Connect to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Cloudflare Pages
1. Push code to GitHub
2. Create new project in Cloudflare Pages
3. Select the GitHub repository
4. Use default build settings

## Environment Notes

- Node version: 20 or higher
- npm version: 10 or higher
- No backend required (fully client-side)
- Uses localStorage for configuration persistence
- Dark theme optimized for readability

## Configuration

Default admin password: `admin123`

Change it in the admin panel immediately after first login.

## Support

If npm install continues to fail:
1. Try in a non-Google Drive directory
2. Use WSL or Docker
3. Consider using `pnpm` instead of `npm`
