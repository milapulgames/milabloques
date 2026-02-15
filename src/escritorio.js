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

Mila.Bloques._Escritorio.prototype.CambiarBloquesA_ = function(ast) {
  this._blockly.clear();
  ast.transformados(tmpNodoABloque(this));
};

Mila.Bloques._Escritorio.prototype.todosLosBloques = function() {
  return this._blockly.getAllBlocks();
};

Mila.Bloques._Escritorio.prototype.bloquesSueltos = function() {
  return this._blockly.getTopBlocks().transformados(tmpBloqueANodo(this));
};

Mila.Bloques._Escritorio.prototype.bloquesSuperiores = function() {
  return this.bloquesSueltos().filter(Mila.Bloques.Bloque.esSuperior);
};

Mila.Bloques._Escritorio.prototype.CrearBloque_ = function(tipoBloque) {
  const nuevoBloque = this._blockly.newBlock(tipoBloque);
  nuevoBloque.initSvg();
  return nuevoBloque;
};

Mila.Tipo.Registrar({
  nombre:'EscritorioBloques',
  prototipo: Mila.Bloques._Escritorio,
  subtipoDe: Mila.Tipo.ElementoVisual
});

// TMP: -->

const tmpBloqueANodo = function(escritorio) { return function(bloque) {
  if (Mila.Tipo.esNada(bloque)) {
    return Mila.AST.nuevoNodo({
      tipoNodo: "Indefinido"
    });
  }
  switch (bloque.type) {
    case 'procedures_defnoreturn':
      return Mila.AST.nuevoNodo({
        tipoNodo: "DefiniciónProcedimiento",
        hijos: {
          nombre:Mila.AST.nuevoNodo({
            tipoNodo: "Identificador",
            campos: {identificador: bloque.getFieldValue('NAME')}
          }),
          cuerpo:stackAListaDeNodos(escritorio, bloque.getInput('STACK').connection)
        }
      });
    case 'controls_if':
      return Mila.AST.nuevoNodo({
        tipoNodo: "AlternativaCondicionalSimple",
        hijos: {
          condición:tmpBloqueANodo(escritorio)(bloque.getInputTargetBlock('IF0')),
          ramaPositiva:stackAListaDeNodos(escritorio, bloque.getInput('DO0').connection)
        }
      });
    case 'controls_repeat_ext':
      return Mila.AST.nuevoNodo({
        tipoNodo: "RepeticiónSimple",
        hijos: {
          cantidad:tmpBloqueANodo(escritorio)(bloque.getInputTargetBlock('TIMES')),
          cuerpo:stackAListaDeNodos(escritorio, bloque.getInput('DO').connection)
        }
      });
    case 'logic_operation':
      return Mila.AST.nuevoNodo({
        tipoNodo: "OperaciónBinariaLógica",
        campos: {clase:bloque.getFieldValue('OP') == "OR" ? "Disyunción" : "Conjunción"},
        hijos: {
          izquierdo:tmpBloqueANodo(escritorio)(bloque.getInputTargetBlock('A')),
          derecho:tmpBloqueANodo(escritorio)(bloque.getInputTargetBlock('B'))
        }
      });
    case 'math_arithmetic':
      return Mila.AST.nuevoNodo({
        tipoNodo: "OperaciónBinariaAritmética",
        campos: {clase:{
          'ADD':"+",
          'MINUS':"-",
          'MULTIPLY':".",
          'DIVIDE':"%",
          'POWER':"^"
        }[bloque.getFieldValue('OP')]},
        hijos: {
          izquierdo:tmpBloqueANodo(escritorio)(bloque.getInputTargetBlock('A')),
          derecho:tmpBloqueANodo(escritorio)(bloque.getInputTargetBlock('B'))
        }
      });
    case 'math_number':
      return Mila.AST.nuevoNodo({
        tipoNodo: "LiteralNúmero",
        campos: {valor: bloque.getFieldValue('NUM')}
      });
    case 'logic_boolean':
      return Mila.AST.nuevoNodo({
        tipoNodo: "LiteralBooleano",
        campos: {valor: bloque.getFieldValue('BOOL') == "TRUE" ? 'verdadero' : 'falso'}
      });
    case 'variables_get':
      return Mila.AST.nuevoNodo({
        tipoNodo: "Identificador",
        campos: {identificador: Blockly.Variables.getOrCreateVariablePackage(escritorio._blockly, bloque.getFieldValue('VAR')).name}
      });
  }
};};

