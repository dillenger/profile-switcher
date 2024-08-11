const { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");
const extension = ExtensionParent.GlobalManager.getExtension("pswitcher2@dillinger");

document.addEventListener("dialogaccept", function() {onOK()}); // This replaces ondialogaccept in XUL.

function init() {
  i18n.updateDocument({extension});
}

async function pickFile(el) {
  let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
  fp.init(window.browsingContext, "", Ci.nsIFilePicker.modeSave);
  fp.defaultString = "Thunderbird.moz_log";
  fp.appendFilter("moz_log", "*.moz_log");
  let res = await new Promise(resolve => {
    fp.open(resolve);
  })
  if (res == Ci.nsIFilePicker.returnOK) {
    el.previousSibling.value = fp.file.path;
  }
}

function onOK() {
  if (! document.getElementById("pop3").checked && ! document.getElementById("imap").checked && ! document.getElementById("smtp").checked) {
    alert(extension.localeData.localizeMessage("logErrorNoProtocol"));
    return false;
  }
  if (! document.getElementById("profPath").value) {
    alert(extension.localeData.localizeMessage("logErrorNoPath"));
    return false;
  }
  window.arguments[0].pop3 = document.getElementById("pop3").checked;
  window.arguments[0].imap = document.getElementById("imap").checked;
  window.arguments[0].smtp = document.getElementById("smtp").checked;
  window.arguments[0].file = document.getElementById("profPath").value;
  window.arguments[0].abort = false;
  return true;
}

