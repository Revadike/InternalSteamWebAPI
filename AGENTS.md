# AGENTS.md

Instructions for AI agents working on the **Internal Steam Web API** wiki: <https://github.com/Revadike/InternalSteamWebAPI/wiki>

Your job: reverse engineer and **accurately document** the internal web API that Steam's own websites use. Accuracy and consistency matter more than speed or volume.

---

## 1. Project overview

### In scope
- Internal (undocumented) web endpoints used by Steam's own sites: `store.steampowered.com`, `steamcommunity.com`, `help.steampowered.com`, `checkout.steampowered.com` (plus alias hosts such as `steam-chat.com`).
- Endpoints that are reachable from client-side JavaScript or otherwise return structured data (JSON, or JSON wrapping HTML).

### Out of scope
- The official/public Web API (`https://api.steampowered.com/<interface>/<method>/<version>/`). It is already fully documented at <https://steamapi.xpaw.me>.
- Partner-only endpoints (`partner.steamgames.com`).
- **Full-page HTML controllers**: endpoints that render an entire HTML page, with no JSON mode and no client-side JS call site, are not internal APIs. Omit them entirely (no page, no index entry). Examples: `/contenthub/ajaxgetcontenthubsections`, `/contenthub/ajaxgetcategoryimages`, `/events/ajaxrequestlocalization`, `/default/home_sale_data`, `/curators/mycuratorsreviewing`.

