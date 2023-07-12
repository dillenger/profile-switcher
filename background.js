// Helper function to walk through a menu data structure and create WebExtension
// menu entries.
async function addMenuEntries(entries, parentId) {
  for (let entry of entries) {
    let config = {
      id: entry.id,
      contexts: ["browser_action_menu", "tools_menu"],
    }
    if (entry.separator) {
      config.type = "separator";
    } else {
      config.title = entry.label || browser.i18n.getMessage(entry.id);
    }
    if (parentId) {
      config.parentId = parentId;
    }
    if (entry.disabled) {
      config.enabled = false;
    }
    await browser.menus.create(config);
    if (entry.subEntries) {
      await addMenuEntries(entry.subEntries, entry.id);
    }
  }
}

// Get current profiles from ini file and update storage/cache.
async function readProfiles() {
  let { profileInUse, profiles } = await browser.ProfileLauncher.readProfiles();
  await browser.storage.local.set({ profileInUse, profiles });
}

// Update the icon of the action button (and the statusbar, if important).
async function updateIcons() {
  // ActionButton
  var actionIcon = `/chrome/content/skin/icons/button${await browser.LegacyPrefs.getPref("extensions.profileswitcher.icon_color")}.png`;
  await browser.browserAction.setIcon({ path: actionIcon });

  // StatusBar
  var statusIcon = `/chrome/content/skin/icons/user${await browser.LegacyPrefs.getPref("extensions.profileswitcher.icon_color")}.png`;
  // TODO
}

// Update the label of the action button (and the statusbar, if important).
async function updateLabels() {
  // Title, now label of button
  var whereShow = await browser.LegacyPrefs.getPref("extensions.profileswitcher.where_show_name");
  if (whereShow == 0) {
    let { profiles, profileInUse } = await browser.storage.local.get({ profiles: [], profileInUse: "" });
    let profile = profiles.find(p => p.id == profileInUse);
    await browser.browserAction.setLabel({ label: profile.name });
  } else {
    await browser.browserAction.setLabel({ label: "" });
  }

  // StatusBar
  // TODO
}

// Remove all extension menu entries and rebuild everything.
async function updateMenuEntries() {
  await browser.menus.removeAll();

  let { profiles, profileInUse } = await browser.storage.local.get({ profiles: [], profileInUse: "" });

  // Rebuild profile menu entries.
  let profileEntries = []
  for (let profile of profiles) {
    profileEntries.push({
      id: `profile-${profile.id}`,
      label: profileInUse == profile.id ? `${profile.name} (${browser.i18n.getMessage("profileinuse")})` : profile.name,
      disabled: profileInUse == profile.id
    })
  }
  profileEntries.push({ id: "sep_profiles", separator: true }, { id: "refresh" });

  // Add the menu to the action button. IDs used in menuData are tried as locale
  // message IDs and will also be used as menu item IDs.
  await addMenuEntries([
    {
      id: "startProf",
      subEntries: profileEntries
    },
    {
      id: "startPM",
      subEntries: [
        {
          id: "normalmode"
        },
        {
          id: "safemode"
        }
      ]
    },
    {
      id: "openAboutProfiles",
    },
    {
      id: "restartWithLog"
    },
    {
      id: "sep_main",
      separator: true
    },
    {
      id: "openOptions"
    }
  ]);
}

// Update the shortcuts of the commands API according to the current pref.
async function updateCommands() {
  let shortcut = await browser.LegacyPrefs.getPref("extensions.profileswitcher.profile_manager_shortcut");
  if (shortcut.length > 0) {
    let keys = shortcut.split(" ");
    let key = keys.shift();

    // Shift may not be on its own.
    if (keys.includes("shift") && !keys.includes("accel") && !keys.includes("alt")) {
      keys.push("alt");
    }

    // Maximum of 2.
    if (keys.includes("shift") && keys.includes("accel") && keys.includes("alt")) {
      keys = keys.filter(e => e != "alt");
    }

    let command = [];
    if (keys.includes("accel")) command.push("Ctrl");
    if (keys.includes("alt")) command.push("Alt");
    if (keys.includes("shift")) command.push("Shift")
    command.push(key);
    await browser.commands.update({
      name: "Profile Manager",
      shortcut: command.join("+")
    })
  }
}

async function init() {
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.close_before_launch", 1);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.where_show_name", 1);
  // User has to use "customize" to remove the button, API cannot hide it.
  //await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.show_toolbar_button", true);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.show_statusbar_panel", true);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.use_onbeforeunload", false);   // Remove ?
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.onload_reset_noremote", true);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.arguments_charset", "");
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.enable_new_instance", false);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.prompt.buttons_position", 0);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.icon_color", 0);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.profile.button_launch", "-");
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.profiles_sort", true);
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.default_profile_name", "");    // Used ?
  await browser.LegacyPrefs.setDefaultPref("extensions.profileswitcher.profile_manager_shortcut", "");

  if (await browser.LegacyPrefs.getPref("extensions.profileswitcher.onload_reset_noremote")) {
    browser.ProfileLauncher.resetMozNoRemote();
  }

  await readProfiles();
  await updateIcons();
  await updateLabels();
  await updateMenuEntries();
  await updateCommands();

  // React to menuitem clicks.
  browser.menus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
      case "normalmode":
        browser.ProfileLauncher.runExec({ profileManager: "normalmode" });
        break;
      case "safemode":
        browser.ProfileLauncher.runExec({ profileManager: "safemode" });
        break;
      case "openAboutProfiles":
        browser.ProfileLauncher.openAboutProfiles(tab.windowId);
        break;
      case "restartWithLog":
        browser.ProfileLauncher.restartWithLog();
        break;
      case "openOptions":
        browser.ProfileLauncher.openOptions();
        break;
      case "refresh":
        updateMenuEntries();
        break;
      default:
        if (info.menuItemId.startsWith("profile-")) {
          let { profiles } = await browser.storage.local.get({ profiles: [] });
          let profileId = info.menuItemId.substring(8);
          let profile = profiles.find(p => p.id == profileId)
          if (profile) {
            browser.ProfileLauncher.runExec({ profile: profile.name });
          }
        }
    }
  })

  // React to changes in the options dialog (or wherever the pref is changed).
  browser.LegacyPrefs.onChanged.addListener((name, value) => {
    switch (name) {
      case "icon_color":
        updateIcons();
        break;
      case "profiles_sort":
        updateMenuEntries();
        break;
      case "profile_manager_shortcut":
        updateCommands();
      case "where_show_name":
        updateLabels();
    }
  }, "extensions.profileswitcher.");

  // TODO - We need this only for the options page and the logDialog, which are still XHTML. 
  //  - Convert settings.xhtml to HTML and use the options_ui manifest entry to hook
  //    it into the add-on manager.
  //  - Keep using LegacyPrefs API to access preferences
  //  - Convert logDialog.xhtml to HTML and use the windows API to open it.
  //  - drop WindowListener API.
  //  - Modify Experiments to accept all used preferences as parameters, so
  //    preferences are only accessed in WebExtension land (using LegacyPrefs API)
  //  - Migrate prefs to local storage.
  //  - Drop LegacyPrefs API.
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
}

init();
