/*
  // TODO
  // Do not know what the click event on the folder Tree is supposed to do
  if (document.getElementById("folderTree")) {
    document.getElementById("folderTree").addEventListener("select", profileLauncher.setTitle, true);
  }
  window.addEventListener("DOMTitleChanged", function () { profileLauncher.setTitle() }, true);

  // TODO
  // These functions deal with extra Menu entries in the status bar and the menu bar.
  // The menu bar menu has been moved to the tools menu, because that is supported by WebExtensions

  setLabel: function () {
    var whereShow = prefs.getIntPref("extensions.profileswitcher.where_show_name");
    var sbp = prefs.getBoolPref("extensions.profileswitcher.show_statusbar_panel");
    var tbb = prefs.getBoolPref("extensions.profileswitcher.show_toolbar_button");
    var used_prof = prefs.getStringPref("extensions.profileswitcher.profile.in_use");
    try {
      used_prof = converter.ConvertToUnicode(used_prof);
    }
    catch (e) { }
    var text = "Profile Switcher\n" + bundle.GetStringFromName("profileinuse") + ": " + used_prof;
    try {
      document.getElementById("profSwitcherButtonTB").setAttribute("tooltiptext", text);
    }
    catch (e) { }
    if (whereShow == 0 && document.title.indexOf("[" + used_prof + "] ") < 0)
      document.title = "[" + used_prof + "] " + document.title;
    if (!sbp)
      document.getElementById("profileNameSBP").collapsed = true;
    else {
      document.getElementById("profileNameLabel").value = used_prof;
      document.getElementById("profileNameLabel").style.marginBlock = "2px";
      document.getElementById("profileNameIcon").style.marginBlock = "-3px";
      document.getElementById("profileNameSBP").style.display = "block";
      document.getElementById("profileNameSBP").style.marginBlock = "0px";
      document.getElementById("profileNameSBP").collapsed = false;
      document.getElementById("status-bar").appendChild(document.getElementById("profileNameSBP"));
    }
    if (!tbb)
      document.getElementById("profSwitcherButtonTB").collapsed = true;
    else
      document.getElementById("profSwitcherButtonTB").collapsed = false;
    var hideMenus = prefs.getBoolPref("extensions.profileswitcher.hide_menus");
    document.getElementById("MFP_PSmenu1").collapsed = hideMenus;
    document.getElementById("MFP_PSmenu2").collapsed = hideMenus;
    document.getElementById("MFP_PSsep1").collapsed = hideMenus;
    //document.getElementById("MFP_PSsep2").collapsed = hideMenus;
    //if (document.getElementById("appmenuPrimaryPane")) {
    //document.getElementById("MFP_PSsep3").collapsed = hideMenus;
    //document.getElementById("MFP_PSmenu3").collapsed = hideMenus;
    //document.getElementById("MFP_PSmenu4").collapsed = hideMenus;
    //}
    profileLauncher.fillPopup();
  },

  fillPopup: function () {
    function insensitive(s1, s2) {
      var s1lower = s1.toLowerCase();
      var s2lower = s2.toLowerCase();
      return s1lower > s2lower ? 1 : (s1lower < s2lower ? -1 : 0);
    }
    var i
    var sortProfiles = prefs.getBoolPref("extensions.profileswitcher.profiles_sort");
    var profilesListPref = prefs.getStringPref("extensions.profileswitcher.profiles.list");
    var profilesList = profilesListPref.split(",,,");
    if (sortProfiles)
      profilesList.sort(insensitive);
    var popup = document.getElementById("profList");
    var popup2 = document.getElementById("profList2");
    var popup3 = document.getElementById("profList3");
    var popup4 = document.getElementById("profList4");
    var used_prof = prefs.getStringPref("extensions.profileswitcher.profile.in_use");
    // var regtest = new RegExp("\\d. "+used_prof+"$");
    var regtest = new RegExp("^" + used_prof + "$");
    var default_prof = prefs.getStringPref("extensions.profileswitcher.default_profile_name");
    var regtest2 = new RegExp("^" + default_prof + "$");
    for (i = 0; i < profilesList.length; i++) {
      var item = document.createXULElement("menuitem");
      try {
        var labelUTF8 = converter.ConvertToUnicode(profilesList[i]);
      }
      catch (e) {
        var labelUTF8 = profilesList[i];
      }
      if (!sortProfiles)
        labelUTF8 = (i + 1) + ". " + labelUTF8;
      item.setAttribute("profile", profilesList[i]);
      item.setAttribute("oncommand", "profileLauncher.runExec(this)");
      if (profilesList[i].match(regtest)) {
        item.setAttribute("disabled", "true");
        item.setAttribute("label", labelUTF8 + " (" + bundle.GetStringFromName("profileinuse") + ")");
        item.style.fontStyle = "italic";
      }
      else
        item.setAttribute("label", labelUTF8);
      //try {
      //// if (i == prefs.getIntPref("extensions.profileswitcher.default_profile")-1) {
      //if (profilesList[i].match(regtest2)) {
      //// item.setAttribute("tooltiptext", "Default");
      //item.style.fontWeight = "bold";
      //}
      //}
      //catch(e) {}
      profileLauncher.append(popup, item, false);
      profileLauncher.append(popup2, item, false);
      profileLauncher.append(popup3, item, false);
      profileLauncher.append(popup4, item, false);
    }
    var last = document.createXULElement("menuitem");
    last.setAttribute("label", bundle.GetStringFromName("refresh"));
    last.setAttribute("oncommand", "profileLauncher.refreshList()");
    profileLauncher.append(popup, last, true);
    profileLauncher.append(popup2, last, true);
    profileLauncher.append(popup3, last, true);
    profileLauncher.append(popup4, last, true);
  },

  setTitle: function () {
    try {
      if (prefs.getIntPref("extensions.profileswitcher.where_show_name") > 0)
        return;
      var profilename = prefs.getStringPref("extensions.profileswitcher.profile.in_use");
      try {
        profilename = converter.ConvertToUnicode(profilename);
      }
      catch (e) { }
      if (profilename != "") {
        var titleappend = "[" + profilename + "] ";
        if (document.title.indexOf(titleappend) < 0)
          document.title = titleappend + document.title;
      }
    }
    catch (e) { }
  },

`
    <popupset id="mainPopupSet">
      <menupopup id="profileNamePopup">
        <menu label="&startProf;">
          <menupopup id="profList2" />
        </menu>
        <menu label="&startPM;" insertafter="menu_FileQuitSeparator">
          <menupopup>
            <menuitem id="profManager2"
                      oncommand="profileLauncher.runExec(this)"
                      label="&normalmode;" />
            <menuitem id="profManagerSF2"
                      oncommand="profileLauncher.runExec(this)"
                      label="&safemode;" />
          </menupopup>
        </menu>
        <menuitem id="aboutProfiles2"
                  oncommand="profileLauncher.openAboutProfiles();"
                  label="Open About Profiles" />
        <menuitem id="profSwitcherLog2"
                  oncommand="profileLauncher.restartWithLog()"
                  label="&restartWithLog;" />
        <menuseparator />
        <menuitem id="openOptions"
                  label="&openOptions;"
                  oncommand="profileLauncher.openOptions()" />
      </menupopup>
    </popupset>

    <toolbar id="unifiedToolbar">
      <toolbarbutton id="profSwitcherButtonTB"
                     is="toolbarbutton-menu-button"
                     insertbefore="button-appmenu"
                     label-id="&profiles;"
                     class="toolbarbutton-1"
                     type="menu-button"
                     oncommand="profileLauncher.runProfileButton(event,this);"
                     tooltiptext="Profile Switcher">
        <menupopup>
          <menu label="&startProf;">
            <menupopup id="profList4"
                       onpopupshowing="profileLauncher.fillToolbarPopup(this)"/>
          </menu>
          <menu label="&startPM;" insertafter="menu_FileQuitSeparator">
            <menupopup>
              <menuitem id="profManager4"
                        oncommand="profileLauncher.runExec(this)"
                        label="&normalmode;" />
              <menuitem id="profManagerSF4"
                        oncommand="profileLauncher.runExec(this)"
                        label="&safemode;" />
            </menupopup>
          </menu>
          <menuitem id="aboutProfiles4"
                    oncommand="profileLauncher.openAboutProfiles();"
                    label="Open About Profiles" />
          <menuitem id="profSwitcherLog4"
                    oncommand="profileLauncher.restartWithLog()"
                    label="&restartWithLog;" />
          <menuseparator />
          <menuitem label="&openOptions;"
                    oncommand="profileLauncher.openOptions()" />
        </menupopup>
      </toolbarbutton>
    </toolbar>

    <menupopup id="menu_FilePopup">
      <menu insertafter="menu_FileQuitSeparator"
            label="&startProf;"
            id="MFP_PSmenu1">
        <menupopup id="profList" />
      </menu>
      <menu label="&startPM;"
            insertafter="MFP_PSmenu1"
            id="MFP_PSmenu2">
        <menupopup>
          <menuitem id="profManager"
                    oncommand="profileLauncher.runExec(this)"
                    label="&normalmode;" />
          <menuitem id="profManagerSF"
                    oncommand="profileLauncher.runExec(this)"
                    label="&safemode;" />
        </menupopup>
      </menu>
      <menuitem insertafter="MFP_PSmenu2"
            id="aboutProfiles"
                oncommand="profileLauncher.openAboutProfiles();"
                label="Open About Profiles" />
      <menuitem insertafter="aboutProfiles"
            id="profSwitcherLog"
                oncommand="profileLauncher.restartWithLog()"
                label="&restartWithLog;" />
      <menuseparator insertafter="profSwitcherLog"
                     id="MFP_PSsep1" />
    </menupopup>

    <statusbar id="status-bar">
      <hbox id="status-profile">
        <toolbarbutton id="profileNameSBP"
                       class="toolbarbutton-1"
                       collapsed="true"
                       onmousedown="profileLauncher.runStatusbarProfileButton(event,this);"
                       context="profileNamePopup"
                       tooltiptext="&TTtext;">
          <image id="profileNameIcon"
                 src="chrome://profilelauncher/content/skin/icons/user0.png"
                 class="statusbarpanel-iconic" />
          <label id="profileNameLabel"
                 value="" />
        </toolbarbutton>
      </hbox>
    </statusbar>
`
*/
