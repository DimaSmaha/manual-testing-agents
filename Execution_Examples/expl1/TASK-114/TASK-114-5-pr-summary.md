# TASK-114 - PR Summary

PR: https://github.com/saucelabs/sample-app-web/pull/52
Branch: feat/product-details (taken from the merge commit message `c010ac2`; not confirmed through the GitHub API because `gh` is not available)
Base: main (merge base `a25eedb`)
Source: local clone, PR head fetched via `refs/pull/52/head`. Compared with `git diff main...pr-52`.
Changed files: 324 (from `git diff --name-only main...pr-52`)

## Overview

The PR replaces the legacy app at the repo root (EJS templates + vanilla JS + webpack) with the React app that lived in the `new/` folder. The React app is moved to the repo root (`src/`, `public/`) and the `new/` folder is deleted. On top of that move it adds:

- shared UI components (Button, InputError, ErrorMessage, SubmitButton, CartButton, DrawerMenu, HeaderContainer, InventoryListItem)
- a product details page (`InventoryItem`)
- Storybook stories
- unit tests with snapshots

Most files in the list are renames or deletions. Files named `R<nn>` in git are renames with `<nn>`% similarity.

## Changed files

### Product details page (new)

| File | Category | What changed |
|------|----------|--------------|
| src/pages/InventoryItem.jsx | component (page) | Added `InventoryItem` page. Reads the `id` query param and takes the item from `InventoryData`. If the id is missing or out of range, shows an "ITEM NOT FOUND" placeholder (price `√-1`, image `sl-404.jpg`). Has a "Back to products" button (`goBack` to `ROUTES.INVENTORY`) and an Add to cart / Remove button (`addToCart`, `removeFromCart`). `isProblemUser()` blocks add for odd ids and remove for even ids. Wrapped in `withRouter`. |
| src/pages/InventoryItem.css | style | Added styles for the details layout (`inventory_details*`, `inventory_item_container`). |
| src/pages/__tests__/InventoryItem.tests.js | test | Added unit tests for `InventoryItem`. |
| src/pages/__tests__/__snapshots__/InventoryItem.tests.js.snap | test | Added snapshot. |

### Product list (Inventory)

| File | Category | What changed |
|------|----------|--------------|
| src/pages/Inventory.jsx | component (page) | Moved from `new/src/pages/`. `HeaderContainer` now gets `secondaryTitle="Products"`, `secondaryHeaderBot`, and the sort `<select>` (`sortByOption`; az / za / lohi / hilo) as `secondaryRightComponent`. The inline `header_secondary_container` / `peek` / `product_label` markup is removed. |
| src/pages/Inventory.css | style | Moved and modified. |
| src/components/InventoryListItem.jsx | component | Added. List item with image, name and description, price, and an Add to cart / Remove button (the `Button` component). The image and name are links to `ROUTES.INVENTORY_LIST?id=<linkId>`. For `isProblemUser()`: the image URL gets a garbage suffix, the link id is +1, and add/remove are blocked for some ids. |
| src/components/InventoryListItem.css | style | Added. |
| src/components/__tests__/InventoryListItem.tests.js (+ `.snap`) | test | Added tests and snapshot. |
| src/pages/__tests__/Inventory.tests.js (+ `.snap`) | test | Added tests and snapshot. |
| src/utils/InventoryData.js | utility | Moved from `src/js/data/inventory-data.js`. 20 added / 34 removed lines. Now exports `InventoryData`. |

### Shared header, menu, cart button

| File | Category | What changed |
|------|----------|--------------|
| src/components/HeaderContainer.jsx | component | Added. Single header with a primary row (`DrawerMenu`, logo, `CartButton`) and a secondary row. Props: `customClass`, `secondaryLeftComponent`, `secondaryTitle`, `secondaryHeaderBot`, `secondaryRightComponent`. |
| src/components/HeaderContainer.css | style | Added. |
| src/components/CartButton.jsx / .css | component | Renamed from `new/src/components/HeaderCartButton.jsx` (57% similar). New CSS file. |
| src/components/DrawerMenu.jsx / .css | component | Renamed from `HeaderMenuButton.jsx` / `.css` (72% / 62% similar). |
| src/components/__tests__/HeaderContainer.tests.js, CartButton.tests.js (+ `.snap`) | test | Added. |

### Reusable form and button components (new)

| File | Category | What changed |
|------|----------|--------------|
| src/components/Button.jsx / .css | component | Added. Exports `Button`, `BUTTON_SIZES`, `BUTTON_TYPES` (PRIMARY, SECONDARY, ACTION, BACK, ...). Props: `label`, `onClick`, `size`, `type`, `testId`, `customClass`. |
| src/components/InputError.jsx / .css | component | Added. Input with an error state. Exports `INPUT_TYPES` (TEXT, PASSWORD). Props: `isError`, `testId`, `placeholder`, ... |
| src/components/ErrorMessage.jsx / .css | component | Added. Dismissible error banner. Props: `isError`, `errorMessage`, `onClick`. |
| src/components/SubmitButton.jsx / .css | component | Added. Submit input. Props: `value`, `testId`, `customClass`. |
| src/components/__tests__/Button.tests.js, InputError.tests.js, ErrorMessage.tests.js, SubmitButton.tests.js (+ `.snap` for each) | test | Added. |

