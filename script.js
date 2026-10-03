let paginaAtiva = null;
document.addEventListener('focusin', (e) => {
  if (e.target.classList.contains('pagina')) paginaAtiva = e.target;
});

function getEditor() { return paginaAtiva || document.querySelector('.pagina'); }

function formatar(comando) {
  const editor = getEditor(); editor.focus();
  document.execCommand(comando, false, null);
}
function mudarCor() {
  const cor = document.getElementById('cor').value;
  const editor = getEditor(); editor.focus();
  document.execCommand('foreColor', false, cor);
}
function mudarTamanho() {
  const tamanho = document.getElementById('tamanho').value;
  const editor = getEditor(); editor.focus();
  document.execCommand('fontSize', false, tamanho);
}
function salvar() {
  let nome = document.getElementById('nomeDoc').value;
  let texto = document.getElementById('editor-container').innerHTML;
  if (nome === "") { alert("Escreve um nome!"); return; }
  let docs = JSON.parse(localStorage.getItem('meusDocs')) || {};
  docs[nome] = texto;
  localStorage.setItem('meusDocs', JSON.stringify(docs));
  listarDocs();
}
function listarDocs() {
  let docs = JSON.parse(localStorage.getItem('meusDocs')) || {};
  let lista = document.getElementById('listaDocs');
  lista.innerHTML = "";
  for (let nome in docs) {
    lista.innerHTML += `<button onclick="abrirDoc('${nome}')">${nome}</button> `;
  }
}
function abrirDoc(nome) {
  let docs = JSON.parse(localStorage.getItem('meusDocs'));
  document.getElementById('editor-container').innerHTML = docs[nome];
  document.getElementById('nomeDoc').value = nome;
  contar();
}
function novoDoc() {
  document.getElementById('editor-container').innerHTML = '<div class="pagina" contenteditable="true">Escreve aqui...</div>';
  document.getElementById('nomeDoc').value = "";
}
function contar() {
  let texto = document.getElementById('editor-container').innerText;
  let palavras = texto.trim().split(/\s+/);
  let total = texto.trim() === ""? 0 : palavras.length;
  document.getElementById('contador').innerText = "Palavras: " + total;
}
document.getElementById('editor-container').addEventListener('input', contar);
window.onload = function() { listarDocs(); contar(); }

function baixarWord() {
  let nome = document.getElementById('nomeDoc').value || "documento";
  let conteudo = document.getElementById('editor-container').innerHTML;
  let header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><style>.pagina{white-space:pre-wrap;font-family:'Times New Roman';margin-bottom:20px;}</style></head><body>";
  let footer = "</body></html>";
  let blob = new Blob([header + conteudo + footer], {type: "application/msword;charset=utf-8"});
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome + ".doc";
  a.click();
}
function baixarPDFsimples() {
  let conteudo = document.getElementById('editor-container').innerHTML;
  let w = window.open('', '', 'height=900,width=800');
  w.document.write(`<html><head><title>PDF</title><style>
    body{font-family:'Times New Roman';}
   .pagina{white-space:pre-wrap!important;word-spacing:normal!important;page-break-after:always;padding:50px;font-size:12pt;line-height:1.6;text-align:justify;}
  </style></head><body>${conteudo}</body></html>`);
  w.document.close();
  w.print();
}
function gerarCapa() {
  const capa = `<div class="pagina" style="text-align:center; display:flex; flex-direction:column; justify-content:space-between; height:900px;">
      <div><p style="font-weight:bold;">${document.getElementById('uni').value.toUpperCase()}</p><p>${document.getElementById('facul').value}</p><p>${document.getElementById('curso').value}</p></div>
      <div><p>${document.getElementById('nome').value}</p><br><br><h2 style="font-weight:bold;">${document.getElementById('titulo').value.toUpperCase()}</h2></div>
      <div><p>${document.getElementById('local').value}</p><p>${document.getElementById('ano').value}</p></div>
    </div>`;
  document.getElementById('editor-container').insertAdjacentHTML('afterbegin', capa);
  document.getElementById('capa-modal').style.display='none';
}
function novaPagina() {
  const nova = document.createElement('div');
  nova.className = 'pagina'; nova.contentEditable = true; nova.innerHTML = 'Escreve aqui...';
  document.getElementById('editor-container').appendChild(nova);
  nova.focus();
}

