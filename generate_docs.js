/**
 * Generate a API docs proposal based on the webpage it is executed on
 * @returns {string} - The API docs proposal
 */
function generateDocs(json, url, authed = null) {
    json = json || JSON.parse(document.body.innerText);
    url = url ? new URL(url) : new URL(location.href);

    function buildDocs(json, extraCols, prefix) {
        let text = "";
        let todo = new Array(extraCols).fill(` \`TODO\` |`).join("");
        for (let [key, value] of Object.entries(json)) {
            let name = `${prefix}${key}${Array.isArray(value) ? "[]" : ""}`;
            text += `> | \`${name}\` | ${Array.isArray(value) ? "array" : typeof value
                } |${todo}\n`;
            if (Array.isArray(value) && value.length > 0) {
                if (value.every(v => v instanceof Object)) {
                    let combined = {};
                    for (let item of value) {
                        combined = Object.assign(combined, item);
                    }
                    text += buildDocs(combined, extraCols, name + ".");
                } else {
                    text += buildDocs(value[0], extraCols, name + ".");
                }
            } else if (typeof value === "object" && value !== null) {
                text += buildDocs(value, extraCols, name + ".");
            }
        }
        return text;
    }

    let params = {};
    for (let [key, value] of url.searchParams.entries()) {
        params[key] = value;
    }
    let paramDocs = buildDocs(params, 2, "");
    let responseDocs = "";

    if (Array.isArray(json) && json.length > 0) {
        responseDocs = `> | \`[]\` | array | \`TODO\` |\n${buildDocs(json[0], 1, "[]")}`;
    } else {
        responseDocs = buildDocs(json, 1, "");
    }

    let output = `# GET ${url.pathname}

## Rate limits
> *No known rate limit*

## Request
> **Authenticated**: ${authed === false ? "No" : authed === true ? "Yes" : `\`TODO\``}
> 
> **Method**: \`GET\`
> 
> **Host**: \`${url.host}\`
> 
> **Path**: \`${url.pathname}\`
> 
> **Query Parameters**:
> | **Name** | **Type** | **Required** | **Description** |
> |:---|:---|:---|:---|
${paramDocs}

## Response
> ### 200 OK
> | **Name** | **Type** | **Description** |
> |:---|:---|:---|
${responseDocs}

## Example
\`\`\`
GET ${url.href}
\`\`\`
\`\`\`json
${JSON.stringify(json, null, 4)}
\`\`\``;

    return output;
}

if (typeof module === "object") {
    module.exports = generateDocs;
} else {
    console.log(generateDocs());
}