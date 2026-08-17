
const WHATSAPP = "5543999999999";

let products = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const category = document.getElementById("category");
const empty = document.getElementById("empty");
const status = document.getElementById("status");


// ===============================
// DATA ATUAL
// ===============================

function getToday() {
  const text = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo"
  });

  const [ano, mes, dia] = text.split("-");

  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia)
  );
}

const today = getToday();


// ===============================
// DATAS
// ===============================

function parseDate(text) {
  const [ano, mes, dia] = text.split("-");

  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia)
  );
}


function formatDate(text) {
  return parseDate(text).toLocaleDateString("pt-BR");
}


// ===============================
// VALIDADE
// ===============================

function validadeInfo(validade) {

  // Produto sem validade
  if (!validade) {
    return {
      vencido: false,
      alerta: false,
      dias: null
    };
  }

  const data = parseDate(validade);

  const diferenca =
    data.getTime() - today.getTime();

  const dias = Math.ceil(
    diferenca / 86400000
  );

  // Vencido
  if (dias < 0) {
    return {
      vencido: true,
      alerta: false,
      dias: dias
    };
  }

  // Até 30 dias
  if (dias <= 30) {
    return {
      vencido: false,
      alerta: true,
      dias: dias
    };
  }

  return {
    vencido: false,
    alerta: false,
    dias: dias
  };
}


// ===============================
// PREÇO
// ===============================

function money(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}


// ===============================
// WHATSAPP
// ===============================

function whatsappUrl(product) {

  const text =
    "Olá! Tenho interesse no produto " +
    product.id +
    " - " +
    product.name +
    ", no valor de " +
    money(product.price) +
    ".";

  return (
    "https://wa.me/" +
    WHATSAPP +
    "?text=" +
    encodeURIComponent(text)
  );
}


// ===============================
// CATEGORIAS
// ===============================

function loadCategories() {

  category.innerHTML =
    '<option value="">Todas as categorias</option>';

  const categories = [
    ...new Set(
      products
        .map(p => p.category)
        .filter(Boolean)
    )
  ];

  categories.sort();

  categories.forEach(c => {

    const option =
      document.createElement("option");

    option.value = c;
    option.textContent = c;

    category.appendChild(option);
  });
}


// ===============================
// EXIBIR PRODUTOS
// ===============================

function render() {

  const text =
    search.value.toLowerCase().trim();

  const selected =
    category.value;

  const list = products.filter(product => {

    const validade =
      validadeInfo(product.validade);

    // Não mostra vencidos
    if (validade.vencido) {
      return false;
    }

    const searchOK =
      !text ||
      (
        product.name +
        " " +
        (product.description || "") +
        " " +
        product.id
      )
      .toLowerCase()
      .includes(text);

    const categoryOK =
      !selected ||
      product.category === selected;

    return searchOK && categoryOK;
  });


  grid.innerHTML = list.map(product => {

    const validade =
      validadeInfo(product.validade);

    let validadeHtml = "";


    if (product.validade) {

      if (validade.alerta) {

        const texto =
          validade.dias === 0
            ? "Vence hoje"
            : `Vence em ${validade.dias} dias`;

        validadeHtml = `
          <div class="validade validade-alerta">
            ⚠️ ${texto}
            (${formatDate(product.validade)})
          </div>
        `;

      } else {

        validadeHtml = `
          <div class="validade validade-normal">
            Validade: ${formatDate(product.validade)}
          </div>
        `;
      }
    }


    return `
      <article class="card">

        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
        >

        <div class="content">

          <div class="category">
            ${product.category}
          </div>

          <div class="name">
            ${product.name}
          </div>

          <div class="desc">
            ${product.description || ""}
          </div>

          <div class="price">
            ${money(product.price)}
          </div>

          ${validadeHtml}

          <button
            onclick="window.open(
              '${whatsappUrl(product)}',
              '_blank'
            )"
          >
            🟢 Comprar pelo WhatsApp
          </button>

        </div>

      </article>
    `;
  }).join("");


  empty.hidden = list.length > 0;
}


// ===============================
// CARREGAR PRODUTOS
// ===============================

function loadProducts() {

  status.textContent =
    "Carregando produtos...";

  fetch("produtos.json")
    .then(response => {

      if (!response.ok) {
        throw new Error(
          "produtos.json não encontrado"
        );
      }

      return response.json();
    })

    .then(data => {

      if (!Array.isArray(data)) {
        throw new Error(
          "produtos.json deve ser uma lista"
        );
      }

      products = data;

      loadCategories();

      render();

      status.textContent =
        `${products.length} produtos carregados`;
    })

    .catch(error => {

      console.error(error);

      status.textContent =
        "Erro ao carregar catálogo";

      empty.hidden = false;

      empty.textContent =
        "Erro ao carregar produtos.json";
    });
}


// ===============================
// EVENTOS
// ===============================

search.addEventListener(
  "input",
  render
);

category.addEventListener(
  "change",
  render
);


// ===============================
// INICIAR
// ===============================

loadProducts();

