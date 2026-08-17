
const WHATSAPP = "5543999999999";
// Troque pelo seu número.
// Formato: 55 + DDD + número


let products = [];
let today = null;


// Elementos da página
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const category = document.getElementById("category");
const empty = document.getElementById("empty");
const status = document.getElementById("status");



/*
 * Formata o preço em reais
 */
function money(value) {

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

}



/*
 * Converte uma data no formato YYYY-MM-DD
 *
 * Evita problemas de fuso horário.
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
 * Formata a data para DD/MM/YYYY
 */
function formatDate(dateString) {

  return parseDate(dateString)
    .toLocaleDateString("pt-BR");

}



/*
 * Obtém a data atual
 *
 * Usa o fuso horário de São Paulo.
 */
function loadServerDate() {

  const now = new Date();

  const dateString =
    now.toLocaleDateString(
      "en-CA",
      {
        timeZone: "America/Sao_Paulo"
      }
    );

  today = parseDate(dateString);

}



/*
 * Verifica a validade do produto
 *
 * Retorna:
 *
 * vencido = true
 *   Produto não será exibido.
 *
 * alerta = true
 *   Faltam 30 dias ou menos.
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


  const dias =
    Math.ceil(
      diferenca /
      (1000 * 60 * 60 * 24)
    );


  // Produto vencido
  if (dias < 0) {

    return {
      vencido: true,
      alerta: false,
      dias: dias
    };

  }


  // Vence em até 30 dias
  if (dias <= 30) {

    return {
      vencido: false,
      alerta: true,
      dias: dias
    };

  }


  // Produto válido
  return {
    vencido: false,
    alerta: false,
    dias: dias
  };

}



/*
 * Cria o link do WhatsApp
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
 * Mostra os produtos na tela
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

      /*
       * Verifica validade
       */
      const validade =
        statusValidade(product.validade);


      /*
       * Produto vencido não aparece
       */
      if (validade.vencido) {

        return false;

      }


      /*
       * Pesquisa
       */
      const matchesSearch =
        !query ||
        `${product.name} ` +
        `${product.description || ""} ` +
        `${product.id}`
          .toLowerCase()
          .includes(query);


      /*
       * Categoria
       */
      const matchesCategory =
        !selectedCategory ||
        product.category === selectedCategory;


      return (
        matchesSearch &&
        matchesCategory
      );

    });



  /*
   * Monta os cartões
   */
  grid.innerHTML =
    list.map(product => {

      const validade =
        statusValidade(product.validade);


      let validadeHtml = "";


      /*
       * Produto possui validade
       */
      if (product.validade) {

        /*
         * Próximo do vencimento
         */
        if (validade.alerta) {

          const textoDias =
            validade.dias === 0
              ? "vence hoje"
              : `vence em ${validade.dias} dias`;


          validadeHtml = `
            <div class="validade validade-alerta">
              ⚠️ ${textoDias}
              (${formatDate(product.validade)})
            </div>
          `;

        }

        /*
         * Produto válido normalmente
         */
        else {

          validadeHtml = `
            <div class="validade validade-normal">
              Validade:
              ${formatDate(product.validade)}
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


  /*
   * Mostra mensagem quando não há produtos
   */
  empty.hidden =
    list.length !== 0;

}



/*
 * Carrega as categorias
 */
function loadCategories() {

  /*
   * Limpa as categorias existentes
   */
  category.innerHTML =
    '<option value="">Todas as categorias</option>';


  /*
   * Cria lista de categorias únicas
   */
  const categories =
    [
      ...new Set(
        products
          .map(product => product.category)
          .filter(Boolean)
      )
    ]
    .sort();


  /*
   * Adiciona ao SELECT
   */
  categories.forEach(c => {

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


  /*
   * Verifica se o arquivo existe
   */
  if (!response.ok) {

    throw new Error(
      `Erro ao carregar produtos.json: ${response.status}`
    );

  }


  /*
   * Converte JSON
   */
  products =
    await response.json();


  /*
   * Verifica se é realmente uma lista
   */
  if (!Array.isArray(products)) {

    throw new Error(
      "produtos.json precisa conter uma lista de produtos."
    );

  }

}



/*
 * Inicializa o catálogo
 */
async function init() {

  try {

    /*
     * Obtém a data
     */
    status.textContent =
      "Obtendo data atual...";


    /*
     * NÃO usamos await aqui.
     */
    loadServerDate();


    /*
     * Carrega os produtos
     */
    status.textContent =
      "Carregando produtos...";


    await loadProducts();


    /*
     * Carrega categorias
     */
    loadCategories();


    /*
     * Mostra produtos
     */
    render();


    /*
     * Mensagem de sucesso
     */
    status.textContent =
      `${products.length} produtos carregados`;


  } catch (error) {

    /*
     * Mostra erro no console
     */
    console.error(
      "Erro ao inicializar catálogo:",
      error
    );


    /*
     * Mostra erro na página
     */
    status.textContent =
      "Erro ao carregar catálogo.";


    empty.hidden =
      false;


    empty.textContent =
      "Não foi possível carregar os produtos. " +
      "Verifique o arquivo produtos.json.";

  }

}



/*
 * Pesquisa
 */
search.addEventListener(
  "input",
  render
);



/*
 * Filtro de categoria
 */
category.addEventListener(
  "change",
  render
);



/*
 * Inicia o catálogo
 */
init();