// --- MATEMATICA ---
function abrirMatematica(){
  document.getElementById('math-modal').style.display='block';
  document.getElementById('latexInput').focus();
}

// Preview em tempo real
document.addEventListener('input', (e)=>{
  if(e.target.id === 'latexInput'){
    try{
      katex.render(e.target.value, document.getElementById('previewMath'), {throwOnError:false});
    }catch(err){
      document.getElementById('previewMath').innerText = "Escrevendo...";
    }
  }
});

function inserirFormula(){
  const latex = document.getElementById('latexInput').value;
  if(!latex) return;
  const span = document.createElement('span');
  span.className = 'formula-math';
  span.setAttribute('data-latex', latex);
  span.contentEditable = false;
  try{
    katex.render(latex, span, {throwOnError:false});
  }catch{
    span.innerText = latex;
  }
  const editor = getEditor();
  editor.focus();
  // insere no cursor
  document.execCommand('insertHTML', false, span.outerHTML + '&nbsp;');
  document.getElementById('math-modal').style.display='none';
  document.getElementById('latexInput').value='';
  document.getElementById('previewMath').innerHTML='';
}

function inserirFracao(){
  const num = prompt("Numerador (em cima):");
  const den = prompt("Denominador (em baixo):");
  if(!num || !den) return;
  abrirMatematica();
  document.getElementById('latexInput').value = `\\frac{${num}}{${den}}`;
  document.getElementById('latexInput').dispatchEvent(new Event('input'));
}

// Quando abrir documento salvo, renderiza as fórmulas de novo
function renderizarFormulasSalvas(){
  document.querySelectorAll('.formula-math').forEach(el=>{
    const latex = el.getAttribute('data-latex');
    if(latex) katex.render(latex, el, {throwOnError:false});
  });
}
// Chama toda vez que abrir doc
const abrirDocOriginal = abrirDoc;
abrirDoc = function(nome){
  abrirDocOriginal(nome);
  setTimeout(renderizarFormulasSalvas, 200);
}
// --- BOTAO APAGAR INTELIGENTE ---
function apagarCoisa(){
  const editor = getEditor();
  const selecao = window.getSelection();
  const textoSelecionado = selecao.toString();

  // CASO 1: Tem texto selecionado -> apaga seleção
  if(textoSelecionado.length > 0){
    document.execCommand('delete', false, null);
    contar();
    return;
  }

  // CASO 2: Clicou em uma fórmula -> apaga fórmula
  if(selecao.anchorNode && selecao.anchorNode.parentElement.classList.contains('formula-math')){
    selecao.anchorNode.parentElement.remove();
    return;
  }
  if(selecao.anchorNode && selecao.anchorNode.classList && selecao.anchorNode.classList.contains('formula-math')){
    selecao.anchorNode.remove();
    return;
  }

  // CASO 3: Nada selecionado -> apaga a página atual
  if(paginaAtiva){
    if(document.querySelectorAll('.pagina').length === 1){
      if(confirm("Só tem 1 página. Quer limpar tudo?")){
        paginaAtiva.innerHTML = "Escreve aqui...";
        contar();
      }
    } else {
      if(confirm("Apagar esta página?")){
        paginaAtiva.remove();
        paginaAtiva = document.querySelector('.pagina');
        contar();
      }
    }
  }
}

// Apagar documento salvo da lista (com X)
function listarDocs(){
  let docs = JSON.parse(localStorage.getItem('meusDocs')) || {};
  let lista = document.getElementById('listaDocs');
  lista.innerHTML = "";
  for (let nome in docs) {
    lista.innerHTML += `<span style="display:inline-flex;align-items:center;margin:3px;background:white;border:1px solid #ccc;border-radius:6px;overflow:hidden;">
      <button onclick="abrirDoc('${nome}')" style="border:none;background:white;padding:6px 10px;">${nome}</button>
      <button onclick="apagarDoc('${nome}')" style="border:none;background:#ffdddd;padding:6px 8px;">X</button>
    </span> `;
  }
}

function apagarDoc(nome){
  if(confirm(`Apagar "${nome}" para sempre?`)){
    let docs = JSON.parse(localStorage.getItem('meusDocs')) || {};
    delete docs[nome];
    localStorage.setItem('meusDocs', JSON.stringify(docs));
    listarDocs();
  }
}

// Atalho do teclado: tecla Delete já funciona, mas vamos melhorar
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Delete' && e.target.classList.contains('formula-math')){
    e.target.remove();
  }
});