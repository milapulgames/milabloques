Mila.Modulo({
  define:"Mila.Bloques",
  usa:["/milascript/base","/milascript/ajustes"],
  usaJs: [
    "tmp/blockly_compressed",
    "tmp/blocks_compressed",
    "tmp/javascript_compressed",
    "tmp/es"
  ]
});

Mila.Bloques._definiciones = {};

Mila.alIniciar(function() {
  if (typeof Blockly === "undefined") {
    Blockly = Mila.entorno().universo.Blockly;
  }
});

Mila.Bloques.funcionAlteraCampo_ = function(campo) {
  return function(nuevoValor) {
    this.setFieldValue(nuevoValor, campo);
  };
};

Mila.Bloques.definicionMutador = function(atributos) {
  const ajustes = {};
  const mutaciones = {};
  for (let campo of Object.keys(atributos)) {
    ajustes[campo] = {};
    if ('tipo' in atributos[campo]) {
      ajustes[campo].tipo = atributos[campo].tipo;
    }
    if ('inicial' in atributos[campo]) {
      ajustes[campo].inicial = atributos[campo].inicial;
    }
    if ('funcion' in atributos[campo]) {
      mutaciones[campo] = atributos[campo].funcion
    }
  }
  return {
    ajustes: Mila.Ajustes.nuevo(ajustes),
    mutaciones
  };
};

Mila.Bloques.definicionEtiqueta = function() {
  return {"type":"field_label"};
};

Mila.Bloques.definicionDesplegable = function(opciones) {
  return {"type":"field_dropdown", "options":opciones.map(x=> [x,x])};
};

Mila.Bloques.definicionCuerpo = function() {
  return {"type":"input_statement"};
};

Mila.Bloques.nuevoEscritorio = function(atributos) {
  return new Mila.Bloques._Escritorio(atributos);
};

Mila.Bloques.DefinirBloque_ = function(atributos) {
  Mila.Bloques._definiciones[atributos.id] = atributos;
  const atributosBlockly = {
    type: atributos.id
  };
  if ('forma' in atributos) {
    if (atributos.forma == "Comando") {
      atributosBlockly.previousStatement = null;
      atributosBlockly.nextStatement = null;
    } else if (atributos.forma == "Expresion") {
      atributosBlockly.output = true;
    }
  }
  if ('estilo' in atributos) {
    atributosBlockly.style = atributos.estilo;
  }
  if ('texto' in atributos) {
    let fila = 0;
    for (let texto of atributos.texto.split("\n")) {
      let mensaje = texto;
      if ('campos' in atributos) {
        let i=1;
        atributosBlockly[`args${fila}`] = [];
        for (let campo of Object.keys(atributos.campos)) {
          if (mensaje.includes(`%{${campo}}`)) {
            let elemento = atributos.campos[campo];
            mensaje = mensaje.replace(`%{${campo}}`, `%${i}`);
            elemento.name = campo;
            atributosBlockly[`args${fila}`].push(elemento);
            i++;
          }
        }
      }
      atributosBlockly[`message${fila}`] = mensaje;
      fila++;
    }
  }
  if ('mutador' in atributos) {
    atributosBlockly.mutator = `mutador_${atributos.id}`;
    Mila.Bloques.DefinirMutador_Como_(`mutador_${atributos.id}`, atributos.mutador);
  }
  Blockly.defineBlocksWithJsonArray([atributosBlockly]);
  Mila.Bloques._bloquesPersonalizados.push(atributos.id);
};

Mila.Bloques.DefinirMutador_Como_ = function(nombre, mutador) {
  const ajustes = mutador.ajustes;
  const atributosBlockly = {
    Mutar:function() {
      for (let campo of Object.keys(mutador.mutaciones)) {
        if (this.ajustes.existe_(campo)) {
          mutador.mutaciones[campo].call(this, this.ajustes[campo]());
        }
      }
    },
    loadExtraState: function(nuevosAjustes) {
      for (let campo of Object.keys(nuevosAjustes)) {
        if (this.ajustes.existe_(campo)) {
          this.ajustes.Ajustar_A_(campo, nuevosAjustes[campo]);
        }
      }
      this.Mutar();
    },
    saveExtraState: function() {
      return this.ajustes.todos();
    }
  };
  const funcionBlockly = function() {
    this.ajustes = ajustes;
    this.Mutar();
  };
  Blockly.Extensions.registerMutator(nombre, atributosBlockly, funcionBlockly);
};

Mila.Bloques.variantesDe_ = function(id) {
  if ('variantes' in Mila.Bloques._definiciones[id]) {
    return Mila.Bloques._definiciones[id].variantes;
  }
  return [{}];
};

Mila.Bloques._Escritorio = function(atributos) {
  this.paleta = 'paleta' in atributos ? atributos.paleta : Mila.Bloques._paletaPorDefecto();
};

Mila.Bloques._Escritorio.prototype.PlasmarEnHtml = function(nodoMadre) {
  if (!('_nodoHtml' in this)) {
    this._nodoHtml = document.createElement('div');
    this._nodoHtml.style.border = 'solid 1px blue';
    this._nodoHtml.style.margin = '0';
    this._nodoHtml.style.padding = '0';
    this._nodoHtml.style.position = 'fixed';
    nodoMadre.appendChild(this._nodoHtml);
    this._blockly = Blockly.inject(this._nodoHtml, {
      toolbox: this.paleta
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

Mila.Bloques._bloquesPersonalizados = [];

Mila.Bloques._paletaPorDefecto = function() {
  return {
    "kind": "flyoutToolbox",
    "contents": Mila.Bloques._bloquesPersonalizados.map(id => {
      return Mila.Bloques.variantesDe_(id).map(variante => {
        return {"kind":"block","type":id,"extraState":variante};
    })}).flat()
  };
};

Mila._RegistrarModulo_("Mila.Bloques.Bloque");

Mila.alIniciar(function() {
  Mila.Tipo.Registrar({
    nombre: "Bloque",
    prototipo: Blockly.Block,
    es: "esUnBloque",
    strTipo: function() {
      return "Bloque";
    },
    strInstancia: function(objeto) {
      return "unBloque";
    }
  });
});

Mila.Bloques._Bloque = function(definicionBloque) {
  this._blockly = new Blockly.Block(/**/);
};

Mila.Bloques.Bloque.esSuperior = function(bloque) {
  return Mila.Tipo.esNada(bloque.outputConnection) && Mila.Tipo.esNada(bloque.previousConnection);
};