// Import some things we need.
var { ExtensionCommon } = ChromeUtils.import(
  "resource://gre/modules/ExtensionCommon.jsm"
);
var { ExtensionSupport } = ChromeUtils.import(
  "resource:///modules/ExtensionSupport.jsm"
);
var { ExtensionUtils } = ChromeUtils.import(
  "resource://gre/modules/ExtensionUtils.jsm"
);
var { ExtensionError } = ExtensionUtils;

var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
var env = Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);
var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
  .createInstance(Ci.nsIScriptableUnicodeConverter);
converter.charset = "UTF-8";

var APPNAME_WIN = "thunderbird.exe";
var APPNAME_MAC = "thunderbird-bin";
var APPNAME_LINUX = "thunderbird";
var APPNAME_SH = "thunderbird.sh";
var APPNAME_DEBIAN = "/usr/bin/icedove";

function getOS() {
  return navigator.platform.toLowerCase();
}

function quitPrompt(prof, extension) {
  let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
  let position = prefs.getIntPref("extensions.profileswitcher.prompt.buttons_position");
  let flags, text;

  if (getOS().indexOf("win") > -1) {
    position = (position == 0) ? 1 : 0;
  }
  if (position == 0) {
    flags = promptService.BUTTON_TITLE_YES * promptService.BUTTON_POS_0 +
      promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_2 +
      promptService.BUTTON_TITLE_NO * promptService.BUTTON_POS_1;
  } else {
    flags = promptService.BUTTON_TITLE_YES * promptService.BUTTON_POS_1 +
      promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_2 +
      promptService.BUTTON_TITLE_NO * promptService.BUTTON_POS_0;
  }

  if (prof && prof != "§") {
    text = extension.localeData.localizeMessage("quityesno").replace("%s", prof);
  } else {
    text = extension.localeData.localizeMessage("quityesno2");
  }

  let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");
  let quit = promptService.confirmEx(mainWindow, extension.localeData.localizeMessage("quittitle"), text, flags, null, null, null, null, {});
  if (position == 1 && quit == 0) {
    quit = 1;
  } else if (position == 1 && quit == 1) {
    quit = 0;
  }

  return quit;
}

function getExecFile(extension) {
  // Try first to load the custom path
  try {
    let execFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    var customPath = prefs.getStringPref("extensions.profileswitcher.executable_custom_path");
    execFile.initWithPath(customPath);
    if (execFile.exists()) {
      return execFile;
    }
  } catch (e) { }

  // 1st method of auto-detection of executable file
  try {
    let execFile = Cc["@mozilla.org/file/directory_service;1"]
      .getService(Ci.nsIProperties)
      .get("XREExeF", Ci.nsIFile);
    if (execFile.exists()) {
      return execFile;
    }
  } catch (e) { }

  // 2nd method of auto-detection of executable file
  let execFile = Cc["@mozilla.org/file/directory_service;1"]
    .getService(Ci.nsIProperties)
    .get("CurProcD", Ci.nsIFile);

  if (getOS().indexOf("win") > -1) {
    execFile.append(APPNAME_WIN);
  } else if (getOS().indexOf("linux") > -1) {
    execFile.append(APPNAME_LINUX);
    if (execFile.exists()) {
      return execFile;
    }

    let shFile = execFile.parent;
    shFile.append(APPNAME_SH);
    if (shFile.exists()) {
      return shFile;
    }

    // Debian uses "iceweasel", but it is located in /usr/bin
    let debianFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    debianFile.initWithPath(APPNAME_DEBIAN);
    if (debianFile.exists()) {
      return debianFile;
    }
  } else if (getOS().indexOf("mac") > -1) {
    execFile.append(APPNAME_MAC);
  }

  if (execFile && execFile.exists()) {
    return execFile;
  }

  alert(extension.localeData.localizeMessage("noexecfile"));
  return null;
}

function file2array(profilesINI) {
  if (!profilesINI) {
    return null;
  }

  var linesArr = [];
  var istream = Cc["@mozilla.org/network/file-input-stream;1"]
    .createInstance(Ci.nsIFileInputStream);
  istream.init(profilesINI, 0x01, 0o444, 0);
  istream.QueryInterface(Ci.nsILineInputStream);
  var line = {}, hasmore;
  do {
    hasmore = istream.readLine(line);
    linesArr.push(line.value);
  } while (hasmore);
  istream.close();
  return linesArr;
}

