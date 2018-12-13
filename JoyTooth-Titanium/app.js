var win = require('/window_home.js').createWindow();
if(Ti.Platform.osname==='android'){
  // For Android app pause/resume catching. 
  win.addEventListener('open', function(e) {
    win.activity.addEventListener("pause", function() {
        Ti.App.fireEvent('app_paused'); // in wlndow_home.js 
    });
  });
  win.open({theme: 'FullTheme'});
} else {
  var rootNavWin = Titanium.UI.iOS.createNavigationWindow({
    zIndex:1,
    window: win
  });
  win.containingNav = rootNavWin;
  rootNavWin.open();
}