### Primary source of truth
- **SteamTracking** (<https://github.com/SteamTracking/SteamTracking>) tracks all of Steam's web source code.
- Its URL extractor output (<https://github.com/SteamTracking/SteamTracking/blob/master/API/JavascriptUrls.txt>) lists endpoint URLs but lacks method, parameters and response. Finding those is the work.
- A line in that file alone does **not** prove an endpoint is alive (it contains stale entries).

---

## 2. Golden rules (read these first)

1. **Consistency over everything.** Same structure, same values, same wording on every page. Before writing anything, open 2–3 existing pages of the same kind and mirror them exactly.
2. **Never invent, never guess.** False information must be avoided at all cost. No fabricated examples, descriptions, parameters or notes, and no wild guesses. Avoid `` `TODO` `` where research can resolve it (JS source, library source and docs, live data, online search), but when a value still can't be established with confidence, write `` `TODO` `` instead of guessing (see §7).
3. **Only the prose the template has.** Every page has exactly **one intro sentence** under the title (§7), plus the **Rate limits** blockquote. No other prose: no "Note:" blocks, no explanations like "Requires an authenticated session with an active cart…". The structured fields already say it (Authenticated, Required, status blocks, response tables).
4. **Verify against reality.** Descriptions and types must be checked against the actual example response, not assumed from variable names or stale examples.
5. **Reuse existing descriptions, but never at the cost of accuracy.** Search the whole wiki for the same parameter/field name first (see §8) and start from the existing wording. If an endpoint needs extra detail (format, unit, edge case, enum meaning), extend the description rather than omitting important information.
6. **Ask clarifying questions at any time.** If anything is ambiguous, ask instead of guessing. Ask as many questions as needed, but only one decision per question and keep them concrete.
7. **Persist decisions.** Whenever the maintainer states a rule, correction or preference, add it to this file immediately (right section), so it is never forgotten or violated again.
8. **Never leak credentials.** See §11.
9. **Never probe rate limits.** It locks the account out of further research. See §6.

---

## 3. Repository layout

The wiki is a GitHub wiki (a separate git repo). All pages live in the **repository root** as flat Markdown files:

```
Home.md                    # The index of ALL endpoints + global notes
Get-Miniprofile.md         # One page per endpoint
Register-Key.md
...
```

- `Home.md` is the index. Every documented endpoint is linked there; see §10.
- A local, **git-ignored** scratch workspace holds credentials and tooling. Never commit it and never link to or mention it in wiki pages.
- The maintainer reviews and commits manually. **Never commit or push**; leave changes in the working tree.

### File naming
- Action-prefixed, hyphen-separated, each word capitalised, acronyms stay uppercase: `Get-DLC-For-App`, `Search-Store`, `Add-To-Wishlist`, `Respond-To-Mobile-Confirmation`, `Get-Watch-VOD-Token`.
- Typical prefixes: `Get-`, `Search-`, `Add-`, `Remove-`, `Check-`, `Create-`, `Delete-`, `Edit-`, `Update-`, `Follow-`, `Request-`, `Resolve-`, `Begin-`.
- Name by what the endpoint **does**, not by its raw URL fragment.

---

## 4. Workflows

### 4.1 Documenting a new endpoint (interactive default)

1. **Pick the endpoint.** Start with the most interesting/useful undocumented one that has a real JS call site. If unsure, propose a short list and ask.
2. **Find call sites in SteamTracking.** Use code search scoped to `repo:SteamTracking/SteamTracking` with the endpoint fragment. If one search method returns nothing, try another (raw file fetch, contents listing, other search queries). Recommended tools: §4.5.
   - Raw files: `https://raw.githubusercontent.com/SteamTracking/SteamTracking/master/<path>`
   - Domain directories: `store.steampowered.com`, `steamcommunity.com`, `checkout.steampowered.com`, `help.steampowered.com` (each holds `public/javascript/...`).
3. **Extract from the JS**: HTTP method, host, path, path variables, query/form parameters (including valid value formats), enum values, which response fields are read, base-URL variables (e.g. server-injected `g_str…URL`). Use this to work out what a *valid, successful* request and response look like.
4. **Cross-check** the path against `JavascriptUrls.txt`.
5. **Secondary sources**: `node-steamcommunity` (DoctorMcKay), `steam-totp` and similar packages. They are valuable because they also contain **documentation** (JSDoc comments, READMEs, wiki pages, type definitions) from which you can extract the meaning of parameters, fields and enum values. Use them to fill in descriptions and to cross-check flows and algorithms. They are third-party reimplementations, so paths/params can lag the live site: never treat them as primary, and always verify against SteamTracking JS and a live probe. For anything still unclear you may research online (developer search and issue/PR search help here, §4.5).
6. **Probe live** (rules in §6): anonymous vs authenticated, method discovery, each parameter omitted individually (Required), status codes. Make sure you also obtain a **good success response** for the Example (§9).
7. **Write the page by hand** following §7–§9.
8. **Capture the example** (§9) and add status-code blocks.
9. **Add/update the `Home.md` entry** (§10).
10. **Run the verification checklist** (§12).
11. **Report briefly and ask which endpoint to do next.** (Skip the question only in explicit bulk modes, §4.2/§4.3.)

Cadence: fully document **one** endpoint, then ask which to do next.

### 4.2 Re-auditing existing pages
When asked to recheck documented endpoints, for **every** page:
- Re-request the endpoint anonymously and authenticated. Did it stop working (null response, error, redirect to store home)? Did authentication requirements change? Did the response shape change?
- **Compare** the fresh response with the documented table and example; fix types, add/remove fields, fix descriptions.
- Re-test whether each parameter is actually **required** (omit it, observe a 4xx/error).
- Refresh the example from the live response (§9). If the example was identical to a stale one, double-check you really fetched fresh data.
- Add every other observed status code as its own block in `## Response`.
- Ensure **no `TODO` remains** where research can resolve it; verify consistency of every shared field/parameter description across the wiki.
- If the endpoint is **confirmed dead**: delete the page **and** remove it from `Home.md` (§10, §13). Be completely sure first.
- Make sure the page has the one-sentence intro (§7); add it if missing.
- Update the `Home.md` auth marker if authentication behaviour changed.
- Continue through the list without asking after each page; ask only when genuinely ambiguous.

### 4.3 Discovery only
When the maintainer says "just discovering": review candidates (e.g. `JavascriptUrls.txt`) and report findings. **Do not** add anything to `Home.md` or create pages.

### 4.4 Bulk work and delegation
When splitting work across sub-agents:
- Put the **full methodology and these rules in the sub-agent prompt** (including the dead-endpoint rule and the no-fabrication rule).
- Instruct them to **always use the honest live response**; they must never invent a "representative" example when the live one is empty.
- Use a sub-agent that can **write files**; read-only agents only return text.
- **Centralize `Home.md` edits and final verification** in the orchestrating agent to avoid concurrent-edit conflicts.
- Review sub-agent output yourself for host, method, auth and path-variable mistakes (these were common).

### 4.5 Recommended MCP tools

These MCP tools make the research faster and more reliable. They are recommended, not required: tool names vary per client, so use whichever equivalent is connected, and fall back to plain HTTP fetches and web search if none are. They are for **research only**; every fact still has to be verified against SteamTracking JS and a live probe.

| Need | Recommended tool |
|:---|:---|
| Search/read SteamTracking source, `JavascriptUrls.txt`, file history | **GitHub MCP** |
| Search issues/PRs (SteamTracking, `node-steamcommunity`, `steam-totp`, …) | **GitHub Pull Request MCP**, **GitHub MCP**, **Firecrawl developer search** |
| Programming questions: library behaviour, error messages, API contracts, known bugs | **Firecrawl developer search** |
| Read a known documentation page / general web research | **Firecrawl** `firecrawl_scrape` / `firecrawl_search` |

#### GitHub MCP (`github/github-mcp-server`)
- Hosted by GitHub at `https://api.githubcopilot.com/mcp/` (or run locally via Docker); authenticates with a GitHub token. Read-only toolsets are enough here.
- Most useful tools:
  - `search_code`: find JS call sites. Scope with `repo:SteamTracking/SteamTracking`, e.g. `ajaxgetwatchvodtoken repo:SteamTracking/SteamTracking`.
  - `get_file_contents`: read a file or list a directory at a ref (SteamTracking JS, `API/JavascriptUrls.txt`, library sources and READMEs).
  - `list_commits` / `get_commit`: see when a file or call site changed or disappeared. Useful evidence when deciding whether an endpoint is dead (§13).
  - `search_issues`, `search_repositories`: find library repos and discussions about an endpoint.
- If a code search returns nothing, retry with different fragments or fetch the raw file directly before concluding that no call site exists.
- Never use its write tools (commit, push, create/merge PR, …) on the wiki; see §3.

#### GitHub Pull Request MCP (VS Code extension `microsoft/vscode-pull-request-github`)
- Exposes GitHub issue/PR tools to the agent in VS Code (names as listed in tool configs: `github.vscode-pull-request-github/issue_fetch`, `doSearch`, `searchSyntax`, `renderIssues`, `activePullRequest`, `openPullRequest`).
- Use `doSearch` (GitHub search syntax; `searchSyntax` helps form the query) to find issues and PRs, and `issue_fetch` to read one with its full discussion.
- Why it matters: **unmerged or recently merged PRs and issues** in library repos often contain endpoint details, parameters and documentation that aren't in the main branch yet (e.g. `node-steamcommunity` PRs for forum discussions and shared-file subscribe/unsubscribe).
- Research only: don't use its suggest-fix or coding-agent delegation features for this project.

#### Firecrawl MCP (`firecrawl/firecrawl-mcp-server`)
- **`firecrawl_developer_search`** (the one to reach for first on programming questions): searches an index built for coding agents covering GitHub issues, merged pull requests, repository READMEs and code documentation.
  - Arguments: `query` (required), `k` (number of results, default 10, max 100), `skills` (`"only"` searches agent-skill files only).
  - Returns ranked results, each with an ID, a source type (`issue`, `pull_request`, `readme` or `doc`), a URL, a title and the matched passages.
  - Good for: how `node-steamcommunity`/`steam-totp` implement a flow, what a parameter means according to library docs or issues, error messages, known bugs.
  - Available on the full server (API key or OAuth) and on the search-only endpoint `https://mcp.firecrawl.dev/v2/mcp-search`. The keyless free tier (`https://mcp.firecrawl.dev/v2/mcp`) only exposes `scrape`, `search` and `parse`.
- **`firecrawl_search`**: general web search (optionally with page content) when you don't know where the answer lives.
- **`firecrawl_scrape`**: fetch a known documentation URL. Prefer JSON format with a schema (or markdown with `onlyMainContent`) to keep results small. One URL per call.
- Calls consume credits; avoid repeated or redundant queries. Set up the API key or OAuth in the client's secret settings, **never** in a URL or in chat.

#### Rules for all MCP tools
- **Never send Steam session cookies, tokens or any other credentials to a third-party tool** (Firecrawl or otherwise). Authenticated probing of Steam endpoints is done with direct HTTP requests only, with the safety rules from §6.
- Do not use scrapers/search tools to hit Steam endpoints you're documenting; they don't carry the right cookies/headers and can trigger rate limits.
- Treat search results as leads, not facts. Verify against primary sources (SteamTracking JS, live responses) before writing anything into a page.

---

## 5. Placeholder IDs for examples and probes

Use these real values unless a different value is needed to get a non-empty response (example IDs are not strict):

| Kind | Value |
|:---|:---|
| `appid` | `440` |
| `subid` | `469` |
| `steamid` | `76561198042965266` |
| group id, 64-bit (`:groupid`) | `103582791461301431` |
| clan id, 32-bit (`:clanid`) | `31780023` |
| `sessionid` placeholder in examples | `a0b1c2d3e4f5g6h7i8j9klmn` |

- **Curator / clan ids: use `31780023` everywhere**, for public *and* admin/curator endpoints, across the entire wiki.
- When an endpoint must target the **authenticated account itself**, use the SteamID of the account the supplied session belongs to (the `steamLoginSecure` cookie value starts with that 64-bit SteamID). Don't hard-code it in this file.
- Path variables are **always lowercase**: `:confid`, `:steamid`, `:appid`. Never `:confID`.

---

## 6. Probing rules

### Credentials and sessions
- Authenticated probing needs session cookies of a **test account**. Maintainers supply these to their AI agent themselves (e.g. via local, git-ignored storage or the chat); they are never part of this repository. If none are provided, ask for them. **Never write cookie values into pages, this file, echoed commands, or commits.**
- Cookies are **per host** (audience-specific): store, community and help each have their own; checkout uses the store cookie. A store cookie does not authenticate on community. If a cookie looks expired (the JWT carries an `exp`), ask the maintainer for a fresh one.
- Some endpoints validate the **query/form `sessionid` against the cookie `sessionid`** (e.g. community search): send the real session value when probing, but put the placeholder in the wiki.

### Safety
- **Never probe rate limits** (no hammering, no loops to find thresholds). Default to `> *No known rate limit*`. If a `429` happens naturally, add a qualitative note (see §7).
- **Harmless writes are allowed** on the test account or the maintainer's own profile, and must be **undone** (e.g. post a temporary comment, then delete it; add then remove a wishlist item, verifying the count returns). Document the write endpoint(s) too.
- Mimic **natural conditions**: realistic parameters, headers (`Referer`/`Origin` where the site sends them), normal pacing, normal flows.
- Prefer **side-effect-free probes** for writes: omit required fields, use invalid or empty values, and read the error shape.
- **Never** perform irreversible, financial or social-impact actions (purchases, real country/account changes, messages to other people). Be careful with actions that have no HTTP undo (e.g. the new account cart is only modifiable via a protobuf WebSocket call). If unsure, ask first.
- Typical test-account limits (vary per account): no Steam Guard (comment posting returns a Steam Guard error), no mobile authenticator (mobile confirmations unusable), profile comment settings that block posts, missing permissions on groups/curators. Document these denials as status blocks; don't fake successes.

### What to determine for each endpoint
- **Method**: test GET and POST where plausible. Some endpoints accept both; the wiki shows the first by priority `GET`, then `POST`.
- **Host(s)**: probe the correct host; wrong-host mistakes are common (e.g. a call that redirects to the store home page on `store.` but works on `steamcommunity.com`). List every host that works.
- **Authenticated**: compare anonymous vs authenticated responses (§7 for meaning).
- **Required parameters**: omit each parameter one at a time. `Required = Yes` means the server answers 4xx/error when it is omitted. Remember that parameters are often required just to get any useful response; check the endpoint's JS usage.
- **Enums and edge values**: derive from the JS first; probe extra values only when useful.
- **Status codes**: capture 200 plus every other status you naturally observe (400, 401, 403, 404, 429, …) with its body.
- **HTML-returning endpoints**: try appending `&json=1&norender=1&render=0&nohtml=1&html=0&format=json` to find a JSON mode. (Known: these have no effect on `/comment/*/render`; it always returns `comments_html` inside a JSON envelope.)

### Getting good responses (not error messages)
Error bodies such as "Bad parameter", "Invalid Parameters" or "access denied" are poor material. Always aim for a **correct, populated success response**:
1. Re-read the JS call site to see exactly how the request is built: parameter names and formats, value ranges, required headers (`Referer`/`Origin`), and where IDs come from.
2. Check library source and docs for sample values and flows.
3. Use realistic IDs (§5) or fetch valid ones from a related endpoint (e.g. an app that actually has data, a populated group).
4. Retry with adjusted parameters (sparingly, no hammering); try authenticated if anonymous returns empty or errors.
5. Use the JS to infer the expected response shape. It may inform the Response table, but never the Example.
Only if a good response is truly unobtainable, fall back to the rules in §9 (`` `TODO` `` or the preserved old example).

### If it can't be probed safely
Use the JS source and the library source only. Documenting from JS first is the right default anyway. Where no live response is capturable, the Example is `` `TODO` `` (§9). Endpoints blocked by requirements the test account can't meet: document from JS if possible, otherwise skip and pick another.

---

## 7. Page format (exact)

Every page has exactly this skeleton, in this order. Header rows are verbatim; do not alter column names or spacing.

````markdown
# GET /path/:var

Returns the details of an item.

## Rate limits
> *No known rate limit*

## Request
> **Authenticated**: Yes
>
> **Method**: `GET`
>
> **Host**: `store.steampowered.com`
>
> **Path**: `/path/:var`
>
> **Variables**:
>
> | **Name** | **Type**  | **Description** |
> |:---|:---|:---|
> | `:var` | number | The Steam [AppID](https://developer.valvesoftware.com/wiki/Steam_Application_IDs) |
>
> **Query Parameters**:
>
> | **Name** | **Type** | **Required** | **Description** |
> |:---|:---|:---|:---|
> | `l` | string | No | Language |

## Response
> ### 200 OK
>
> | **Name** | **Type** | **Description** |
> |:---|:---|:---|
> | `success` | boolean | Whether the request was successful |

## Example
```
GET https://store.steampowered.com/path/440?l=english
```
```json
{
    "success": true
}
```
````

If whitespace details are ever in doubt, **copy the raw Markdown of an existing page of the same method type**; existing pages are the ground truth.

### Title and intro sentence
- `# <METHOD> <Path>`: exactly the method and path, e.g. `# GET /miniprofile/:accountid/json/`. Keep a trailing slash only if the real path has one (some do, some must not).
- **Every page has exactly one intro sentence** directly below the title (blank line before and after), before `## Rate limits`. Add it to any existing page that lacks one whenever you touch that page.
- Style: one sentence, third-person present tense, starting with a verb (`Returns…`, `Searches…`, `Adds…`, `Removes…`, `Checks…`, `Updates…`), ending with a period, describing **what the endpoint does**.
- It must be accurate and conservative: derive it from the JS call site/response. If the purpose is only partly known, state only the part you're sure of. Don't mention authentication, parameters, side quirks or caveats (the fields already cover those).

### Request block
- **Order of fields**: Authenticated, Method, Host, Path, Variables (only if the path contains `:vars`), then **Query Parameters** (GET) or **Form Data** (POST).
- **Authenticated** values: `Yes` (requires login or behaves differently when logged in), `No` (identical anonymous), `Optional` (works anonymously, richer when logged in).
- **Host**: comma-separated list when several work, e.g. `` `steam-chat.com`, `steamcommunity.com` ``.
- **Method**: only one is shown; if several work use priority `GET` then `POST`.
- **Use a new table row per parameter.** Never cram several parameters into one description.

### Table conventions
- Variables table: 3 columns (`Name`, `Type`, `Description`, note the double space after `**Type**`).
- Query/Form table: 4 columns (`Name`, `Type`, `Required`, `Description`).
- Response table: 3 columns (`Name`, `Type`, `Description`).
- Separator row is `|:---|:---|:---|` (3 cols) or `|:---|:---|:---|:---|` (4 cols).
- **Required**: `Yes` or `No` (never true/false); may append a default: `No (default 0)`.
- **Types**: `string`, `number`, `boolean`, `object`, `array`, `enum (` `` `a` ``/`` `b` `` `)`. For mixed-type values, use the primary/common type and explain the edge case in the description (not `string | boolean`).
- `success` takes the type actually observed (`boolean` or `number`).
- Nesting in Response names: `obj.nested`, `arr[]`, `arr[].field`. Arrays of scalars are **one** `[]` row (never `.0`/`.1` rows). A root array uses `[]` / `[].field`.
- **Dynamic map keys** use a semantic colon variable: `:appid`, `:tagid`, `:packageid`, `:listingid`, `:notificationtype`, … **Never** `{var}` braces.
- If a dynamic-key object has a small known set of meaningful keys, keep the per-key meanings in the description (e.g. notification types 1 = Trade offers, 2 = Games, 3 = Community messages, 4 = New comments, 5 = Inventory, 6 = Invites, 8 = Gifts, 9 = Chat, 10 = Support replies, 11 = Account alert).
- Do not copy Hungarian/variable prefixes into descriptions (`rg`, `b`, `n`, `str`, `ul`, `e`, `rt`, `g…`).

### Status-code blocks
- One block per observed status: `> ### 200 OK`, `> ### 400 Bad Request`, `> ### 401 Unauthorized`, `> ### 403 Forbidden`, `> ### 404 Not Found`, `> ### 429 Too Many Requests`, each with its own response table.
- Look at an existing page that already documents non-200 bodies and mirror how it handles bare bodies (`null`, `false`, `[]`).
- For **stateful** endpoints that return empty now, keep the old complete example **and** still add any other status responses you discover.

### Rate limits text
- Default: `> *No known rate limit*`.
- If rate limiting was observed naturally, a qualitative note, e.g. rate limited, `429` with a `null` body. Never guess numbers; never probe.
- Documented global limit (lives in `Home.md`): `store.steampowered.com` allows 300 store requests per 5 minutes.

### The `TODO` token
- Unknown anything (parameter name, type, Required value, description, value, enum value, whole Example) = backticked `` `TODO` ``.
- **Always the exact same token**, `` `TODO` ``, never bare `TODO`, never variants.
- Use it only after real research (JS source, library source and docs, live data, online search). The goal is zero `TODO`s, but a `TODO` **always** beats a guess, a wrong value or a tautological description. Accuracy first; avoid false information at all cost.

---

## 8. Descriptions: consistency rules

### Process
1. Search the entire wiki for the same parameter/field name. If it exists, **start from that description** (usually copy it unchanged).
2. **Extend or adjust it when the endpoint needs it** to be accurate: add the format, unit, allowed values, default behaviour or an edge case. Keep the common core wording recognisable and keep extensions short. This is rare; consistency stays the default, but important details must never be left out for the sake of consistency.
3. If no description exists, derive the meaning from the **example response**, from library docs/comments, and only if reasonable from the variable name. If still unclear, `` `TODO` ``. Optionally research online.
4. If a new or extended description is likely to recur, add it to the tables below.

### Quality bar
- Use a **high-quality description or `` `TODO` ``**. Never auto-generated tautologies ("The n app priority", "The broadcaststeamid", "The has upvoted", "The ulfriendid").
- **Fact-check the example**: is it really an array, or an object keyed by numbers (`.1`, `.2`, `.3`)? A PHP empty map serializes as `[]`, so an empty `[]` does **not** prove an array; verify against a populated live response.
- `null` values mean an optional/absent field, not a type.
- Verify Types against the **live** response, not a stale example.

### Common request parameters
| Parameter | Description |
|:---|:---|
| `appid` | The Steam [AppID](https://developer.valvesoftware.com/wiki/Steam_Application_IDs) |
| `appids` | CSV of Steam [AppIDs](https://developer.valvesoftware.com/wiki/Steam_Application_IDs) |
| `steamid` | The 64-bit SteamID |
| `steamids` | CSV of 64-bit SteamIDs |
| `cc` / `country` | The country code of the region (e.g. `US`) |
| `l` / `language` | Language (market endpoints: The language in which the response will be displayed) |
| `currency` | The currency code (market endpoints: The currency in which the response will be displayed) |
| `count` | The number of items |
| `start` | The starting offset |
| `v` | Version |
| `sessionid` | The value of the `sessionid` cookie |
| `authwgtoken` | The value of the `authwgtoken` cookie |
| `filter` / `filters` | The filter |
| `origin` | The origin URL, changes the `Access-Control-Allow-Origin` header in the response |
| `norender` | When `1`, returns JSON instead of HTML |
| `term` | The Search Term |

Notes:
- `sessionid` keeps this exact description even when the endpoint enforces query-sessionid == cookie-sessionid.
- Some community endpoints spell the form field `sessionID` in their JS (e.g. `AddFriendAjax`, `BlockUserAjax`); the wiki normalises it to lowercase `sessionid` everywhere (both are accepted live).
- Reasoning for short names: `l` = language, `cc` = region/country code, `v` = version.

### Common path variables
| Variable | Description |
|:---|:---|
| `:accountid` | The Steam account number (["W"-part in SteamID3](https://developer.valvesoftware.com/wiki/SteamID#Steam_ID_as_a_Steam_Community_ID)) |
| `:steamid` | The 64-bit SteamID |
| `:appid` | The Steam [AppID](https://developer.valvesoftware.com/wiki/Steam_Application_IDs) |
| `:clanid` | The 32-bit account ID of the group |
| `:groupid` | The 64-bit SteamID of the group |

### Common response fields
| Field | Description |
|:---|:---|
| `success` | Whether the request was successful (type as observed) |
| `status` | HTTP-like status code of the response |
| `appid` / `steam_appid` | The Steam [AppID](https://developer.valvesoftware.com/wiki/Steam_Application_IDs) |
| `appids` (array) | Array of Steam [AppIDs](https://developer.valvesoftware.com/wiki/Steam_Application_IDs) |
| `name` | The name |
| `type` | The type |
| `id` | The unique identifier |
| `gid` | The 64-bit ID of the … (event / announcement / cart / message, as appropriate) |
| `clan_steamid` / `clanSteamIDString` | The 64-bit SteamID of the group |
| `clanid` / `clanAccountID` | The 32-bit account ID of the group |
| `steamid` | The 64-bit SteamID |
| `event_type` | The numeric event type |
| `rtime32_start_time` | Unix timestamp when the event starts |
| `rtime32_end_time` | Unix timestamp when the event ends |
| `server_address` | The server address |
| `server_password` | The server password |
| `strReleaseDate` | The release date (formatted) |
| `strDescription` | The description |
| `country_code` | The country code |
| `currency` | The currency code |
| `total_count` | The total number of items |
| `pagesize` | The page size |
| `results_html` | HTML of the results |
| `icon_url` | URL of the icon |
| `avatar_url` / `avatar_full_url` | URL of the avatar |
| `header_image` | URL of the header image |
| `price_overview` | The price information |
| `initial` | Pre-discount price |
| `final` | Post-discount price |
| `discount_percent` | Discount percentage |
| `coming_soon` | `true` if unreleased, `false` if released |
| `date` | The date |

### ID semantics (maintainer-corrected, be exact)
- `gid` is **a 64-bit ID** (not a group ID). Write "The 64-bit ID of the event" / "…of the announcement" / "…of the cart". Never "global ID (GID)", never "The 64-bit event/group ID".
- `clan_steamid` / `clanSteamIDString` follows the group SteamID64 syntax: **"The 64-bit SteamID of the group"**.
- `clanid` / `clanAccountID`: **"The 32-bit account ID of the group"**.
- Group SteamID64 = `103582791429521408` + clan account ID (e.g. `31780023` ↔ `103582791461301431`).

---

## 9. Example section

- Exactly: the request line in one fenced block, then the response in one ` ```json ` block. **Nothing else**: no prose before, between or after (no "not live-verified", no "a safe probe returned…").
- **GET**: `GET https://<host><path>?<query>`
- **POST**: `POST https://<host><path> { key: "value", sessionid: "a0b1c2d3e4f5g6h7i8j9klmn" }` (URL + inline form data).
- The JSON must be a **live response**, freshly fetched. Stale hand-captured examples are a known problem; always refresh.
- **Good quality only.** The Example is a **successful, populated response** (see §6 "Getting good responses"). Error bodies, "Bad parameter"-style messages, bare `false`/`null`, and empty lists are not acceptable as the Example when a better one can be obtained. Error responses belong in their own status blocks under `## Response`.
- **Prefer complete.** Copy the full body with tooling (don't paste large bodies through your own context), even when >1 MB. To get smaller complete responses, tweak the example's request parameters (smaller `count`, a specific id, a narrower filter).
- **Tactical truncation is allowed** where a full copy adds no value (very long lists/maps of repeating items, huge HTML strings), as long as the structure stays clear and the example remains a **valid representation** of the real response. Rules:
  - Keep the first representative item(s) and mark the rest with `...`. Inside a string (e.g. HTML) this keeps the JSON valid; a bare `...` after array items makes the JSON invalid, which is an accepted exception.
  - Keep every distinct key/shape that occurs (optional fields, nested objects, differing item shapes); never truncate in a way that hides fields or misrepresents types.
  - Don't truncate out of convenience when the full response is reasonably sized.
- **If no good live example can be produced** (e.g. gated by permissions, Steam Guard, authenticator, or only errors/empty data are obtainable): put `` `TODO` `` instead of the JSON block. Never fabricate a "representative" success body; inferred shapes belong only in the Response table.
- **Stateful endpoints** (empty without live state, e.g. carts, broadcasts, sales, filter words): keep the previous complete example, but still add newly found status responses.
- **Redact** secrets with a **regex pass** (no need to read large payloads yourself; the maintainer reviews manually). Cover at least: `sessionid=`, `steamLoginSecure=`, `steamLogin=`, JWT-like `eyJ…` strings, `webapi_token`/`access_token`/`viewer_token`/`login_token`, and JSON keys matching token/sessionid/loginsecure/cookie/password/secret/`auth_` (not bare `auth`, which would hit `author`). Replace with `a0b1c2d3e4f5g6h7i8j9klmn`.
- **Fence hazard**: if a JSON body contains a run of three backticks, wrap the block in a longer fence.
- Example IDs: §5.

---

## 10. `Home.md` index

- The index lists endpoints grouped by method (all `GET` first, then `POST`), alphabetical by path within each group.
- Documented endpoint: `- GET [/path/:var](https://github.com/Revadike/InternalSteamWebAPI/wiki/Page-Name)`
- Authenticated (`Authenticated: Yes`): append ` ([*](#documentation))` after the link. `No`/`Optional` get no marker.
- Undocumented (not yet researched): plain `- GET /path` with no link.
- Known-but-unresolved entries use the `` `TODO` `` prefix: `` - `TODO` /api/removefromcart ``.
- The listed **method must match the page's method** (many old entries had the wrong method, e.g. comment `post`/`delete` are POST). Paths in the index must match the page's `**Path**` (e.g. `/cart/addtocart`, not `/api/addtocart`); path variables stay lowercase.
- Keep the global notes at the bottom accurate:
  - Group/profile URL variations: group `/gid/:groupid/*` (also `/groups/:vanity_url/*`, `/ogg/:appid/*` if ogg, `/games/:vanity_url/*` if ogg); profile `/profiles/:steamid/*` (also `/id/:vanity_url/*`, `/my/*` if logged in).
  - Global rate limits & domains.
  - HTTP-method display priority (`GET`, then `POST`).
  - The meaning of "authenticated".
- Removing an endpoint from the wiki = delete the page **and** delete the index line.

---

## 11. Security and privacy

- **Never commit or publish** cookies, tokens, session ids, JWTs or any other credentials: not in pages, examples, this file, or screenshots.
- The local scratch workspace holding credentials and tooling **must stay git-ignored**.
- Always run a regex secret scan over all pages before finishing (generic patterns plus the literal values of the credentials currently in use). It must report **zero hits**. Real leaks found in the past: a `webapi_token` and a `viewer_token` in examples.
- Treat redaction as best-effort; the maintainer also checks manually.

---

## 12. Verification checklist (Definition of Done)

Per endpoint, before reporting:

- [ ] Page follows §7 exactly (title, one intro sentence, headings, order, verbatim column headers, new row per parameter).
- [ ] Host(s), method, auth, path (lowercase variables) verified live and against JS.
- [ ] Required flags verified by omission.
- [ ] Descriptions based on existing wiki wording/tables (extended only where accuracy needs it); no tautologies; no guesses; `` `TODO` `` only where truly unknown.
- [ ] Types verified against the **live** response; arrays vs objects verified.
- [ ] Example is a live, good-quality **success** response (not an error/empty body), redacted, with no prose; complete or tactically truncated per §9; or `` `TODO` ``.
- [ ] Every observed non-200 status has its own block.
- [ ] `Home.md` entry added/updated with correct method, link and auth marker.
- [ ] Every JSON example block parses as valid JSON (known/accepted exceptions: pages with `` `TODO` `` examples, non-JSON examples for HTML endpoints, and tactically truncated examples).
- [ ] Secret scan: zero hits.
- [ ] Live type check run when the endpoint can be auto-fetched.
- [ ] Reported to the maintainer; asked for the next endpoint (in interactive mode).

---

## 13. Endpoint lifecycle decisions

### Retired / dead endpoints: omit entirely
- **Omit** = no page **and** no `Home.md` entry. Retired endpoints are never marked as deprecated; they are removed.
- Only when **100% confirmed**. Evidence: **no live JS call site in SteamTracking** (a `JavascriptUrls.txt` line alone doesn't count) **and** non-functional on all variations, e.g. 404/405 at method level, redirect to store home, 400 for every parameter combination, or 500 with empty body for both anon and authed.
- **Still returns live JSON? Keep it**, even if absent from SteamTracking (e.g. `/saleaction/ajaxgetopendoor`).
- If unsure (transient/param-dependent/seasonal, wrong host not yet ruled out, only a lone 500), **do not delete: ask the maintainer.** (Once wrongly removed: `/gid/:groupid/*` was judged dead after probing the wrong host.)
- Seasonal "400 for everything" sale endpoints may be dormant rather than gone; if re-documentation during a live sale is wanted, ask.
- A previously omitted endpoint may later come back; re-check only if the maintainer asks.

### Previously confirmed dead or out of scope (do not re-document)
- `/wishlist/profiles/:steamid/wishlistdata`, `/profiles/:steamid/inventory/json/:appid/:contextid`, `/reservation/ajaxgetuserstate`, `/saleaction/ajaxgetdemoevents`
- `POST /account/setcountry` (405), `/actions/ajaxgetgoldenprofiledata` (500 empty, retired feature)
- `/broadcast/ajaxgettopntagsforappbatch`, `/saleaction/ajaxgetsaletagsrecommendation`, `/saleaction/ajaxgetallitemsforsale`, `/saleaction/ajaxgetdynamicreveals`, `/saleaction/ajaxgetdynamicrevealspreview`, `/saleaction/ajaxrecenttaggedsaleevents`
- `/sale/ajaxgetcommunityitemsfordrops`, `/sale/ajaxoptinsummary`, `/actions/ajaxresolvesubscriptions`, `/contenthub/ajaxgetsalepagediscountsummary`, `/demos/ajaxensuredemohasogg`
- Legacy steamcommunity group curator endpoints `groups/{groupid}/{setcuratordetails,followcurator,createrecommendation,deleterecommendation,updatecurations}` (all return the error HTML page; superseded by `store.steampowered.com/curator/`)
- Out-of-scope HTML controllers: see §1.

(Re-verify this list during audits; remove an entry if the endpoint returns.)

---

## 14. Domain notes (hard-won knowledge)

### Steam response quirks
- PHP empty maps serialize as `[]`; numeric-keyed maps (`{"1":…,"2":…}`) are **objects**. Examples confirmed as objects: `rgCurators`, `rgCurations`, `rgIgnoredApps`, `faceting` (keyed by tag id), `notifications`; `rgIgnoredPackages[]` is a real array. `/actions/ajaxlistfriends` returns an object `{success, friends[]}`, not a root array. `Get-App-User-Details` is keyed by AppID.
- Success values vary by endpoint (`true`, `1`, `15` for not-logged-in, `2` for invalid params, `42` for not found). Record what is observed.
- Some endpoints need extra headers: `/tradeoffer/new/partnerinventory` requires `Referer: https://steamcommunity.com/tradeoffer/new/…` (else `{"success":false,"error":"missing required parameter"}`).
- Some JS has typos that matter (e.g. `palpaltoken` in checkout). Document the real field name seen in the response.
- Typical host mix-ups: Get-User-Partner-Info, Get-App-Demo-Info, Get-Auction-Goo-Value, Update-Broadcast-Settings, Get-Broadcast-Debug-Info and Get-Creator-Home-Apps are `steamcommunity.com`, not `store.steampowered.com`. `Update-Broadcast-Settings` is GET (the legacy JS used POST).

### Comment system (steamcommunity.com), uniform pattern
- URL: `/comment/{Type}/{action}/{owner}/{feature}/` built by `CCommentThread` in SteamTracking `global.js`.
- `render` = GET (query `start`, `totalcount`, `count`), returns `{success, name, start, pagesize, total_count, upvotes, has_upvoted, comments_html, timelastpost}`. Always HTML inside JSON.
- `post`, `delete`, `hideandreport` = **POST** (not GET).
  - post: form `comment`, `count`, `sessionid`, `feature2`
  - delete: form `gidcomment`, `start`, `count`, `sessionid`, `feature2`, `undelete`
  - hideandreport: form `gidcomment`, `hide`, `start`, `count`, `sessionid`, `feature2`
- `name` = `{Type}_{owner}`; some add a feature: `ClanEvent_{clanid}_{eventid}`, `PublishedFile_Public_{steamid}_{sharedfileid}`, `Recommendation_{steamid}_{appid}`, `ForumTopic_{groupid}_{gidforum}_{topicid}`.
- Path variables: Clan `:clanid`/`-1`; ClanEvent `:clanid`/`:eventid` (two vars); ForumTopic `:groupid`/`:gidforum` (topic id is `feature2`); Profile `:steamid`/`-1`; PublishedFile_Public `:steamid`/`:sharedfileid`; Recommendation `:steamid`/`:appid` (no `feature2`).
- `extended_data` (echoed JSON string): ForumTopic = `{topic_permissions{…}, original_poster, topic_gidanswer, forum_appid, forum_public, forum_type, forum_gidfeature}`; PublishedFile_Public = `{contributors[], appid, sharedfile{…}, parent_item_reported}`.
- Posting is rate-limited (observed natural `429` "You've been posting too frequently…").
- Secondary source: `node-steamcommunity` (`components/groups.js`, `components/sharedfiles.js`, discussions PR).

### Mobile confirmations (`/mobileconf/*`, steamcommunity.com)
- Source: SteamTracking `steamcommunity.com/public/javascript/mobile/mobileconf.js` plus `node-steamcommunity` (`components/confirmations.js`) and `steam-totp`.
- Common params: `p` device ID (`android:` + hash of SteamID), `a` 64-bit SteamID, `k` confirmation key (base64 HMAC-SHA1 of time+tag with `identity_secret`), `t` unix timestamp, `m` platform (`android`/`react`), `tag` key-generation tag.
- Endpoints: `GET /mobileconf/getlist`, `GET /mobileconf/details/:confid` (legacy `detailspage/:confid` also works), `GET /mobileconf/ajaxop` (`op` allow/cancel, `cid`, `ck`), `POST /mobileconf/multiajaxop` (`op`, `cid[]`, `ck[]`).
- A test account without a mobile authenticator can only produce failure shapes; success examples are then `` `TODO` ``.

### Curator system
- Server-injected bases: admin `/curator/:clanid/admin/`, public `/curator/:clanid/`, community upload `steamcommunity.com/gid/:clanid/uploadimage/`.
- Source files (SteamTracking store JS): `curator_admin.js` (the `g_strCuratorAdminURL` list, the whole admin family), `curator_common.js`, `curator_recommendations.js`, `curators_browse.js`, `applications/store/curatorreviewlistlanding.js`.
- Some admin endpoints have **no trailing slash** (e.g. `ajaxrespondoffer`, `ajaxextendoffer`); preserve exactly.
- Gated write endpoints legitimately have `` `TODO` `` examples.

### Checkout and carts
- Add-to-cart is `POST /cart/addtocart` (not `/api/addtocart`). The new account cart can't be cleared over HTTP; `/api/removefromcart` only affects the legacy cart.
- Other unfinished store/checkout API entries stay as `` `TODO` `` index lines until researched.

---

## 15. Communication and maintenance

- **Ask** whenever something is unclear (scope, naming, dead vs dormant, placeholder choices, edge semantics). Do not silently guess.
- After each endpoint in interactive mode: summarise what changed in a few lines, list any `TODO`s or open questions, then ask which endpoint is next.
- Be honest about what is verified live versus derived from JS. This goes in your reply to the maintainer, **never** into the wiki page as notes.
- If you find a flaw in existing pages or in your own earlier output (inconsistent descriptions, wrong types, stale examples, wrong host/method), fix it and add a rule here so it can't recur.
- When the maintainer gives a new rule or reverses an old one, **update this file immediately**, replacing the old rule so only the current decision remains.
- Helper tooling you create locally (probing, refreshing examples, validating JSON, scanning for secrets, checking array-vs-object) is for **your** use only: keep it out of the wiki, and don't present it to the maintainer as a deliverable.