### Login page

| File | Category | What changed |
|------|----------|--------------|
| src/pages/Login.jsx | component (page) | Moved from `new/`. Username and password inputs replaced with `InputError` (`testId` `username` / `password`). The error `<h3>` with FontAwesome replaced by `ErrorMessage` (text `Epic sadface: <error>`). Submit input replaced by `SubmitButton` (`testId` `login-button`, value `Login`; was `LOGIN`). `location` is destructured from props. |
| src/pages/Login.css | style | Moved and modified. |
| src/pages/__tests__/Login.tests.js (+ `.snap`) | test | Added. |

### Cart and checkout pages

| File | Category | What changed |
|------|----------|--------------|
| src/pages/Cart.jsx | component (page) | Moved from `new/`. Title now via `HeaderContainer secondaryTitle="Your Cart"` (the `subheader` div is removed). "Continue Shopping" and "Checkout" links replaced by `Button` (`testId` `continue-shopping` / `checkout`; label `Checkout` instead of `CHECKOUT`). |
| src/pages/Cart.css | style | Moved and modified (59% similar). |
| src/pages/CheckOutStepOne.jsx | component (page) | Moved from `new/`. Inputs replaced by `InputError` (`testId` `firstName` / `lastName` / `postalCode`). Error block replaced by `ErrorMessage` (`Error: <error>`). Cancel link replaced by `Button` (`testId` `cancel`, label `Cancel`). Submit replaced by `SubmitButton` (`testId` `continue`, value `Continue`; was `CONTINUE`). FontAwesome imports removed. |
| src/pages/CheckOutStepOne.css | style | Added (new at the new path). |
| src/pages/CheckOutStepTwo.jsx / .css | component (page) / style | Moved from `new/` (79% similar for the JSX; the CSS is identical). |
| src/pages/Finish.jsx / .css | component (page) / style | Moved from `new/` (92% similar for the JSX; the CSS is identical). |
| src/components/CartItem.jsx / .css | component / style | Moved from `new/` (82% similar for the JSX). |
| src/components/SummaryItem.jsx / .css, Footer.jsx / .css, PrivateRoute.jsx | component / style | Moved from `new/` (Footer.css 97% similar, the others identical). |

### App entry, utilities, shared tests

| File | Category | What changed |
|------|----------|--------------|
| src/index.jsx | other (entry) | Moved from `new/src/index.jsx` (97% similar). |
| src/index.css | style | Added. |
| src/setupTests.js | config (test setup) | Moved from `new/` (66% similar). 9 lines. |
| src/utils/Constants.js, Credentials.js, Sorting.js | utility | Moved from `new/src/utils/` (identical). |
| src/utils/shopping-cart.js | utility | Moved from `src/js/components/shopping-cart.js`. 8 added / 9 removed lines. |
| src/utils/__mocks__/fileMock.js | test (mock) | Added. Used by the jest `moduleNameMapper` for jpg / png / svg. |
| src/utils/__tests__/Credentials.tests.js, Sorting.tests.js, `__snapshots__/Sorting.tests.js.snap` | test | Moved from `new/` and renamed (`*.test.js` to `*.tests.js`). |

### Storybook

