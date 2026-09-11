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
- `src/lib/types.ts` - TypeScript interfaces
- `src/lib/storage.ts` - Fetches `public/config.json` (single source of truth — see [MANUAL.md](./MANUAL.md))
- `src/lib/utils.ts` - Rule engine / URL generation
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

There is no admin panel — UTM rules are edited directly in `public/config.json` and
deployed via git. See [MANUAL.md](./MANUAL.md) for the step-by-step guide.

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

Deployed automatically to **GitHub Pages** on every push to `main` via
`.github/workflows/deploy.yml`. See [DEPLOY.md](./DEPLOY.md) for details.

## Environment Notes

- Node version: 20 or higher
- npm version: 10 or higher
- No backend required (fully client-side, static hosting)
- Rules live in `public/config.json`, edited via git — see [MANUAL.md](./MANUAL.md)
- Dark theme optimized for readability

## Support

If npm install continues to fail:
1. Try in a non-Google Drive directory
2. Use WSL or Docker
3. Consider using `pnpm` instead of `npm`
