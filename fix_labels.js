const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// The regex will look for <label style="...">Text</label> followed by whitespace, maybe some tags, and an input/select/textarea with an id.
// We'll replace the `<label` with `<label for="[id]"`

const regex = /<label( style="[^"]*")>([^<]+)<\/label>\s*(?:<div[^>]*>\s*)?<(input|select|textarea)[^>]+id="([^"]+)"/g;

content = content.replace(regex, (match, style, text, tag, id) => {
    return `<label for="${id}"${style}>${text}</label>\n                        <${tag} id="${id}"` + match.split(`id="${id}"`)[1];
});

fs.writeFileSync('index.html', content);
console.log('Fixed labels');
