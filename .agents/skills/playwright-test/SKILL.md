---
name: playwright-test
description: >-
  E2E browser testing, automated verification, and UI inspection using Playwright MCP.
  Use when testing web application flows, responsive mobile layouts (390x844),
  interactive stages, taking screenshots, or verifying page behaviors.
---

# Playwright MCP Testing Guide

This skill guides automated end-to-end browser testing and validation using the Playwright MCP server.

## Features & Capabilities

- **Browser Navigation**: Navigate to local dev URLs (e.g. `http://localhost:3000`)
- **Viewport Emulation**: Test mobile-first screens (e.g. 390x844 iPhone viewport)
- **User Interactions**: Click buttons, fill forms, trigger touch/pointer gestures
- **Visual Validation**: Capture full-page or element screenshots
- **State Evaluation**: Execute JavaScript to inspect `localStorage`, `sessionStorage`, and DOM states

## Available Playwright MCP Tools

When the Playwright MCP server is running, the following tools are available:

1. `playwright_navigate`: Open a URL in the browser
   - `url`: Target web address (e.g. `http://localhost:3000`)
2. `playwright_screenshot`: Take a screenshot of the current page or element
   - `name`: File name for the screenshot
   - `selector`: (Optional) CSS selector to capture a specific element
3. `playwright_click`: Click on an element
   - `selector`: CSS or text selector (e.g. `button.wax-seal`, `text=Mở khóa`)
4. `playwright_fill`: Enter text into input fields
   - `selector`: Input field selector
   - `value`: Text to input
5. `playwright_evaluate`: Run JavaScript on the page
   - `script`: JavaScript code string (e.g. `() => document.title`)

## Testing Workflows for this Anniversary App

### 1. Test Gate Stage (Mở khóa)
```javascript
// Navigate to dev server
playwright_navigate({ url: 'http://localhost:3000' })

// Fill anniversary date
playwright_fill({ selector: 'input', value: '20/10/2025' })

// Click unlock
playwright_click({ selector: 'button:has-text("Mở khóa")' })
```

### 2. Test Flipbook Stage (Sách lật 18 trang)
```javascript
// Jump directly to flipbook stage via localStorage
playwright_evaluate({
  script: `
    localStorage.setItem('anniv:v1:progress', JSON.stringify({ index: 5, unlocked: 5 }));
    location.reload();
  `
})

// Hold wax seal to open envelope
// Then flip through sheets 1..18
```
