# Unofficial Steam Web API Documentation
[Documenting the unofficial and internal Steam Web API](https://github.com/Revadike/UnofficialSteamWebAPI/wiki)

## Official API
This [wiki](https://github.com/Revadike/UnofficialSteamWebAPI/wiki) is **not** intended to list or document any "official" API that typically use a [API key](https://steamcommunity.com/dev/apikey), this includes the public Steamworks Web API that is hosted on `https://api.steampowered.com` or `https://community.steam-api.com`. 
If you are interested in that, I recommend this lovely [Steam Web API Documentation](https://steamapi.xpaw.me/) by [@xPaw](https://github.com/xPaw).

## Contribution
**WE NEED YOUR HELP!**

Because of the nature of this kind of API, we desparately seek contributions to the [wiki](https://github.com/Revadike/UnofficialSteamWebAPI/wiki) to keep the documentation updated and complete!
If this documentation was helpful to you in any way, please consider taking a few minutes to add a new wiki entry or update an existing one (look out for `TODO`). Also, a [☆ Star](https://github.com/Revadike/UnofficialSteamWebAPI/stargazers) is much appreciated!

## Generation
This JavaScript code may help you generate parts of the API documentation:
 * Response:
```js
console.log(Object.entries(JSON.parse(document.body.innerText)).map(([key, value]) =>  `> | \`${key}${Array.isArray(value) ? "[]" : ""}\` | ${Array.isArray(value) ? "array" : typeof value} | \`TODO\` |`).join("\n"));
```
 * Example:
```js
console.log(JSON.stringify(JSON.parse(document.body.innerText), null, 4));
```

## Sources
Most of these unofficial API endpoints can be found by [reverse engineering](https://en.wikipedia.org/wiki/Reverse_engineering). Check out [this tutorial](https://developer.chrome.com/docs/devtools/network/) by @Google.

There are also other sources that are tracking them (undocumented), here are a few of them:

 * [SteamTracking's URL List](https://github.com/SteamDatabase/SteamTracking/blob/master/ClientExtracted/public/url_list.txt)
 * [SteamTracking's JavaScript Collection](https://github.com/SteamDatabase/SteamTracking/tree/master/store.steampowered.com/public/javascript)

## License
[MIT License](https://github.com/Revadike/UnofficialSteamWebAPI/blob/master/LICENSE)
