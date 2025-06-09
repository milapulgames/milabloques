Mila.Modulo({
  define:"Mila.Bloques.Escritorio",
  necesita:["$milascript/base","$milascript/pantalla"]
});

Mila.Bloques.nuevoEscritorio = function(atributos={}) {
  return new Mila.Bloques._Escritorio(atributos);
};

Mila.Bloques._Escritorio = function EscritorioBloques(atributos) {
  this.catalogo = 'catalogo' in atributos
    ? Mila.Bloques.Catalogo.aPartirDe_(atributos.catalogo)
    : Mila.Bloques.Catalogo._porDefecto()
  ;
};

Mila.Bloques._Escritorio.prototype.PlasmarEnHtml = function(nodoMadre) {
  if (!('_nodoHtml' in this)) {
    this._nodoHtml = document.createElement('div');
    this._nodoHtml.style.margin = '0';
    this._nodoHtml.style.padding = '0';
    this._nodoHtml.style.position = 'absolute';
    nodoMadre.appendChild(this._nodoHtml);

    // Toolbox Blockly
    const fBloque = bloque => {
      return {kind:'block', 'type':bloque};
    };
    const fCajon = cajon => {
      return {kind:'category', 'name':cajon.nombre(), 'contents':fContenido(cajon)};
    };
    const fContenido = contenido =>  {
      return contenido.cajones().map(fCajon).concat(contenido.bloques().map(fBloque));
    };
    const toolbox = {};
    toolbox.kind = this.catalogo.tieneCajones() ? 'categoryToolbox' : 'flyoutToolbox';
    toolbox.contents = fContenido(this.catalogo);

    // Blockly
    this._blockly = Blockly.inject(this._nodoHtml, {
      toolbox: toolbox
    });
  }
};

Mila.Bloques._Escritorio.prototype.Redimensionar = function(rectangulo) {
  if ('_nodoHtml' in this) {
    this._nodoHtml.style.left = `${rectangulo.x}px`;
    this._nodoHtml.style.top = `${rectangulo.y}px`;
    this._nodoHtml.style.width = `${rectangulo.ancho}px`;
    this._nodoHtml.style.height = `${rectangulo.alto}px`;
    Blockly.svgResize(this._blockly);
  }
  return rectangulo;
};

Mila.Bloques._Escritorio.prototype.CambiarBloquesA_ = function(listaDeBloques) {
  Blockly.Xml.domToWorkspace(
    Blockly.utils.xml.textToDom(`<xml>${
      listaDeBloques.transformados(function(bloque) {
        return Blockly.Xml.domToText(Blockly.Xml.blockToDom(bloque))
      })
    }</xml>`),
    this._blockly
  );
};

Mila.Bloques._Escritorio.prototype.todosLosBloques = function() {
  return this._blockly.getAllBlocks();
};

Mila.Bloques._Escritorio.prototype.bloquesSueltos = function() {
  return this._blockly.getTopBlocks();
};

Mila.Bloques._Escritorio.prototype.bloquesSuperiores = function() {
  return this.bloquesSueltos().filter(Mila.Bloques.Bloque.esSuperior);
};

Mila.Tipo.Registrar({
  nombre:'EscritorioBloques',
  prototipo: Mila.Bloques._Escritorio,
  subtipoDe: Mila.Tipo.ElementoVisual
});