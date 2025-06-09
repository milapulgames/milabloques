Mila.Modulo({
  define:"Mila.Bloques.Lenguaje",
  necesita:["$pequescript/todo","$milascript/ast"]
});

const tt = Peque.Tokens.texto;
const tl = Peque.Tokens.línea;
const ts = Peque.Tokens.salto;
const tiMas = Peque.Tokens.indentarMás;
const tiMenos = Peque.Tokens.indentarMenos;
const tn = Peque.Tokens.número;
const o = Peque.Tokens.disyunción;
const opt = Peque.Tokens.opcional;
const rep = Peque.Tokens.kleene;
const tv = Peque.Tokens.secuencia;
const tg = Peque.Tokens.grupo;

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
      P(tn(),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "LiteralNúmero",
          campos: {valor:tokens[0].n()}
        });
      }),
      P([tv("EXPRESIÓN"),tt("y"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Conjunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([tv("EXPRESIÓN"),tt("o"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "OperaciónBinariaLógica",
          campos: {clase:"Disyunción"},
          hijos: {izquierdo:tokens[0],derecho:tokens[2]}
        });
      }),
      P([tt("no"),tv("EXPRESIÓN")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "NegaciónLógica",
          hijos: {operando:tokens[1]}
        });
      }),
      P(tv("IDENTIFICADOR"),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "Identificador",
          campos: {identificador: tokens.map(Peque.Parser.textoOriginal).join(" ")}
        });
      })
    ],
    COMANDO: [
      P([tt("Si"),tv("EXPRESIÓN"),tg("COMANDO"),opt(ts()),tt("Si"),tt("no"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalCompuesta",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2], ramaNegativa:tokens[5]}
        });
      }),
      P([tt("Si"),tv("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "AlternativaCondicionalSimple",
          hijos: {condición:tokens[1], ramaPositiva:tokens[2]}
        });
      }),
      P([tt("Repetir"),tv("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónSimple",
          hijos: {cantidad:tokens[1], cuerpo:tokens[2]}
        });
      }),
      P([o([tt("Mientras"),tt("Hasta")]),tv("EXPRESIÓN"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "RepeticiónCondicional",
          campos: {clase: tokens[0].texto()},
          hijos: {condición:tokens[1], cuerpo:tokens[2]}
        });
      }),
      P(tv("IDENTIFICADOR"),function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "Identificador",
          campos: {identificador: tokens.map(Peque.Parser.textoOriginal).join(" ")}
        });
      })
    ],
    DEFINICION: [
      P([tt("Procedimiento"),tv("IDENTIFICADOR"),tg("COMANDO")],function(tokens) {
        return Mila.AST.nuevoNodo({
          tipoNodo: "DefiniciónProcedimiento",
          hijos: {nombre:tokens[1], cuerpo:tokens[2]}
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

Mila.Bloques.Lenguaje.textoABloques = function(texto) {
  const ast = Mila.Bloques.Lenguaje.parser.parsear(texto);
  return Mila.Bloques.Lenguaje.bloquesDesdeAST(ast);
};

Mila.Bloques.Lenguaje.bloquesATexto = function(listaDeBloques) {
  const ast = listaDeBloques.transformados(function(b) {
    return tmpBloqueANodo(b);
  });
  return Mila.Bloques.Lenguaje.textoDesdeAST(ast);
};

Mila.Bloques.Lenguaje.bloquesDesdeAST = function(ast) {
  return ast.transformados(function(n) {
    return tmpNodoABloque(n);
  });
};

Mila.Bloques.Lenguaje.textoDesdeAST = function(ast) {
  return ast.transformados(function(n) {
    return tmpNodoATexto(n);
  });
};

// TMP: -->

const tmpNodoATexto = function(nodo) {
  return nodo.fold({
    DefiniciónProcedimiento: function(nodo, hijos) {
      return `Procedimiento ${hijos.nombre} ${hijos.cuerpo}`;
    },
    AlternativaCondicionalSimple: function(nodo, hijos) {
      return `Si ${hijos.condición} ${hijos.ramaPositiva}`;
    },
    RepeticiónSimple: function(nodo, hijos) {
      return `Repetir ${hijos.cantidad} ${hijos.cuerpo}`;
    },
    LiteralNúmero: function(nodo, hijos) {
      return `${nodo.valor()}`;
    },
    Identificador: function(nodo, hijos) {
      return nodo.identificador();
    },
    Nodo: function(nodo, hijos) {
      return '';
    }
  });
};

const tmpBloqueANodo = function(bloque) {
  switch (bloque.type) {
    case 'procedures_defnoreturn':
      return Mila.AST.nuevoNodo({
        tipoNodo: "DefiniciónProcedimiento",
        hijos: {
          nombre:Mila.AST.nuevoNodo({
            tipoNodo: "Identificador",
            campos: {identificador: bloque.getFieldValue('NAME')}
          })/*,
          cuerpo:tmpBloqueANodo(bloque.getInputTargetBlock('STACK'))*/
        }
      });
    case 'controls_if':
      return Mila.AST.nuevoNodo({
        tipoNodo: "AlternativaCondicionalSimple"/*,
        hijos: {
          condición:tmpBloqueANodo(bloque.getInputTargetBlock('IF0')),
          ramaPositiva:tmpBloqueANodo(bloque.getInputTargetBlock('DO0'))
        }*/
      });
    case 'controls_repeat_ext':
      return Mila.AST.nuevoNodo({
        tipoNodo: "RepeticiónSimple"/*,
        hijos: {
          cantidad:tmpBloqueANodo(bloque.getInputTargetBlock('TIMES')),
          cuerpo:tmpBloqueANodo(bloque.getInputTargetBlock('DO'))
        }*/
      });
    case 'math_number':
      return Mila.AST.nuevoNodo({
        tipoNodo: "LiteralNúmero",
        campos: {valor: bloque.getFieldValue('NUM')}
      });
    case 'logic_boolean':
      return Mila.AST.nuevoNodo({
        tipoNodo: "Identificador",
        campos: {identificador: bloque.getFieldValue('BOOL')}
      });
  }
};

const tmpNodoABloque = function(nodo) {
  return nodo.fold({
    DefiniciónProcedimiento: function(nodo, hijos) {
      let nuevoBloque = new Blockly.Block('procedures_defnoreturn');
      return nuevoBloque;//`Si ${hijos.nombre} ${hijos.cuerpo}`;
    },
    AlternativaCondicionalSimple: function(nodo, hijos) {
      let nuevoBloque = new Blockly.Block('controls_if');
      //nuevoBloque.getInput();
      return nuevoBloque;//`Si ${hijos.condición} ${hijos.ramaPositiva}`;
    },
    RepeticiónSimple: function(nodo, hijos) {
      let nuevoBloque = new Blockly.Block('controls_repeat_ext');
      return nuevoBloque;//`Repetir ${hijos.cantidad} ${hijos.cuerpo}`;
    },
    LiteralNúmero: function(nodo, hijos) {
      let nuevoBloque = new Blockly.Block('math_number');
      nuevoBloque.setFieldValue(`${nodo.valor()}`, 'NUM');
      return nuevoBloque;
    },
    Identificador: function(nodo, hijos) {
      let nuevoBloque = new Blockly.Block('logic_boolean');
      return nuevoBloque;
    },
    Nodo: function(nodo, hijos) {
      return new Blockly.Block(/**/);
    }
  });
};