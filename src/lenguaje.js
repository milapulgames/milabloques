Mila.Modulo({
  define:"Mila.Bloques.Lenguaje",
  necesita:["$pequescript/todo","$milascript/ast"]
});

const tt = Peque.Tokens.texto;
const ts = Peque.Tokens.salto();
const tid = Peque.Tokens.tokenIdentificador();

const o = Peque.Tokens.disyunción;
const opt = Peque.Tokens.opcional;
const rep = Peque.Tokens.kleene;
const tg = Peque.Tokens.agrupado;
const rec = Peque.Tokens.recursivo;

const P = function(tokens, nodo) {
  return Peque.Parser.Produccion.nueva({tokens, nodo});
};

Mila.Bloques.Lenguaje.configuración = {
  agrupadores: {
    COMANDO: "llavesConSalto",
    EXPRESIÓN: "paréntesis"
  },
  producciones: {
    EXPRESIÓN: [
      P(tg("EXPRESIÓN"),function(tokens) {
        return Peque.Parser.nodoExpresión(tokens[0].contenido());
      }),
      P([rec("EXPRESIÓN"),tt("y"),rec("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Conjunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([rec("EXPRESIÓN"),tt("o"),rec("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Disyunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([rec("EXPRESIÓN"),o([
        tt("+"),
        tt("-"),
        tt("."),
        tt("%"),
        tt("^")
      ]),rec("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaAritmética",
          campos: {clase:tokens[1].texto()},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([tt("no"),rec("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "NegaciónLógica",
          hijos: {operando:tokens[1]}
        });
      }),
      P(tid,function(tokens) {
        let n = Number.parseFloat(tokens[0].identificador());
        if (!isNaN(n)) {
          return Mila.AST.nuevoNodo({
            tipoNodo: "LiteralNúmero",
            campos: {valor:n}
          });
        }
        if (tokens[0].identificador() in booleanos) {
          return Mila.AST.nuevoNodo({
            tipoNodo: "LiteralBooleano",
            campos: {valor:booleanos[tokens[0].identificador()]}
          });
        }
        return tokens[0];
      })
    ],
    COMANDO: [
      P([tt("Si"),rec("EXPRESIÓN"),tg("COMANDO"),opt(ts),tt("Si"),tt("no"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalCompuesta",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2].contenido(), ramaNegativa:tokens[5]}
        });
      }),
      P([tt("Si"),rec("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalSimple",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2].contenido()}
        });
      }),
      P([tt("Repetir"),rec("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónSimple",
          hijos: {cantidad:tokens[1], cuerpo:tokens[2].contenido()}
        });
      }),
      P([o([tt("Mientras"),tt("Hasta")]),rec("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónCondicional",
          campos: {clase: tokens[0].texto()},
          hijos: {condición:tokens[1], cuerpo:tokens[2].contenido()}
        });
      }),
      P(tid,function(tokens) {
        return tokens[0];
      })
    ],
    DEFINICION: [
      P([tt("Procedimiento"),tid,tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "DefiniciónProcedimiento",
          hijos: {nombre:tokens[1], cuerpo:tokens[2].contenido()}
        });
      })
    ]
  }
};

Mila.alIniciar(function() {
  Mila.Bloques.Lenguaje.parser = Peque.Parser.nuevo(
    Peque.Parser.nuevaConfiguración(
      Mila.Bloques.Lenguaje.configuración
    )
  );
});

Mila.Bloques.Lenguaje.textoANodos = function(texto) {
  return Mila.Bloques.Lenguaje.parser.parsear(texto);
};

Mila.Bloques.Lenguaje.nodosATexto = function(ast) {
  return ast.transformados(function(n) {
    return tmpNodoATexto(n);
  }).join("\n\n");
};

// TMP: -->

const booleanos = {
  "cierto":"TRUE",
  "verdadero":"TRUE",
  "falso":"FALSE"
};

const tmpNodoATexto = function(nodo) {
  return nodo.fold({
    DefiniciónProcedimiento: function(nodo, hijos) {
      return `Procedimiento ${hijos.nombre} ${stackIndentado(hijos.cuerpo)}`;
    },
    AlternativaCondicionalSimple: function(nodo, hijos) {
      return `Si ${hijos.condición} ${stackIndentado(hijos.ramaPositiva)}`;
    },
    RepeticiónSimple: function(nodo, hijos) {
      return `Repetir ${hijos.cantidad} ${stackIndentado(hijos.cuerpo)}`;
    },
    OperaciónBinariaLógica: function(nodo, hijos) {
      return `${
        hijos.izquierdo
      } ${
        nodo.clase() == "Disyunción" ? "o" : "y"
      } ${
        hijos.derecho
      }`;
    },
    OperaciónBinariaAritmética: function(nodo, hijos) {
      return `${
        hijos.izquierdo
      } ${
        nodo.clase()
      } ${
        hijos.derecho
      }`;
    },
    LiteralNúmero: function(nodo, hijos) {
      return `${nodo.valor()}`;
    },
    LiteralBooleano: function(nodo, hijos) {
      return `${nodo.valor()}`;
    },
    Identificador: function(nodo, hijos) {
      return nodo.identificador();
    },
    Indefinido: function(nodo, hijos) {
      return '_';
    },
    Nodo: function(nodo, hijos) {
      return '';
    }
  });
};

const stackIndentado = function(listaDeTextos) {
  return `{\n  ${listaDeTextos.transformados(x=>x.replaceAll("\n", "\n  ")).join("\n  ")}\n}`;
};