| File | Category | What changed |
|------|----------|--------------|
| .storybook/main.js, .storybook/preview.js | config | Added Storybook config. |
| src/storybook/stories/Button, ErrorMessage, HeaderContainer, InputError, InventoryListItem, SubmitButton `.stories.js` (6 files) | other (stories) | Added stories for the new components. |
| src/storybook/stories/Introduction.stories.mdx, Page.js, Page.stories.js, page.css | other (stories) | Added (Storybook sample files). |
| src/storybook/stories/assets/*.svg (8 files) | other (assets) | Added Storybook sample SVGs. |
| public/storybook/* (26 files) | other (built assets) | Moved from `new/public/storybook/` (built Storybook output). One bundle is 99% similar; the rest are identical. |

### Assets

| File | Category | What changed |
|------|----------|--------------|
| src/assets/img/* (23 images) | other (assets) | Moved from `src/img/` and `new/src/assets/img/`. `close.png` is new. |
| src/assets/svg/* (7 files: arrow3x, cart3x, close@3x, filter3x, headerBot3x, logo3x, menu3x) | other (assets) | Added. |
| src/img/* (17 files, including cart.png) | other (assets) | Deleted (legacy location). |

### Public folder (static files and built output)

| File | Category | What changed |
|------|----------|--------------|
| public/index.html | config | Moved from `new/public/index.html` (99% similar). |
| public/404.html | other | Moved from `src/404.html` (97% similar). |
| public/manifest.json, robots.txt, favicon.ico, icon/* (13 icons) | other (assets) | Moved from `new/public/` (identical). |
| public/v1/*.html (index, inventory, inventory-item, cart, checkout-step-one, checkout-step-two, checkout-complete) | other (built HTML) | Moved from `new/public/v1/` (identical). |
| public/v1/main.js | other (built JS) | Moved from `new/public/v1/main.js` (89% similar). |
| public/v1/css/sample-app-web.css | style | Moved from `new/public/v1/css/` (97% similar). |
| public/v1/img/* (17 files) | other (assets) | Moved from `new/public/v1/img/` (identical). |
| public/v1/new/* (41 files: asset-manifest, index.html, manifest, robots, favicon, icon/*, static/css, static/js incl. `.map`, static/media) | other (built output) | Moved from `new/public/v1/new/` (identical). `public/v1/new/404.html` comes from `new/public/404.html`. |

### Removed legacy app (root)

| File | Category | What changed |
|------|----------|--------------|
| src/index.ejs, inventory.ejs, inventory-item.ejs, cart.ejs, checkout-step-one.ejs, checkout-step-two.ejs, checkout-complete.ejs | other (templates) | Deleted EJS templates. |
| src/index.js | other (entry) | Deleted legacy entry (17 lines). |
| src/js/components/ cart-contents, checkout-info, checkout-summary, credentials, header-cart-button, header-menu-button, inventory-item, inventory-list, login-controls (9 files) | component | Deleted legacy vanilla JS components. (`shopping-cart.js` moved to `src/utils/`; `src/js/data/inventory-data.js` moved to `src/utils/InventoryData.js`.) |
| src/css/sample-app-web.css | style | Deleted legacy stylesheet (679 lines). |
| webpack.config.js, scripts/createServeFile.js, yarn.lock | config | Deleted. |
| .babelrc | config | Deleted. |

### Removed `new/` folder (39 files)

| File | Category | What changed |
|------|----------|--------------|
| new/.gitignore, README.md, babel.config.js, package.json, yarn.lock, scripts/postbuild.sh | config | Deleted. |
| new/src/components/HeaderCartButton.css, HeaderContainer.css/.jsx, InventoryListItem.css/.jsx; new/src/index.css; new/src/pages/CheckOutStepOne.css, InventoryItem.css/.jsx | component / style | Deleted. Their replacements are added at `src/` (see the sections above). |
| new/public/v1/new/404.html | other | Deleted. |
| new/test/e2e/** (configs x4, helpers, page-objects x9, specs x8) | test | Deleted. The root `test/e2e/` is kept. |

### Config, CI, docs

| File | Category | What changed |
|------|----------|--------------|
| package.json | config | Version 1.0.0 to 2.0.0; `homepage` set to `https://www.saucedemo.com`; `private: true`. Dependencies are now React 17, react-scripts 4.0.1, react-router-dom 5, react-burger-menu, FontAwesome, testing-library, husky, lint-staged, prettier. Dev deps are Storybook 6, enzyme, enzyme-to-json. Scripts: `start` / `build` / `test` now use react-scripts; added `test.coverage*`, `test.lint`, `storybook`, `build-storybook`; removed `serve`, webpack scripts. Added `browserslist`, `jest` (coverage threshold 20%, `moduleNameMapper` for jpg / png / svg, enzyme-to-json serializer), `eslintConfig`, husky pre-push hook. Webpack, babel-loader, html-loader and the legacy dependencies removed. |
| package-lock.json | config | Updated (dependency lock for the new `package.json`). |
| babel.config.js | config | 1 line changed. |
| .env | config | Moved from `new/.env` (identical). |
| .gitignore | config | 18 added / 4 removed lines. |
| .github/workflows/github-pages.yml, node.js.yml | CI config | Modified (5+/13- and 11+/15- lines). |
| Jenkinsfile | CI config | 2 lines changed. |
| README.md | docs | 12 added / 58 removed lines. |

### End-to-end tests (root `test/e2e/`)

| File | Category | What changed |
|------|----------|--------------|
| test/e2e/helpers/index.js | test (helper) | `setTestContext`: the user is now set through `document.cookie="session-username=..."` (was `sessionStorage`). The cart is stored in `localStorage` (was `sessionStorage`). Before setting the context: `browser.deleteAllCookies()`, `localStorage.clear()`, and `browser.pause(1000)`. Added Sauce context log markers. |
| test/e2e/specs/login.spec.js | test | `beforeEach` now loads the URL, clears cookies and `localStorage`, then reloads. |
| test/e2e/configs/wdio.shared.conf.js | test (config) | `maxInstances` 100 to 20; indentation changed to 2 spaces; trailing comma added. |
| test/e2e/configs/wdio.local.chrome.conf.js | test (config) | 1 line changed. |
| test/e2e/configs/wdio.saucelabs.conf.js | test (config) | 3 added / 15 removed lines. |

## File counts

- Total changed files in the PR: 324 (git).
- Bulk groups (built `public/` output, images, SVGs, deleted `new/` and legacy files, story assets) are listed by folder with counts. All source, test, style and config files are listed by path or by name pattern.
