```javascript
const WHATSAPP = "5543999999999";
// Troque pelo seu número.
// Formato: 55 + DDD + número


let products = [];
let today = null;


const grid = document.getElementById("grid");
const search = document.getElementById("search");
const category = document.getElementById("category");
const empty = document.getElementById("empty");
const status = document.getElementById("status");



/*
 * Formata valores em reais
 */
function money(value) {

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

}



/*
 * Converte YYYY-MM-DD
 * sem problemas de fuso horário.
 */
function parseDate(dateString) {

  const parts = dateString.split("-");

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

}



/*
 * Formata data para DD/MM/YYYY
 */
function formatDate(dateString) {

  return parseDate(dateString)
    .toLocaleDateString("pt-BR");

}



/*
 * Verifica validade do produto
 */
function statusValidade(validade) {

  // Produto sem validade
  if (!validade) {

    return {
      vencido: false,
      alerta: false,
      dias: null
    };

  }


  const dataValidade =
    parseDate(validade);


  const diferenca =
    dataValidade.getTime() -
    today.getTime();


  const dias = Math.ceil(
    diferenca /
    (1000 * 60 * 60 * 24)
  );


  // Produto vencido
  if (dias < 0) {

    return {
      vencido: true,
      alerta: false,
      dias
    };

  }


  // Até 30 dias para vencer
  if (dias <= 30) {

    return {
      vencido: false,
      alerta: true,
      dias
    };

  }


  return {
    vencido: false,
    alerta: false,
    dias
  };

}



/*
 * Link para WhatsApp
 */
function whatsappUrl(product) {

  const text =
    `Olá! Tenho interesse no produto ` +
    `${product.id} - ${product.name}, ` +
    `no valor de ${money(product.price)}.`;

  return (
    `https://wa.me/${WHATSAPP}` +
    `?text=${encodeURIComponent(text)}`
  );

}



/*
 * Mostra os produtos
 */
function render() {

  const query =
    search.value
      .toLowerCase()
      .trim();


  const selectedCategory =
    category.value;


  const list =
    products.filter(product => {

      const validade =
        statusValidade(product.validade);


      // Não mostra produto vencido
      if (validade.vencido) {
        return false;
      }


      const matchesSearch =
        !query ||
        `${product.name} ` +
        `${product.description} ` +
        `${product.id}`
          .toLowerCase()
          .includes(query);


      const matchesCategory =
        !selectedCategory ||
        product.category === selectedCategory;


      return (
        matchesSearch &&
        matchesCategory
      );

    });



  grid.innerHTML =
    list.map(product => {

      const validade =
        statusValidade(product.validade);


      let validadeHtml = "";


      if (product.validade) {

        if (validade.alerta) {

          validadeHtml = `
            <div class="validade validade-alerta">
              ⚠️ Vence em ${validade.dias} dias
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
              ${product.description}
            </div>

            <div class="price">
              ${money(product.price)}
            </div>

            ${validadeHtml}

            <button
              onclick='window.open(
                "${whatsappUrl(product)}",
                "_blank"
              )'
            >
              🟢 Comprar pelo WhatsApp
            </button>

          </div>

        </article>
      `;

    })
    .join("");


  empty.hidden =
    list.length !== 0;

}



/*
 * Carrega categorias
 */
function loadCategories() {

  category.innerHTML =
    '<option value="">Todas as categorias</option>';


  [
    ...new Set(
      products.map(
        product => product.category
      )
    )
  ]
  .sort()
  .forEach(c => {

    const option =
      document.createElement("option");

    option.value = c;
    option.textContent = c;

    category.appendChild(option);

  });

}



/*
 * Carrega produtos.json
 */
async function loadProducts() {

  const response =
    await fetch("produtos.json");


  if (!response.ok) {

    throw new Error(
      "Não foi possível carregar produtos.json"
    );

  }


  products =
    await response.json();

}



/*
 * Consulta a data atual
 * no servidor.
 */
async function loadServerDate() {

  const response =
    await fetch(
      "https://worldtimeapi.org/api/timezone/America/Sao_Paulo"
    );


  if (!response.ok) {

    throw new Error(
      "Não foi possível obter a data do servidor"
    );

  }


  const data =
    await response.json();


  const serverDate =
    new Date(data.datetime);


  today = new Date(
    serverDate.getFullYear(),
    serverDate.getMonth(),
    serverDate.getDate()
  );

}



/*
 * Inicializa o catálogo
 */
async function init() {

  try {

    status.textContent =
      "Obtendo data atual...";


    await loadServerDate();


    status.textContent =
      "Carregando produtos...";


    await loadProducts();


    loadCategories();


    render();


    status.textContent =
      `${products.length} produtos carregados`;


  } catch (error) {

    console.error(error);


    status.textContent =
      "Erro ao carregar catálogo.";


    empty.hidden = false;


    empty.textContent =
      "Não foi possível carregar os produtos.";

  }

}



/*
 * Eventos
 */
search.addEventListener(
  "input",
  render
);


category.addEventListener(
  "change",
  render
);



/*
 * Inicia
 */
init();
```