function convert(str) {
  var newstr;
  try {
    var uConv = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
      .createInstance(Ci.nsIScriptableUnicodeConverter);
    uConv.charset = prefs.getCharPref("extensions.profileswitcher.arguments_charset");
    newstr = uConv.ConvertFromUnicode(str);
  }
  catch (e) {
    newstr = str;
  }
  return newstr;
}

function confirmSafeMode(extension) {
  let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");
  return mainWindow.confirm(extension.localeData.localizeMessage("confirmSafeMode"));
}

var ProfileLauncher = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    let { extension } = context;

    return {
      ProfileLauncher: {
        // Open About Profiles in a new tab.
        openAboutProfiles(windowId) {
          let { window } = extension.windowManager.get(windowId);
          window.openContentTab("about:profiles");
        },

        openOptions: function () {
          let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");
          mainWindow.open("chrome://profilelauncher/content/settings.xhtml", "", "chrome=yes,modal=yes,centerscreen=yes");
        },

        resetMozNoRemote() {
          if (env.get("MOZ_NO_REMOTE"))
            env.set("MOZ_NO_REMOTE", "");
        },

        restartWithLog: function () {
          let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");
          let param = {};
          param.abort = true;
          mainWindow.openDialog("chrome://profilelauncher/content/logDialog.xhtml", "", "chrome,modal,centerscreen", param);
          if (param.abort)
            return;
          let type = "";
          if (param.pop3)
            type += "POP3:5,";
          if (param.imap)
            type += "IMAP:5,";
          if (param.smtp)
            type += "SMTP:5";
          env.set("NSPR_LOG_MODULES", type);
          env.set("NSPR_LOG_FILE", param.file);
          let appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
          mainWindow.setTimeout(function () {
            appStartup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit);
          }, 500);
        },

        // Supported options:
        //  profileManager: safemode or normalmode
        //  profile: profile name
        runExec: function (options) {
          let execFile = getExecFile(extension);
          if (!execFile)
            return;

          let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");
          let closeBeforeLaunch = prefs.getIntPref("extensions.profileswitcher.close_before_launch");
          let safemode = options?.profileManager == "safemode";
          let profileManager = !!options?.profileManager
          let profile;

          if (profileManager) {
            profile = "§";
          } else if (options?.profile) {
            // Here it's used the native-charset profile's name,
            // because the Unicode one will not work
            profile = options?.profile;
            // Remove the "#. " part of the label
            // prof = prof.replace(/\d+. /, "");
          } else {
            return;
          }

          if (profile && prefs.getCharPref("extensions.profileswitcher.arguments_charset"))
            profile = convert(profile);

          let quit;
          if (safemode) {
            if (!confirmSafeMode(extension)) {
              return;
            }
            quit = true;
          } else if (closeBeforeLaunch == 2) {
            var button = quitPrompt(profile, extension);
            if (button == 2) {
              return;
            } else if (button == 0) {
              quit = true;
            } else {
              quit = false;
            }
          } else if (closeBeforeLaunch == 1) {
            quit = true;
          } else {
            quit = false;
          }

          let args = new Array;
          args.push("-P");
          args.push(profile);
          if (prefs.getBoolPref("extensions.profileswitcher.enable_new_instance"))
            args.push("-new-instance");
          else
            args.push("-no-remote");
          if (safemode)
            args.push("-safe-mode");

          let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
          process.init(execFile);

          if (quit) {
            let quitDelay = 1000;
            // I'm not sure at 100% that this will work also with very slow computer and
            // with very old Firefox/Thunderbird version, so there is a hidden preference
            // to allow the user to use the old (1.1 version and earlier) method
            if (prefs.getBoolPref("extensions.profileswitcher.use_onbeforeunload")) {
              quitDelay = 500;
              mainWindow.addEventListener(
                "unload",
                () => { process.run(false, args, args.length); }
              );
            } else {
              process.run(false, args, args.length);
            }
            mainWindow.setTimeout(function () { mainWindow.close() }, quitDelay);
          } else {
            process.run(false, args, args.length);
          }
        },

        readProfiles: function () {
          let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");

          var isRelative = true;
          var profiles = new Array;
          var profileIdInUse = null;

          var os = mainWindow.navigator.platform.toLowerCase();
          // This is the standard "root" directory where the profiles are
          var filex = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties)
            .get("DefProfRt", Ci.nsIFile);
          // This is the directory of the profile in use
          var profdir = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties)
            .get("ProfD", Ci.nsIFile);
          // Name of the profile in use
          var profdirname = profdir.leafName;
          var profdirfullpath = profdir.path;
          // This regexp is used to test if the line finishes with the profdirname
          var profRegExp = new RegExp(profdirname + "$");
          // Clone of the root profiles directory
          var filex2 = filex.clone();
          // First attempt to find the profiles.ini, in the root profiles directory (Linux style)
          filex2.append("profiles.ini");
          // If the file doesn't exist, we try with the parent directory (Windows, Mac OSX style)
          if (!filex2.exists()) {
            var file = filex.parent;
            file.append("profiles.ini");
          }
          else
            var file = filex2;

          if (file) {
            let lines = file2array(file);
            let currentName, currentPath, currentId;
            for (let i = 0; i < lines.length; i++) {
              let myline = lines[i];

              if (myline && myline.startsWith("[")) {
                if (currentName && currentId != null) {
                  profiles.push({
                    id: currentId,
                    name: currentName,
                    path: currentPath,
                  })
                }
                currentName = "";
                currentPath = "";
                isRelative = true;
                currentId = null;
                if (myline.startsWith("[Profile")) {
                  currentId = parseInt(myline.substring(8, myline.length - 1), 10);
                }
                continue;
              }

              // If we find a line beginning with Name= , we store the profile's name in a temp variable.
              if (myline && myline.startsWith("Name=")) {
                currentName = myline.substring(5);
                continue;
              }

              if (myline && myline.startsWith("IsRelative=")) {
                if (myline.startsWith("IsRelative=0"))
                  isRelative = false;
                else
                  isRelative = true;
                continue;
              }

              if (myline && myline.startsWith("Path=")) {
                currentPath = myline.substring(5);
                try {
                  // I need the line both in native-charset and in Unicode:
                  // the native-charset will be used to launch the command
                  // and the Unicode one to match "profdirfullpath" var
                  var mylineUNICODE = converter.ConvertToUnicode(myline);
                }
                catch (e) {
                  var mylineUNICODE = myline;
                }

                // On Mac the absolute paths are not in plain text, but encoded in base64 with lots of control chars
                // and other strange things ... why??? Who knows it!!!!
                if (os.indexOf("mac") > -1 && !isRelative) {
                  try {
                    var encodedpath = mylineUNICODE.substring(5);
                    // atob = base64 decoder function
                    var decodedpath = atob(encodedpath);
                    // To check in mac absoulte path, we create a regexp with the name of the
                    // profile's directory followed by a control char, in this way we shoul avoid "fake positives"
                    var regex = new RegExp(profdirname + "[\\x00-\\x1F]", "gi");
                    if (decodedpath && regex.test(decodedpath)) {
                      profileIdInUse = currentId;
                    }
                    currentPath = decodedpath;
                  }
                  catch (e) { }
                }
                // Rule for absolute path on Win and Linux: note the here the match is with the full path
                // because otherwise it could fail
                else if (!isRelative && mylineUNICODE == ("Path=" + profdirfullpath)) {
                  profileIdInUse = currentId;
                }
                // Normal case with relative path on every os
                // If the profile's directory is at the end of the line beginning with Path=, we've found the right name
                else if (isRelative && profRegExp.test(mylineUNICODE)) {
                  profileIdInUse = currentId;
                }
              }
            }

            if (currentName) {
              profiles.push({
                id: currentId,
                name: currentName,
                path: currentPath,
              })
            }
          }
          // We keep setting these prefs only for the settings window to be able
          // to access them. Once the settings window is html and can access
          // local storage, this can be removed
          prefs.setCharPref("extensions.profileswitcher.profile.in_use", profiles.find(e => e.id == profileIdInUse).name);
          prefs.setStringPref("extensions.profileswitcher.profiles.list", profiles.map(e => e.name).join(",,,"));
          return { profileIdInUse, profiles };
        }
      }
    };
  }
};
