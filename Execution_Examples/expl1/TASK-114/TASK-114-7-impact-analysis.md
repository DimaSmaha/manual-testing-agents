# TASK-114 - Impact analysis

Inputs: .workflow-artifacts/TASK-114/TASK-114-4-test-cases.md, .workflow-artifacts/TASK-114/TASK-114-5-pr-summary.md, .workflow-artifacts/TASK-114/TASK-114-6-code-review.md
PR: https://github.com/saucelabs/sample-app-web/pull/52
Base (commit before the PR): a25eedbb183b46f1fe8758296fe97e2306023ff7
Head (PR head): c010ac2e4134fe525285e0fe0b1518b494466405
Generated: 2026-11-05
Code access: `gh` CLI is not installed. With the user's explicit one-off approval, a read-only local clone was used (`.workflow-artifacts/clone/sample-app-web`, PR head = branch `pr-52`). Files were read only at BASE and HEAD through `git show`, `git ls-tree`, `git grep` and `git diff`.

## Impact map

| ID | Tier | Module | Contract change (BASE → HEAD) | Dependents |
|----|------|--------|-------------------------------|------------|
| IMP-1 | Risk Areas | Markup / selector contract of all app pages: `src/pages/*.jsx`, `src/components/{Button,InputError,ErrorMessage,SubmitButton,CartItem,SummaryItem,DrawerMenu,HeaderContainer}.jsx` | Legacy EJS + vanilla React markup (`src/js/components/*`, `src/*.ejs`) replaced by React components. Ids, classes and `data-test` attributes are now produced by `Button` / `InputError` / `SubmitButton` / `ErrorMessage` (`testId` sets `id`, `name`, `data-test`; `customClass` keeps the legacy class names). | `test/e2e/page-objects/{LoginPage,SwagOverviewPage,SwagDetailsPage,AppHeaderPage,CartSummaryPage,CheckoutPersonalInfoPage,CheckoutSummaryPage,CheckoutCompletePage,MenuPage}.js` (unchanged) |
| IMP-2 | Risk Areas | Session and cart storage: `src/utils/Credentials.js`, `src/utils/shopping-cart.js` | `sessionStorage` keys `session-username` and `cart-contents` → cookie `session-username` (js-cookie) and `localStorage` key `cart-contents`. | `test/e2e/specs/{cart.summary,checkout.complete,checkout.personal.info,checkout.summary,menu,swag.item.details,swag.items.list}.spec.js` (unchanged; they set state only through `setTestContext` in `test/e2e/helpers/index.js`, which the PR changed) |
| IMP-3 | Risk Areas | Routes, product ids, users: `src/utils/Constants.js`, `src/utils/InventoryData.js` | Moved from the legacy `src/js/data/inventory-data.js` and the `new/` app. `ROUTES` (`/inventory.html`, `/inventory-item.html?id=N`, `/cart.html`, `/checkout-*.html`), ids 0–5, `VALID_USERNAMES`, `VALID_PASSWORD` now live in `Constants.js`. | `test/e2e/configs/e2eConstants.js` (unchanged) |
| IMP-4 | Risk Areas | `package.json` scripts and build output | Removed `serve` and the webpack `build` (output `dist`). `build` is now `react-scripts build`; `start` is `react-scripts start`. Added `test.coverage`, `storybook`. `scripts/createServeFile.js`, `webpack.config.js` and `new/scripts/postbuild.sh` deleted. | `.github/workflows/node.js.yml`, `Jenkinsfile`, `.github/workflows/github-pages.yml` (all three also changed by the PR, none covered by a test case) |
| IMP-5 | Direct Impact | `src/utils/shopping-cart.js` (`ShoppingCart`) | Moved from `src/js/components/shopping-cart.js`; same static API (`addItem`, `removeItem`, `isItemInCart`, `getCartContents`, `setCartContents`, `resetCart`, `registerCartListener`); storage changed to `localStorage`. | `src/components/CartItem.jsx`, `src/components/DrawerMenu.jsx`, `src/pages/CheckOutStepTwo.jsx` (not covered by a test case; the other consumers are covered by TC-REQ-7 to TC-REQ-14) |
| IMP-6 | Direct Impact | `src/components/HeaderContainer.jsx` | New component with props `secondaryTitle`, `secondaryLeftComponent`, `secondaryRightComponent`, `secondaryHeaderBot`, `customClass`; replaces the old header + separate `.subheader` div. | `src/pages/Cart.jsx`, `src/pages/CheckOutStepOne.jsx`, `src/pages/CheckOutStepTwo.jsx`, `src/pages/Finish.jsx` |
| IMP-7 | Direct Impact | `src/components/Button.jsx`, `InputError.jsx`, `SubmitButton.jsx`, `ErrorMessage.jsx` | New components with required props (`Button`: `label`, `onClick`; `InputError`: `isError`, `onChange`; `SubmitButton`: `value`; `ErrorMessage`: `isError`, `errorMessage`, `onClick`) and exported enums `BUTTON_TYPES`, `BUTTON_SIZES`, `INPUT_TYPES`. | `src/pages/Cart.jsx`, `src/pages/CheckOutStepOne.jsx`, `src/pages/CheckOutStepTwo.jsx`, `src/components/CartItem.jsx` |
| IMP-8 | Dependent Modules | `test/e2e/specs/*.spec.js` (7 unchanged files) | The flows the specs drive (navigation, add/remove, errors, menu) now run on the new React pages (IMP-1, IMP-2, IMP-3). | The 7 spec files themselves |
| IMP-9 | Low risk | Static and built output moved by the PR: `public/v1/**`, `public/v1/new/**`, `public/storybook/**` | Moved from `new/public/**` (R100, identical content) and `src/` (404.html, 97% similar). Not edited. | Files inside the same folders (relative and absolute asset URLs) |
| IMP-10 | Low risk | Storybook config and stories: `.storybook/*`, `src/storybook/stories/*` | Added by the PR; consume the new component props. | Stories for `Button`, `ErrorMessage`, `HeaderContainer`, `InputError`, `InventoryListItem`, `SubmitButton` |
| IMP-11 | Low risk | `.github/CODEOWNERS` | Not changed. | — |

