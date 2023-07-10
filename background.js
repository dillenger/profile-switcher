
async function main() {
  messenger.WindowListener.registerDefaultPrefs("defaults/preferences/defaults.js");

  messenger.WindowListener.registerChromeUrl([
    ["content", "profilelauncher", "chrome/content/"],
    ["locale", "profilelauncher", "en-US", "chrome/locale/en-US/profilelauncher/"],
    ["locale", "profilelauncher", "de", "chrome/locale/de/profilelauncher/"],
    ["locale", "profilelauncher", "fr", "chrome/locale/fr/profilelauncher/"],
    ["locale", "profilelauncher", "hu-HU", "chrome/locale/hu-HU/profilelauncher/"],
    ["locale", "profilelauncher", "it", "chrome/locale/it/profilelauncher/"],
    ["locale", "profilelauncher", "ko-KR", "chrome/locale/ko-KR/profilelauncher/"],
    ["locale", "profilelauncher", "nl", "chrome/locale/nl/profilelauncher/"],
    ["locale", "profilelauncher", "pl", "chrome/locale/pl/profilelauncher/"],
    ["locale", "profilelauncher", "pt-BR", "chrome/locale/pt-BR/profilelauncher/"],
    ["locale", "profilelauncher", "ro", "chrome/locale/ro/profilelauncher/"],
    ["locale", "profilelauncher", "sl-SI", "chrome/locale/sl-SI/profilelauncher/"],
    ["locale", "profilelauncher", "sr", "chrome/locale/sr/profilelauncher/"],
    ["locale", "profilelauncher", "sv-SE", "chrome/locale/sv-SE/profilelauncher/"],
    ["locale", "profilelauncher", "zh-CN", "chrome/locale/zh-CN/profilelauncher/"],
    ["locale", "profilelauncher", "zh-TW", "chrome/locale/zh-TW/profilelauncher/"]
  ]);

  messenger.WindowListener.registerOptionsPage("chrome://profilelauncher/content/settings.xhtml");

  messenger.WindowListener.registerWindow("chrome://messenger/content/messenger.xhtml", "chrome/content/messenger.js");

  messenger.WindowListener.registerWindow("chrome://messenger/content/customizeToolbar.xhtml", "chrome/content/messenger.js");

  messenger.WindowListener.startListening();
}

main();
