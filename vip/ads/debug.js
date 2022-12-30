function collect() {
    console.profile();
    console.profileEnd();
    if (console.clear) {
        console.clear()
    };
    if (typeof console.profiles == "object") {
        return console.profiles.length > 0
    }
}

function check() {
    if ((window.console && (console.firebug || console.table && /firebug/i.test(console.table()))) || (typeof opera == 'object' && typeof opera.postError == 'function' && console.profile.length > 0)) {
        jump()
    }
    if (typeof console.profiles == "object" && console.profiles.length > 0) {
        jump()
    }
}
check();
window.onresize = function() {
    if ((window.outerHeight - window.innerHeight) > 200 && navigator.platform.indexOf('Win32') != -1) 
    jump()
                
}

function jump() {
    alert("您的浏览器开启了控制台，请关闭后再试!联系QQ2164175761");
    // window.location = "http://xesxg.yhzu.cn/";
}