## Results

| ID | Dependent module | Check | Status | Linked TC / review row |
|----|------------------|-------|--------|------------------------|
| IMP-1 | test/e2e/page-objects/LoginPage.js | Selectors `#login_button_container`, `#user-name`, `#password`, `.btn_action`, `[data-test="error"]` exist at HEAD: Login.jsx `id="user-name"` passed through `InputError` props; `testId="password"` gives `id="password"`; `SubmitButton customClass="btn_action"`; `ErrorMessage` renders `<h3 data-test="error">`. | PASS | — |
| IMP-1 | test/e2e/page-objects/SwagOverviewPage.js | `.inventory_list`, `.inventory_item`, `.inventory_item_name` exist in Inventory.jsx / InventoryListItem.jsx; `Button type=PRIMARY/SECONDARY customClass="btn_inventory"` renders `.btn_primary.btn_inventory` and `.btn_secondary.btn_inventory`. | PASS | TC-REQ-1.1, TC-REQ-14a.1, TC-REQ-14a.2 |
| IMP-1 | test/e2e/page-objects/SwagDetailsPage.js | `.inventory_details`, `.inventory_details_name`, `.inventory_details_desc`, `.inventory_details_price`, `.inventory_details_back_button` and the two `btn_inventory` buttons exist in InventoryItem.jsx. | PASS | TC-REQ-2.1, TC-REQ-7.1, TC-REQ-8.1, TC-REQ-8.2, TC-REQ-10.1, TC-REQ-14b.1 |
| IMP-1 | test/e2e/page-objects/AppHeaderPage.js | `.shopping_cart_link` is rendered by `CartButton` in `HeaderContainer` on every page; its text is the badge count, and empty when the cart is empty (`cartBadge = ""`). | PASS | TC-REQ-11.1, TC-REQ-11.2 |
| IMP-1 | test/e2e/page-objects/CartSummaryPage.js | `#cart_contents_container`, `.checkout_button`, `.cart_item`, `.btn_secondary.cart_button` exist in Cart.jsx / CartItem.jsx. `$('.btn_secondary')` (continue shopping) matches the first `.btn_secondary` in the DOM; Remove buttons precede the footer both at BASE (`cart-contents.js` line 48) and at HEAD, so the behavior is unchanged. | PASS | TC-REQ-7.1 |
| IMP-1 | test/e2e/page-objects/CheckoutPersonalInfoPage.js | `#checkout_info_container`, `.cart_cancel_link`, `.cart_button`, `[data-test="firstName"]`, `[data-test="lastName"]`, `[data-test="postalCode"]`, `[data-test="error"]` exist in CheckOutStepOne.jsx (`InputError testId`, `Button customClass="cart_cancel_link"`, `SubmitButton customClass="... cart_button ..."`). | PASS | — |
| IMP-1 | test/e2e/page-objects/CheckoutSummaryPage.js | `#checkout_summary_container`, `.cart_cancel_link`, `.cart_button` (Finish), `.cart_item`, `.inventory_item_name`, `.inventory_item_desc`, `.inventory_item_price` exist in CheckOutStepTwo.jsx / SummaryItem.jsx. | PASS | — |
| IMP-1 | test/e2e/page-objects/CheckoutCompletePage.js | `#checkout_complete_container` exists in Finish.jsx line 14. | PASS | — |
| IMP-1 | test/e2e/page-objects/MenuPage.js | Ids `#inventory_sidebar_link`, `#about_sidebar_link`, `#logout_sidebar_link`, `#reset_sidebar_link` exist in DrawerMenu.jsx lines 29, 40, 51, 63. `.bm-burger-button` is generated inside the `react-burger-menu` library (`slide as Menu` with `customBurgerIcon`), so it cannot be confirmed from the repository code. | QA | — |
| IMP-2 | test/e2e/specs/{cart.summary, checkout.complete, checkout.personal.info, checkout.summary, menu, swag.item.details, swag.items.list}.spec.js | The specs never touch storage directly (`git grep` finds storage access only in `helpers/index.js` and `login.spec.js`). The helper writes cookie `session-username` (matches `SESSION_USERNAME`, read by `Cookies.get` in Credentials.js) and `localStorage` `cart-contents` as a JSON array of numeric ids (matches `shopping-cart.js` lines 39 and 53 and the numeric ids in `InventoryData`). `setTestContext({user, path, products})` signature is unchanged. | PASS | TC-REQ-10.1, TC-REQ-14a.1 |
| IMP-3 | test/e2e/configs/e2eConstants.js (`PAGES`) | All seven paths equal `ROUTES` in Constants.js (`SWAG_DETAILS` = `/inventory-item.html`, `SWAG_ITEMS` = `/inventory.html`, `LOGIN` `''` = `/`). | PASS | TC-REQ-12.1 |
| IMP-3 | test/e2e/configs/e2eConstants.js (`PRODUCTS`) | `PRODUCTS` values 0–5 equal the ids 0–5 in `InventoryData`; the details page indexes `InventoryData[id]`, so `?id=4` is the Backpack. | PASS | TC-REQ-12.1 |
| IMP-3 | test/e2e/configs/e2eConstants.js (`LOGIN_USERS`, `PERSONAL_INFO`) | Usernames and password equal `VALID_USERNAMES` / `VALID_PASSWORD`; `NO_POSTAL_CODE` reaches the "Postal Code is required" branch in CheckOutStepOne.jsx line 47. | PASS | — |
| IMP-4 | .github/workflows/node.js.yml | The scripts it calls (`npm run start`, `npm run test.coverage`, `npm run test.e2e.sauce.us`, lines 29, 33, 41) exist in package.json at HEAD. | PASS | — |
| IMP-4 | Jenkinsfile | Line 16 calls `npx start`, line 22 calls `npx run test.e2e.sauce.eu`; at BASE they were `npm run serve` and `npm run test.e2e.sauce.eu`. `serve` was removed from package.json. `npx start` / `npx run` do not run package scripts, so the Jenkins stages may not start the app or run the e2e script. Not covered by a test case and no declared contract, so not marked FAIL. | QA | — |
| IMP-4 | .github/workflows/github-pages.yml | Line 33 `publish_dir: ./public`; the step before runs `npm run build` (`react-scripts build`), whose output is `build/` (`.gitignore` line 12 ignores `/build`); at BASE the publish dir was `./dist`. `./public` is the source folder, so the deployed site may not be the built app. Not covered by a test case and no declared contract, so not marked FAIL. | QA | — |
| IMP-5 | src/components/CartItem.jsx | Uses `ShoppingCart.removeItem`; it exists, writes `cart-contents` and notifies listeners (so the header badge updates). Item ids come from `InventoryData`. | PASS | TC-REQ-7.1 |
| IMP-5 | src/components/DrawerMenu.jsx | Uses `ShoppingCart.resetCart` (exists, removes `cart-contents`, notifies listeners) and `removeCredentials` (removes the cookie). | PASS | — |
| IMP-5 | src/pages/CheckOutStepTwo.jsx | Uses `getCartContents` and `resetCart`; `InventoryData[id].price` matches the numeric id array. | PASS | — |
| IMP-6 | src/pages/Cart.jsx, CheckOutStepOne.jsx, CheckOutStepTwo.jsx, Finish.jsx | All four call `<HeaderContainer secondaryTitle="...">` with the new prop; no leftover `.subheader` div or props from the old component. | PASS | TC-REQ-13.1 (QA in the code review) |
| IMP-7 | src/pages/Cart.jsx, CheckOutStepOne.jsx, CheckOutStepTwo.jsx, src/components/CartItem.jsx | `Button` gets `label`, `onClick`, `type` and `size` from the exported enums; `InputError` gets `isError={Boolean(error)}` and `onChange`; `SubmitButton` gets `value`; `ErrorMessage` gets `isError`, `errorMessage`, `onClick`. All required props are passed. | PASS | — |
| IMP-8 | test/e2e/specs/cart.summary.spec.js | Continue shopping → `ROUTES.INVENTORY`; checkout → `CHECKOUT_STEP_ONE`; Remove (`CartItem.removeFromCart`) → badge `''` via the cart listener and `.cart_item` count 0 (`removed_cart_item` is rendered instead). | PASS | TC-REQ-7.1 |
| IMP-8 | test/e2e/specs/checkout.complete.spec.js | Route `/checkout-complete.html` renders Finish with `#checkout_complete_container`. | PASS | — |
| IMP-8 | test/e2e/specs/checkout.personal.info.spec.js | Error text `Error: Postal Code is required` = `ErrorMessage` prefix `Error: ` + CheckOutStepOne.jsx line 48; Cancel → `ROUTES.CART`; Continue → `CHECKOUT_STEP_TWO` (line 52). | PASS | — |
| IMP-8 | test/e2e/specs/checkout.summary.spec.js | Finish → `clearCart()` then `CHECKOUT_COMPLETE` (CheckOutStepTwo.jsx lines 82–85); Cancel → `ROUTES.INVENTORY` (line 73); one `.cart_item` per cart id (SummaryItem). | PASS | — |
| IMP-8 | test/e2e/specs/menu.spec.js | App side confirmed (All Items → inventory, Logout → login, Reset → empty badge). The first step of every test clicks `.bm-burger-button`, which is created by the library (see IMP-1 MenuPage.js), so the flow cannot be confirmed from the code. | QA | — |
| IMP-8 | test/e2e/specs/swag.item.details.spec.js | The spec loads `/inventory-item.html?id=4` with a full page load (`browser.url`). InventoryItem reads `window.location.search` and id 4 is the Backpack, but a direct load depends on the server serving `index.html` for that path, which is not visible in the code. | QA | TC-REQ-12.3 (QA in the code review) |
| IMP-8 | test/e2e/specs/swag.items.list.spec.js | Six `.inventory_item` elements (six entries in `InventoryData`); `.inventory_item_name` click opens details and the details text contains the name; add/remove update the badge; `.shopping_cart_link` click goes to `ROUTES.CART`. | PASS | TC-REQ-1.1, TC-REQ-3.1, TC-REQ-14a.1 |
| IMP-9 | public/v1/**, public/v1/new/**, public/storybook/** | Content is identical to BASE (R100) and moved together, but the built pages reference absolute URLs (for example `/new/static/...` in `public/v1/new/index.html`), so whether they resolve depends on where the site is served from. Not verifiable from the code. | QA | — |
| IMP-10 | .storybook/*, src/storybook/stories/* | Stories pass props to the new components; they are not covered by a test case and can only be checked by running Storybook. | QA | — |
| IMP-11 | .github/CODEOWNERS | Not changed by the PR; contains a single wildcard rule and no reference to any changed path or contract. | N/A | — |

## Findings

### N/A: IMP-11 — .github/CODEOWNERS

- **File:** .github/CODEOWNERS, line 1
- **Reason:** The file has a single wildcard rule (`*` with two owners) and no path, script, selector or storage key that the PR changes. The contract change does not reach it.

## Retest in stage 8

Browser checks against the live app only. QA and N/A results about code, CI, build output and Storybook (IMP-4, IMP-9, IMP-10, IMP-11) are not retested in stage 8. Steps and Expected come from the dependent's own spec or finding.

| ID | Status | Page | Precondition | Steps | Expected | Linked TC / review row |
|----|--------|------|--------------|-------|----------|------------------------|
| IMP-1 | QA | `/cart.html` (any logged-in page with the header) | Logged in as the standard user; Backpack (id 4) in the cart | 1) Open the page. 2) Look for the burger menu button in the header. 3) Click it. | The menu opens and shows the links All Items, About, Logout and Reset App State (`#inventory_sidebar_link`, `#about_sidebar_link`, `#logout_sidebar_link`, `#reset_sidebar_link`). | — |
| IMP-8 | QA | `/cart.html` | Logged in as the standard user; Backpack (id 4) in the cart | 1) Open the page. 2) Open the burger menu. 3) Click Reset App State. 4) Open the burger menu, click All Items. 5) Go to the cart page again, open the burger menu, click Logout. | Step 3: the cart badge is empty (it was 1). Step 4: the inventory page is shown. Step 5: the login page is shown. | — |
| IMP-8 | QA | `/inventory-item.html?id=4` (opened directly) | Logged in as the standard user, on `/inventory.html` | 1) Type `/inventory-item.html?id=4` in the address bar and load it (full page load, not a click). 2) Check the cart badge. 3) Click Add to cart. 4) Click Remove. 5) Click Back. | Step 1: the Backpack details page is shown (not a 404). Step 2: the badge is empty. Step 3: the badge shows 1. Step 4: the badge is empty. Step 5: the inventory page is shown. | TC-REQ-12.3 |

---

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 23    |
| FAIL   | 0     |
| QA     | 7     |
| N/A    | 1     |
| Total  | 31    |

| Tier | Impact-map items |
|------|------------------|
| Risk Areas | 4 |
| Direct Impact | 3 |
| Dependent Modules | 1 |
| Low risk | 3 |
