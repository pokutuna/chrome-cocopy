cocopy
===

![logo](./sozai/img/logo.png)

a chrome extension to copy text by your code.

(In Japanese) コードで(by code) コピー(copy)

## Install

Install from [Chrome Web Store](#)

## Usage

### Execute Function to Copy

- By selecting a function, it runs with the current page content.
- The return value of the function is copied to the clipboard.
- You can use the number keys to select a function.

![run a function to copy](./sozai/img/copy.gif)


### Create & Edit Function

- You can open the options page from the cog icon on the popup and define & edit a function
- The function receives an object having these properties.
  - `title`: same as `document.title`.
  - `url`: same as `location.href`.
  - `content`: same as `document.documentElement.outerHTML`. You can query it using [`DOMParser`](https://developer.mozilla.org/docs/Web/API/DOMParser).
  - `selectingText`: same as `window.getSelection().toString()`.
- The code runs safely under the [sandbox](https://developer.chrome.com/apps/sandboxingEval), not under the page.

![edit a function](./sozai/img/edit.gif)


### Keyboard Shortcut (optional)

Set it up in `chrome://extensions/shortcuts` .

The default suggeste keys to open popup are <kbd>Ctrl+Shift+L</kbd> or <kbd>Cmd+Shift+L</kbd>(Mac). 

Check for the settings conflicts with other extensions if it doesn't work. (e.g. [1Password X](https://chrome.google.com/webstore/detail/1password-x-%E2%80%93-password-ma/aeblfdkhhhdcdjpifhhbdiojplfjncoa))


## Function Gallery

[Go to the gallery](./gallery/README.md) to add more functions and see sample codes.
