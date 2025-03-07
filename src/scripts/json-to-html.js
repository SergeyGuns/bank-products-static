const selfClosingTags = ["br", "hr", "img", "input", "meta", "link"];

function jsonToHtml(json) {
  if (typeof json === "string") return json;
  const html = json
    .map((item) =>
      typeof item === "string"
        ? item
        : `<${item.tag} ${(item.attributes &&
          Object.keys(item.attributes).length
            ? Object.keys(item.attributes).map(
                (key) => `${key}="${item.attributes[key]}"`,
              )
            : []
          )
            .join(" ")
            .trim()}${selfClosingTags.includes(item.tag) ? "/>" : ">"}${item.children?.length > 0 ? item.children.map(jsonToHtml).join("") : ""}${selfClosingTags.includes(item.tag) ? "" : `</${item.tag}>`}\n`,
    )
    .join("");
  return html;
}

function htmlToJson(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const root = doc.body.firstChild;
  const json = [];
  const stack = [{ node: root, parent: null, index: 0 }];
  while (stack.length > 0) {
    const { node, parent, index } = stack.pop();
    const item = { tag: node.tagName.toLowerCase() };
    if (node.hasAttributes()) {
      item.attributes = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        item.attributes[attr.name] = attr.value;
      }
    }
    if (node.childNodes.length > 0) {
      item.children = [];
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          stack.push({ node: child, parent: item, index: i });
        } else if (child.nodeType === Node.TEXT_NODE) {
          item.children.push(child.textContent);
        }
      }
    }
    json.push(item);
  }
  return json;
}

module.exports = { jsonToHtml };
