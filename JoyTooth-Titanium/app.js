var win = require('/window_home.js').createWindow();

// iOS only for now until ti/bluetooth module catches up. 

  var rootNavWin = Titanium.UI.iOS.createNavigationWindow({
    zIndex:1,
    window: win
  });
  win.containingNav = rootNavWin;
  rootNavWin.open();
