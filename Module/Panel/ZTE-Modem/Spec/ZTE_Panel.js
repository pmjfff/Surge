/*
* ZTE Modem Monitor Panel for Surge
* GitHub: Rabbit-Spec/ZTE-Modem-TimeSync-Shortcut
*/

const IP = "192.168.1.1";
const USER = "root";
const PASS = "Zte521";

// 兼容 Intel/Apple Silicon 的路径
const EXPECT_PATH = "/opt/homebrew/bin/expect"; 
const BASH_PATH = "/bin/bash";

const cmd = `${EXPECT_PATH} -c '
set timeout 5;
spawn telnet ${IP};
expect "Login:"; send "${USER}\\r";
expect "Password:"; send "${PASS}\\r";
expect "/ # "; send "uptime; top -n 1 | grep CPU; cat /proc/pon_info\\r";
expect "/ # "; send "exit\\r";
expect eof'`;

if ($trigger === "button") {
    // 处理点击面板后的手动对时逻辑
    $utils.exec(BASH_PATH, ["-c", cmd], (stdout, stderr) => {
        $notification.post("中兴光猫", "手动同步请求已发送", "正在更新状态...");
        $done();
    });
} else {
    // 正常面板显示逻辑
    $utils.exec(BASH_PATH, ["-c", cmd], (stdout, stderr) => {
        if (stdout) {
            // 提取关键数据
            const rxPower = stdout.match(/Rx Power\s+:\s+([-\d.]+)/)?.[1] || "N/A";
            const cpuUsage = stdout.match(/CPU:\s+([\d.]+%)/)?.[1] || "N/A";
            const uptimeRaw = stdout.match(/up\s+([\d\s\w,:]+),/)?.[1] || "N/A";

            $done({
                title: "中兴光猫状态",
                content: `🌡 光衰: ${rxPower} dBm  |  💻 CPU: ${cpuUsage}\n⏱ 运行时间: ${uptimeRaw}`,
                icon: "router",
                "icon-color": "#007AFF"
            });
        } else {
            $done({
                title: "连接失败",
                content: "请确认终端已安装 expect 并开启 Telnet",
                icon: "exclamationmark.triangle",
                "icon-color": "#FF3B30"
            });
        }
    });
}
