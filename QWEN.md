# Bank Products Static Site

## Project Overview

This is a static website generator for bank products comparison platform (https://bank-select.ru). The project generates a static site that allows users to browse, compare, and learn about different banking products including credit cards, debit cards, and cash loans.

The site is built using a static site generation approach with Handlebars templating engine. It processes JSON data files containing information about bank products and generates static HTML pages for each product, category, and comparison view.

### Key Features
- Product listings with detailed information
- Category-based browsing (credit cards, debit cards, cash loans)
- Side-by-side product comparison functionality
- Responsive design with mobile-friendly navigation
- SEO-friendly structure with proper meta tags
- Credit calculator tool
- Article section for financial education

### Technology Stack
- **Templating Engine**: Handlebars
- **Server**: Express.js (for development)
- **Build System**: npm scripts
- **Styling**: CSS with custom theme
- **Testing**: Jest and Playwright for end-to-end testing
- **Deployment**: GitHub Pages via gh-pages package

## Project Structure

```
src/
├── data/           # JSON data files for products, categories, banks
├── img/            # Images including bank logos
├── scripts/        # Build and server scripts
├── static/         # Static assets (favicon, manifest, etc.)
├── styles/         # CSS files
├── templates/      # Handlebars template files
└── tests/          # Test files
```

### Data Structure
- `data/pdfs/` and `data/pdfs/loan-t-bank/`: JSON files containing product information
- `data/categories.json`: Defines product categories
- `data/banks.json`: Information about banks
- `data/products.json`: Additional product data

### Templates
- `layout.html`: Main layout template
- `product-page.html`: Individual product page template
- `category-page.html`: Category listing template
- `compare-page.html`: Product comparison template
- `index-page.html`: Homepage template
- `articles/`: Educational article templates

## Building and Running

### Development Commands

```bash
# Install dependencies
npm install

# Build the site (v2 version)
npm run build:v2
# or
npm run build

# Start development server
npm run dev

# Watch for changes and rebuild automatically
npm run watch

# Serve the built site
npm run serve

# Run all tests
npm run test

# Run only Jest tests
npm run test:jest

# Run Playwright UI tests
npm run test:ui

# Run Playwright tests in debug mode
npm run test:debug

# Deploy to GitHub Pages
npm run publish
```

### Quick Start
1. Run `npm run dev` to build and start the development server
2. Visit `http://localhost:9999` to view the site
3. Make changes to source files and use `npm run watch` to automatically rebuild

### Alternative Short Commands
- `npm run b` - alias for build
- `npm run d` - alias for dev
- `npm run w` - alias for watch
- `npm run t` - alias for test
- `npm run tu` - alias for test:ui
- `npm run td` - alias for test:debug
- `npm run p` - alias for publish

## Development Conventions

### Data Format
Product data is stored in JSON format with the following structure:
- `id`: Unique identifier for the product
- `type`: Product type (credit-cards, debit-cards, credits)
- `parameters`: Object containing product parameters like interest rates, fees, etc.

### Template System
- Uses Handlebars templating engine
- Includes custom helpers like `add`, `isArray`, and `length`
- Partials are registered for reusable components
- SEO-friendly meta tags are dynamically generated

### Testing
- Unit tests use Jest (files ending in `.spec.js`)
- E2E tests use Playwright
- Tests are located in the `src/tests` directory
- Playwright tests run against the development server

### Deployment
- Site is deployed to GitHub Pages using the `gh-pages` package
- Builds are published to the `dist` directory
- Custom domain is set to `bank-select.ru` via CNAME file
- Includes sitemap.xml and robots.txt for SEO

## Special Features

### PDF Processing
The project includes functionality to convert PDF documents to JSON data using the `pdf-parse` library, allowing for automated extraction of product information from bank documentation.

### Analytics Integration
- Google Analytics (gtag)
- Yandex Metrika

### Mobile Responsiveness
The site includes responsive design with mobile-friendly navigation menus and dropdowns.

## Output
The build process generates a complete static site in the `dist/` directory with:
- Individual product pages
- Category listing pages
- Comparison pages
- Static assets (CSS, images)
- SEO files (sitemap.xml, robots.txt)
- Article pages
- Calculator and other tools