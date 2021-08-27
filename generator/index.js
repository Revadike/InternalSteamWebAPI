global._mckay_statistics_opt_out = true;

const SteamCommunity = require("steamcommunity");
const ReadLine = require("readline");
const fs = require("fs");
const path = require("path");
const generateDocs = require("../generate_docs");

const community = new SteamCommunity();
const rl = ReadLine.createInterface({
    "input": process.stdin,
    "output": process.stdout
});
const credentials = {};
let homeLines = "";

function doLogin() {
    community.login(credentials, err => {
        if (err) {
            if (err.message === 'SteamGuardMobile') {
                rl.question("Steam Authenticator Code: ", code => {
                    credentials.twoFactorCode = code;
                    doLogin();
                });
                return;
            }

            if (err.message === 'SteamGuard') {
                console.log("An email has been sent to your address at " + err.emaildomain);
                rl.question("Steam Guard Code: ", code => {
                    credentials.authCode = code;
                    doLogin();
                });
                return;
            }

            if (err.message === 'CAPTCHA') {
                console.log(err.captchaurl);
                rl.question("CAPTCHA: ", captchaInput => {
                    credentials.captcha = captchaInput;
                    doLogin();
                });
                return;
            }

            console.log(err);
            process.exit();
            return;
        }

        console.clear();
        console.log("Steam API Docs Generator by Revadike");
        console.log("Logged in as " + community.steamID.toString());
        docsSetup();
    });
}

function docsSetup() {
    console.log("Adding New API Endpoint... (Ctrl + C to exit)");
    rl.question("Descriptive Title (Example: Get App Details): ", title => {
        rl.question("Authenticated? (y/n/empty): ", authed => {
            authed = authed.toLowerCase() === "y" ? true : authed.toLowerCase() === "n" ? false : null;
            rl.question("API endpoint URL (Example: https://store.steampowered.com/api/appdetails?appids=440):\n", url => {
                community.httpRequestGet(url, (err, res, body) => {
                    if (err) {
                        console.log(err);
                        process.exit();
                        return;
                    }

                    let json;
                    try {
                        json = JSON.parse(body);
                    } catch (err) {
                        console.log(err);
                        process.exit();
                        return;
                    }

                    let docs = generateDocs(json, url, authed);
                    let filename = title.replace(/\s/g, "-");
                    let output = "./output/" + filename + ".md";
                    fs.writeFile(output, docs, err => {
                        if (err) {
                            console.log(err);
                            process.exit();
                            return;
                        }
                        console.log("API endpoint docs generated!");
                        console.log(path.resolve(output));
                        console.log("\nDon't forget to add the following to Home.md:");
                        let uri = new URL(url);
                        let homeLine = " * GET [" + uri.pathname + "](/Revadike/InternalSteamWebAPI/wiki/" + filename + ") " + (authed ? " ([*](#documentation))" : "") + "\n";
                        homeLines += homeLine;
                        console.log(homeLines);
                        docsSetup();
                    });
                });
            });
        });
    });
}

function checkSteamLogged() {
    community.loggedIn((err, loggedIn) => {
        if (err) {
            console.log(err);
            setTimeout(checkSteamLogged, 1000 * 60 * 4);
        } else if (!loggedIn) {
            console.log("Logged out of steam!");
            doLogin();
        }
    });
}

community.on('sessionExpired', function (err) {
    if (err) {
        console.log(err);
    }
    doLogin();
});

function start() {
    console.log("Steam API Docs Generator by Revadike");
    rl.question("Steam Username: ", (accountName) => {
        rl.question("Steam Password: ", (password) => {
            credentials.accountName = accountName;
            credentials.password = password;
            doLogin();
        });
    });
}

setInterval(checkSteamLogged, 1000 * 60 * 30);
start();