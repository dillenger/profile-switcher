const { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");
const extension = ExtensionParent.GlobalManager.getExtension("pswitcher2@dillinger");

var PS_converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
  .createInstance(Ci.nsIScriptableUnicodeConverter);
PS_converter.charset = "UTF-8";

var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
var newInstance;

function getOS () {
  return navigator.platform.toLowerCase();
}

function convToUnicode(str) {
  try {
    str = PS_converter.ConvertToUnicode(str);
  }
  catch (e) { }
  return str;
}

function initPanel() {
  i18n.updateDocument({extension});

  // This replaces ondialogaccept in XUL.
  document.addEventListener("dialogaccept", function () { savePrefs() });

  if (document.getElementById("titlebar"))
    document.getElementById("titlebar").label = extension.localeData.localizeMessage("titleBar");
  var where = prefs.getIntPref("extensions.profileswitcher.where_show_name");
  if (where == 1)
    document.getElementById("titlebar").checked = false;
  else
    document.getElementById("titlebar").checked = true;

  var profile_in_use = prefs.getStringPref("extensions.profileswitcher.profile.in_use","");
  var profilesListPref = prefs.getStringPref("extensions.profileswitcher.profiles.list","");
  var profileButtonLaunch = prefs.getStringPref("extensions.profileswitcher.profile.button_launch","");
  var profilesList = profilesListPref.split(",,,");

  var profilePopup = document.getElementById("profiles");
  var sel = null;
  for (var i = 0; i < profilesList.length; i++) {
    var el = profilePopup.appendItem(convToUnicode(profilesList[i]), profilesList[i]);
    if (profile_in_use == profilesList[i])
      el.setAttribute("disabled", "true");
    else if (profileButtonLaunch == profilesList[i])
      sel = el;
  }
  if (sel)
    profilePopup.selectedItem = sel;
  else if (profileButtonLaunch == "§")
    profilePopup.selectedItem = document.getElementById("pbpm");
  else
    profilePopup.selectedItem = profilePopup.firstChild;

  document.getElementById("actionlist").selectedIndex = prefs.getIntPref("extensions.profileswitcher.close_before_launch");
  document.getElementById("sbpan").checked = prefs.getBoolPref("extensions.profileswitcher.show_statusbar_panel");
  //document.getElementById("tbbutton").checked = prefs.getBoolPref("extensions.profileswitcher.show_toolbar_button");
  document.getElementById("promptpos").selectedIndex = prefs.getIntPref("extensions.profileswitcher.prompt.buttons_position");
  document.getElementById("no_remote").checked = prefs.getBoolPref("extensions.profileswitcher.onload_reset_noremote");
  document.getElementById("colors").selectedIndex = prefs.getIntPref("extensions.profileswitcher.icon_color");
  document.getElementById("sortProfiles").checked = prefs.getBoolPref("extensions.profileswitcher.profiles_sort");

  var shortcut = prefs.getCharPref("extensions.profileswitcher.profile_manager_shortcut");
  if (shortcut.length > 0) {
    var keyPref = shortcut.split(" ");
    document.getElementById("PMkey").value = keyPref.shift();
    var modifiers = keyPref.toString();
    if (modifiers.indexOf("shift") > -1)
      document.getElementById("PMshift").checked = true;
    if (modifiers.indexOf("accel") > -1)
      document.getElementById("PMcontrol").checked = true;
    if (modifiers.indexOf("alt") > -1)
      document.getElementById("PMalt").checked = true;
  }

  document.getElementById("execpath").value = prefs.getStringPref("extensions.profileswitcher.executable_custom_path","");

  if (getOS().indexOf("win") > -1) {
    newInstance = false;
    document.getElementById("new_instance").setAttribute("hidden", "true");
  }
  else {
    newInstance = true;
    document.getElementById("new_instance").checked = prefs.getBoolPref("extensions.profileswitcher.enable_new_instance");
  }
}

async function pickFile(el) {
  let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
  fp.init(window.browsingContext, "", Ci.nsIFilePicker.modeOpen);
  fp.appendFilters(Ci.nsIFilePicker.filterAll);

  let res = await new Promise(resolve => {
    fp.open(resolve);
  })
  if (res == Ci.nsIFilePicker.returnOK) {
    el.previousSibling.value = fp.file.path;
  }
}

function savePrefs() {
  if (newInstance) {
    prefs.setBoolPref("extensions.profileswitcher.enable_new_instance", document.getElementById("new_instance").checked);
  }

  prefs.setBoolPref("extensions.profileswitcher.onload_reset_noremote", document.getElementById("no_remote").checked);
  prefs.setIntPref("extensions.profileswitcher.close_before_launch", document.getElementById("actionlist").selectedItem.value);
  var whereValue = document.getElementById("titlebar").checked;
  if (whereValue)
    prefs.setIntPref("extensions.profileswitcher.where_show_name", 0);
  else
    prefs.setIntPref("extensions.profileswitcher.where_show_name", 1);

  prefs.setBoolPref("extensions.profileswitcher.show_statusbar_panel", document.getElementById("sbpan").checked);
  //prefs.setBoolPref("extensions.profileswitcher.show_toolbar_button", document.getElementById("tbbutton").checked);
  prefs.setBoolPref("extensions.profileswitcher.profiles_sort", document.getElementById("sortProfiles").checked);
  prefs.setIntPref("extensions.profileswitcher.icon_color", document.getElementById("colors").selectedItem.value);
  prefs.setIntPref("extensions.profileswitcher.prompt.buttons_position", document.getElementById("promptpos").selectedItem.value);

  if (document.getElementById("execpath").value.length > 2)
    prefs.setStringPref("extensions.profileswitcher.executable_custom_path", document.getElementById("execpath").value);
  else
    prefs.clearUserPref("extensions.profileswitcher.executable_custom_path");

  var shortcut = document.getElementById("PMkey").value;
  shortcut = shortcut.toUpperCase(); // fix illegal lowercase
  if (shortcut.length > 0) {
    if (document.getElementById("PMshift").checked)
      shortcut = shortcut + " shift";
    if (document.getElementById("PMalt").checked)
      shortcut = shortcut + " alt";
    if (document.getElementById("PMcontrol").checked)
      shortcut = shortcut + " accel";
    prefs.setCharPref("extensions.profileswitcher.profile_manager_shortcut", shortcut);
  } else {
    prefs.setCharPref("extensions.profileswitcher.profile_manager_shortcut", "");
  }

  prefs.setStringPref("extensions.profileswitcher.profile.button_launch", document.getElementById("profiles").selectedItem.value);
  //profileButtonLaunch = PS_converter.ConvertToUnicode(profileButtonLaunch);
}
