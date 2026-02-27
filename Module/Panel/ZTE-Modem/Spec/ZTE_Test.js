/*
* ZTE Modem Monitor Panel - Universal Version (Syntax Fixed)
* GitHub: Rabbit-Spec/ZTE-Modem-TimeSync-Shortcut
* v0.3
*/

const IP = "192.168.1.1";
const USER = "root";
const PASS = "Zte521";
const EXPECT_PATH = "/opt/homebrew/bin/expect"; 

const envSys = typeof $environment !== "undefined" ? $environment.system : "Undefined";
const hasUtilsExec = typeof $utils !== "undefined" && typeof $utils.exec === "function";

const isMac = (envSys.toLowerCase().includes("mac")) || hasUtilsExec;

if (isMac) {
    if (!hasUtilsExec) {
        // 如果识别为 Mac 但没有 exec 权限
        $done({
            title: "Mac 权限受限",
            content: `系统识别为: ${envSys}\n错误: 当前环境缺少 $utils.exec API。`,
            icon: "xmark.octagon",
            "icon-color": "#FF3B30"
        });
    } else {
        // 拥有权限，正常执行 Telnet 抓取逻辑
        const cmd = `${EXPECT_PATH} -c 'set timeout 5; spawn telnet ${IP}; expect "Login:"; send "${USER}\\r"; expect "Password:"; send "${PASS}\\r"; expect "/ # "; send "uptime; top -n 1 | grep CPU; cat /proc/pon_info\\r"; expect "/ # "; send "exit\\r"; expect eof'`;

        $utils.exec("bash", ["-c", cmd], (stdout, stderr) => {
            if (stdout) {
                const rxPower = stdout.match(/Rx Power\s+:\s+([-\d.]+)/)?.[1] || "N/A";
                const cpuUsage = stdout.match(/CPU:\s+([\d.]+%)/)?.[1] || "N/A";
                const uptime = stdout.match(/up\s+([\d\s\w,:]+),/)?.[1] || "N/A";

                const content = `🌡 光衰: ${rxPower} dBm  |  💻 CPU: ${cpuUsage}\n⏱ 运行时间: ${uptime}`;
                
                $persistentStore.write(content, "ZTE_Modem_Data");

                $done({
                    title: "中兴光猫状态 (Mac)",
                    content: content,
                    icon: "router",
                    "icon-color": "#007AFF"
                });
            } else {
                $done({
                    title: "中兴光猫 (连接异常)",
                    content: "请检查 Mac 端 Telnet 权限及 expect 路径",
                    icon: "exclamationmark.triangle",
                    "icon-color": "#FF3B30"
                });
            }
        });
    }
} else {
    // 明确不是 Mac，进入 iOS 同步读取模式
    const cachedData = $persistentStore.read("ZTE_Modem_Data");
    $done({
        title: `设备识别为: ${envSys}`,
        content: `API状态: exec=${has