const stackAListaDeNodos = function(escritorio, conexión) {
  let resultado = [];
  let conexiónActual = conexión;
  while (conexiónActual.isConnected()) {
    resultado.push(tmpBloqueANodo(escritorio)(conexiónActual.targetBlock()));
    conexiónActual = conexiónActual.targetBlock().nextConnection;
  }
  return resultado;
};

const tmpNodoABloque = function(escritorio) { return function(nodo) {
  return nodo.fold({
    DefiniciónProcedimiento: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('procedures_defnoreturn');
      const nombre = Blockly.Variables.getOrCreateVariablePackage(escritorio._blockly, hijos.nombre.getFieldValue('VAR')).name;
      nuevoBloque.setFieldValue(nombre, 'NAME');
      hijos.nombre.dispose();
      let últimaConexión = nuevoBloque.getInput("STACK").connection;
      for (let comando of hijos.cuerpo) {
        últimaConexión.connect(comando.previousConnection);
        últimaConexión = comando.nextConnection;
      }
      return nuevoBloque;
    },
    AlternativaCondicionalSimple: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('controls_if');
      conectarExpresión(nuevoBloque, "IF0", hijos.condición);
      let últimaConexión = nuevoBloque.getInput("DO0").connection;
      for (let comando of hijos.ramaPositiva) {
        últimaConexión.connect(comando.previousConnection);
        últimaConexión = comando.nextConnection;
      }
      return nuevoBloque;
    },
    RepeticiónSimple: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('controls_repeat_ext');
      conectarExpresión(nuevoBloque, "TIMES", hijos.cantidad);
      let últimaConexión = nuevoBloque.getInput("DO").connection;
      for (let comando of hijos.cuerpo) {
        últimaConexión.connect(comando.previousConnection);
        últimaConexión = comando.nextConnection;
      }
      return nuevoBloque;
    },
    OperaciónBinariaLógica: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('logic_operation');
      nuevoBloque.setFieldValue(nodo.clase() == "Disyunción" ? "OR" : "AND", "OP");
      conectarExpresión(nuevoBloque, "A", hijos.izquierdo);
      conectarExpresión(nuevoBloque, "B", hijos.derecho);
      return nuevoBloque;
    },
    OperaciónBinariaAritmética: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('math_arithmetic');
      nuevoBloque.setFieldValue({
        "+":'ADD',
        "-":'MINUS',
        ".":'MULTIPLY',
        "%":'DIVIDE',
        "^":'POWER'
      }[nodo.clase()], "OP");
      conectarExpresión(nuevoBloque, "A", hijos.izquierdo);
      conectarExpresión(nuevoBloque, "B", hijos.derecho);
      return nuevoBloque;
    },
    LiteralNúmero: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('math_number');
      nuevoBloque.setFieldValue(`${nodo.valor()}`, 'NUM');
      return nuevoBloque;
    },
    LiteralBooleano: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('logic_boolean');
      nuevoBloque.setFieldValue(`${nodo.valor()}`, 'BOOL');
      return nuevoBloque;
    },
    Identificador: function(nodo, hijos) {
      const nuevoBloque = escritorio.CrearBloque_('variables_get');
      const nuevaVariable = Blockly.Variables.getOrCreateVariablePackage(escritorio._blockly, null, nodo.identificador(), '');
      nuevoBloque.setFieldValue(nuevaVariable.getId(), 'VAR');
      return nuevoBloque;
    },
    Atómico: function(nodo, hijos) {
      return Mila.Nada;
    },
    Nodo: function(nodo, hijos) {
      return Mila.Nada;
    }
  });
};};

const conectarExpresión = function(bloque, input, expresión) {
  if (Mila.Tipo.esAlgo(expresión)) {
    bloque.getInput(input).connection.connect(expresión.outputConnection);
  }
};