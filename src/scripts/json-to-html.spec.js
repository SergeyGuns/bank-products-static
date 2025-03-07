const { jsonToHtml } = require("./json-to-html");

describe("JSON to HTML", () => {
  it("should convert JSON to HTML", () => {
    const { current, expected } = getMock();
    const result = jsonToHtml(current);
    expect(result).toEqual(expected);
  });
});

function getMock() {
  const current = [
    {
      tag: "meta",
      attributes: {
        name: "description",
        content:
          "Узнайте, как правильно выбрать кредит наличными, чтобы избежать неприятных сюрпризов и сделать выгодный выбор.",
      },
    },
    {
      tag: "meta",
      attributes: {
        name: "keywords",
        content:
          "кредит наличными, выбор кредита, финансовые советы, процентная ставка, условия кредита",
      },
    },
    {
      tag: "meta",
      attributes: {
        name: "title",
        content: "Как правильно выбрать кредит наличными",
      },
    },
    {
      tag: "title",
      children: ["Как правильно выбрать кредит наличными"],
    },
  ];
  const expected = `<meta name="description" content="Узнайте, как правильно выбрать кредит наличными, чтобы избежать неприятных сюрпризов и сделать выгодный выбор."/>
<meta name="keywords" content="кредит наличными, выбор кредита, финансовые советы, процентная ставка, условия кредита"/>
<meta name="title" content="Как правильно выбрать кредит наличными"/>
<title >Как правильно выбрать кредит наличными</title>
`;
  return {
    current,
    expected,
  };
}
