var Services = globalThis.Services || ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.scriptloader.loadSubScript("chrome://profilelauncher/content/profilelauncher.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://profilelauncher/content/utils.js", window, "UTF-8");

function onLoad(activatedWhileWindowOpen) {

  WL.injectElements(`

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

    <toolbar id="tabs-toolbar">
      <toolbarbutton id="profSwitcherButtonTB"
                     is="toolbarbutton-menu-button"
                     insertafter="tabmail-tabs"
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

`, ["chrome://profilelauncher/locale/profilelauncher.dtd"]);
  window.profileLauncher.init();

  WL.injectCSS("chrome://profilelauncher/content/skin/profilelauncher.css");
}

// called on window unload or on add-on deactivation while window is still open
function onUnload(deactivatedWhileWindowOpen) {
  // no need to clean up UI on global shutdown
  if (!deactivatedWhileWindowOpen)
    return;
  // If we've added any elements not through WL.inject functions - we need to remove
  // them manually here. The WL-injected elements get auto-removed
  else
    window.document.getElementById("profileNameSBP").remove();
}
