(() => {
  const C = window.VITRINE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const moeda = (v) => (v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi` : `R$ ${Math.round(v / 1000)} mil`);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let imoveis = [];
  let atual = null; // imóvel do formulário

  if (C.creci) $("#creci").textContent = `· CRECI ${C.creci}`;

  /* Google Ads */
  if (C.googleAdsId) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(C.googleAdsId)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", C.googleAdsId);
  }
  const conversao = (rotulo) => {
    if (C.googleAdsId && rotulo && window.gtag) gtag("event", "conversion", { send_to: `${C.googleAdsId}/${rotulo}` });
  };

  // De onde veio: anúncio do Google (gclid / utm_campaign) — vai pra ficha do lead no K1.
  const campanha = () => {
    const q = new URLSearchParams(location.search);
    const c = q.get("utm_campaign") || "";
    return q.get("gclid") || q.get("gbraid") || q.get("wbraid") || /google/i.test(q.get("utm_source") || "")
      ? `Google Ads${c ? ` — ${c}` : ""}`
      : c;
  };

  /* WhatsApp */
  const abrirZap = (imovel) => {
    conversao(C.conversaoWhatsapp);
    const msg = imovel
      ? `Olá! Vi o *${imovel}* no site da Kayser e quero saber valores e condições.`
      : "Olá! Vi os imóveis no site da Kayser e quero saber mais.";
    const num = String(C.whatsapp || "").replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  /* Cartões */
  const entrega = (p) => {
    if (p.status === "Pronto para morar" || !p.entrega) return null;
    const [a, m] = p.entrega.split("-");
    return `Entrega ${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+m - 1]}/${a}`;
  };
  const area = (p) => (p.areaMin ? (p.areaMax && p.areaMax - p.areaMin >= 1 ? `${Math.round(p.areaMin)} a ${Math.round(p.areaMax)} m²` : `${Math.round(p.areaMin)} m²`) : null);
  const ficha = (p) =>
    [p.quartos && `${p.quartos} quarto${p.quartos > 1 ? "s" : ""}`, area(p), p.vagas && `${p.vagas} vaga${p.vagas > 1 ? "s" : ""}`, entrega(p)]
      .filter(Boolean)
      .map((x) => `<li>${esc(x)}</li>`)
      .join("");

  const precoHtml = (p) => {
    const o = (C.blackFriday || {})[p.id];
    if (o) {
      const bf = typeof o === "number" ? o : o.preco;
      const un = typeof o === "object" && o.unidade ? `${esc(o.unidade)} ` : "";
      return `<p class="preco">${p.preco && p.preco > bf ? `<s>de ${moeda(p.preco)}</s> · ` : ""}${un}por <strong class="preco-bf">${moeda(bf)}</strong></p>`;
    }
    return p.preco ? `<p class="preco">a partir de <strong>${moeda(p.preco)}</strong></p>` : `<p class="preco">valores <strong>sob consulta</strong></p>`;
  };

  const cartao = (p) => `
    <article class="cartao" data-id="${esc(p.id)}">
      <div class="cartao-brilho"></div>
      <div class="cartao-foto">
        <span class="selo ${p.status === "Pronto para morar" ? "pronto" : ""}">${esc(p.status)}</span>
        ${(C.blackFriday || {})[p.id] ? `<span class="selo-bf">Black Friday</span>` : ""}
        <img src="${esc(p.fotos[0])}" alt="Fachada do ${esc(p.nome)}" loading="lazy" />
      </div>
      <div class="cartao-corpo">
        <h3>${esc(p.nome)}</h3>
        <p class="local">${esc([p.bairro, p.cidade].filter(Boolean).join(", "))}</p>
        ${precoHtml(p)}
        <ul class="ficha">${ficha(p)}</ul>
        <div class="cartao-acoes">
          <button class="btn-ouro" data-form="${esc(p.nome)}">Ver condição Black Friday</button>
          <button class="btn-zap" data-zap="${esc(p.nome)}" aria-label="WhatsApp sobre o ${esc(p.nome)}">WhatsApp</button>
        </div>
        <div class="cartao-rodape">
          <button class="ver-mais" data-ver="${esc(p.id)}">Ver detalhes</button>
          ${p.book ? `<button class="ver-mais book" data-book="${esc(p.id)}">📘 Receber o book</button>` : ""}
        </div>
      </div>
    </article>`;

  const inclinar = (el) => {
    if (reduz || matchMedia("(hover: none)").matches) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(6px)`;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  };

  const desenhar = () => {
    const regiao = $("#f-regiao").value;
    const status = $("#f-status").value;
    const teto = +$("#f-preco").value || Infinity;
    const lista = imoveis.filter(
      (p) => (!regiao || p.bairro === regiao) && (!status || p.status === status) && (teto === Infinity || (p.preco && p.preco <= teto))
    );
    $("#grade").innerHTML = lista.map(cartao).join("");
    $("#vazio").hidden = lista.length > 0;
    $$(".cartao").forEach(inclinar);
  };

  /* Pilha 3D do topo */
  const pilha = (lista) => {
    const el = $("#pilha");
    const top = lista.filter((p) => p.fotos[0]).slice(0, 4);
    el.innerHTML = top
      .map(
        (p) => `<figure class="pilha-carta" style="background-image:url('${esc(p.fotos[0])}')">
          <figcaption><b>${esc(p.nome)}</b><span>${esc(p.bairro)}${p.preco ? ` · a partir de ${moeda(p.preco)}` : ""}</span></figcaption>
        </figure>`
      )
      .join("");
    const cartas = $$(".pilha-carta", el);
    let frente = 0;
    let rx = 0, ry = 0;
    const posicionar = () => {
      cartas.forEach((c, i) => {
        const k = (i - frente + cartas.length) % cartas.length; // 0 = da frente
        c.style.zIndex = String(10 - k);
        c.classList.toggle("frente", k === 0);
        c.style.opacity = k > 2 ? "0" : String(1 - k * 0.18);
        c.style.transform = `translate3d(${k * 34}px, ${-k * 26}px, ${-k * 120}px) rotateY(${-14 + ry}deg) rotateX(${6 + rx}deg) rotateZ(${k * 2.5}deg)`;
      });
    };
    posicionar();
    if (!reduz && cartas.length > 1) setInterval(() => { frente = (frente + 1) % cartas.length; posicionar(); }, 3800);
    if (!reduz) {
      $(".hero").addEventListener("pointermove", (e) => {
        ry = (e.clientX / innerWidth - 0.5) * 16;
        rx = (0.5 - e.clientY / innerHeight) * 10;
        posicionar();
      });
    }
  };

  /* Detalhe */
  const verDetalhe = (id) => {
    const p = imoveis.find((x) => x.id === id);
    if (!p) return;
    $("#d-conteudo").innerHTML = `
      <div class="d-galeria">${p.fotos.map((f, i) => `<img src="${esc(f)}" alt="${esc(p.nome)} — foto ${i + 1}" />`).join("")}</div>
      <div class="d-corpo">
        <span class="selo" style="position:static;display:inline-block;margin-bottom:10px">${esc(p.status)}</span>
        <h3 id="d-nome">${esc(p.nome)}</h3>
        <p class="local" style="color:var(--cinza);margin:0 0 12px">${esc([p.bairro, p.cidade].filter(Boolean).join(", "))}</p>
        ${precoHtml(p)}
        <ul class="ficha">${ficha(p)}</ul>
        ${p.descricao ? `<p class="d-texto">${esc(p.descricao)}</p>` : ""}
        ${p.comodidades.length ? `<ul class="d-comod">${p.comodidades.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
        ${p.stand ? `<p class="d-stand">📍 <strong>Stand de vendas:</strong> ${esc(p.stand)}</p>` : ""}
        <div class="d-acoes">
          <button class="btn-ouro" data-form="${esc(p.nome)}">Quero receber condições</button>
          ${p.book ? `<button class="btn-linha" data-book="${esc(p.id)}">📘 Receber o book</button>` : ""}
          <button class="btn-zap" data-zap="${esc(p.nome)}">Falar no WhatsApp</button>
        </div>
      </div>`;
    $("#detalhe").showModal();
  };

  /* Formulário em etapas (igual ao do anúncio do Facebook) */
  const form = $("#f");
  let etapa = 1;
  const mostrarEtapa = (n) => {
    etapa = n;
    $$(".etapa", form).forEach((e) => (e.hidden = +e.dataset.etapa !== n));
    $("#f-progresso").style.width = `${Math.min(n, 4) * 25}%`;
    $("#f-voltar").style.visibility = n > 1 && n < 5 ? "visible" : "hidden";
    $("#f-continuar").textContent = n === 4 ? "Enviar" : "Continuar";
    $("#f-acoes").hidden = n === 5;
    $(".f-topo", form).hidden = n === 5;
    $("#f-erro").textContent = "";
  };
  let bookAtual = null; // book liberado depois de enviar
  const abrirForm = (imovel, book) => {
    atual = imovel || null;
    bookAtual = book || null;
    form.reset();
    $("#f-imovel").textContent = atual ? atual : "";
    $("#f-titulo").textContent = book ? "Receba o book completo" : atual ? "Sua condição de Black Friday" : "Encontre o imóvel ideal para você";
    $("#f-book").hidden = !book;
    if (book) $("#f-book").href = book;
    mostrarEtapa(1);
    if ($("#detalhe").open) $("#detalhe").close();
    $("#form").showModal();
  };
  const valida = () => {
    const d = new FormData(form);
    if (etapa === 1 && !d.get("renda")) return "Escolha a faixa de renda.";
    if (etapa === 2 && !d.get("objetivo")) return "Escolha morar ou investir.";
    if (etapa === 3) {
      if (String(d.get("nome") || "").trim().length < 3) return "Digite seu nome completo.";
      const t = String(d.get("telefone") || "").replace(/\D/g, "");
      if (t.length < 10 || t.length > 13) return "Digite o telefone com DDD.";
      const e = String(d.get("email") || "").trim();
      if (e && !/^\S+@\S+\.\S+$/.test(e)) return "Confira o e-mail.";
    }
    return "";
  };
  $("#f-voltar").addEventListener("click", () => mostrarEtapa(etapa - 1));
  $("#f-continuar").addEventListener("click", async () => {
    const erro = valida();
    if (erro) return ($("#f-erro").textContent = erro);
    if (etapa < 4) return mostrarEtapa(etapa + 1);
    const d = Object.fromEntries(new FormData(form));
    const btn = $("#f-continuar");
    btn.disabled = true;
    btn.textContent = "Enviando...";
    try {
      const r = await fetch(C.api || "https://kayser-one-backend-production.up.railway.app/api/v1/meta/vitrine-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, imovel: atual || "", fila: C.fila || "swat", campanha: campanha() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.erro || "Não conseguimos enviar agora. Tente pelo WhatsApp.");
      conversao(C.conversaoFormulario);
      mostrarEtapa(5);
      // Pediu o book: o book é a recompensa (abre o PDF); o WhatsApp fica no botão.
      if (bookAtual) window.open(bookAtual, "_blank", "noopener");
      else if (d.zap) setTimeout(() => abrirZap(atual), 900);
    } catch (e) {
      $("#f-erro").textContent = e.message;
    } finally {
      btn.disabled = false;
      if (etapa === 4) btn.textContent = "Enviar";
    }
  });
  $("#f-zap").addEventListener("click", () => abrirZap(atual));
  // Escolher a opção já avança (como no Facebook).
  form.addEventListener("change", (e) => {
    if (e.target.type === "radio" && (etapa === 1 || etapa === 2)) setTimeout(() => mostrarEtapa(etapa + 1), 220);
  });

  /* Cliques */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-form],[data-zap],[data-ver],[data-book],[data-fechar],#limpar");
    if (!t) return;
    if (t.matches("[data-book]")) {
      const p = imoveis.find((x) => x.id === t.dataset.book);
      if (p) abrirForm(p.nome, p.book);
    } else if (t.matches("[data-form]")) abrirForm(t.dataset.form);
    else if (t.matches("[data-zap]")) abrirZap(t.dataset.zap);
    else if (t.matches("[data-ver]")) verDetalhe(t.dataset.ver);
    else if (t.matches("[data-fechar]")) t.closest("dialog").close();
    else if (t.id === "limpar") {
      $$(".filtros select").forEach((s) => (s.value = ""));
      desenhar();
    }
  });
  $$("dialog").forEach((d) => d.addEventListener("click", (e) => e.target === d && d.close()));
  $$(".filtros select").forEach((s) => s.addEventListener("change", desenhar));

  /* Carrega os imóveis */
  fetch("imoveis.json")
    .then((r) => r.json())
    .then((lista) => {
      // Lançamentos primeiro, depois obras, depois prontos; dentro, do mais barato.
      const ordem = { "Lançamento": 0, "Em obras": 1, "Pronto para morar": 2 };
      const bf = (p) => ((C.blackFriday || {})[p.id] ? 0 : 1); // oferta de Black Friday na frente
      imoveis = lista.sort((a, b) => bf(a) - bf(b) || ordem[a.status] - ordem[b.status] || (a.preco || 9e9) - (b.preco || 9e9));
      const bairros = [...new Set(imoveis.map((p) => p.bairro).filter(Boolean))].sort();
      $("#f-regiao").insertAdjacentHTML("beforeend", bairros.map((b) => `<option>${esc(b)}</option>`).join(""));
      $("#qtd-imoveis").textContent = imoveis.length;
      const menor = Math.min(...imoveis.map((p) => p.preco || Infinity));
      if (isFinite(menor)) $("#menor-preco").textContent = moeda(menor);
      pilha(imoveis.filter((p) => p.status !== "Pronto para morar").concat(imoveis));
      // Link do anúncio: ?regiao=Barra Olímpica já filtra; ?imovel=stillo-barra abre o imóvel.
      const q = new URLSearchParams(location.search);
      const regiao = bairros.find((b) => b.toLowerCase() === String(q.get("regiao") || "").toLowerCase());
      if (regiao) $("#f-regiao").value = regiao;
      desenhar();
      if (regiao || q.get("imovel")) $("#imoveis").scrollIntoView();
      if (q.get("imovel")) verDetalhe(q.get("imovel"));
    });
})();
