Mila.Modulo({
  define:"Mila.Bloques.Catalogo",
  necesita:["$milascript/base"],
  usa:"$milascript/ajustes"
});

Mila.Bloques.Catalogo._definiciones = {};
Mila.Bloques.Catalogo._bloquesPersonalizados = [];

Mila.Bloques.Catalogo.aPartirDe_ = function(definicionCatalogo) {
  const nuevoCatalogo = new Mila.Bloques.Catalogo._Catalogo();
  if ('nombre' in definicionCatalogo) {
    nuevoCatalogo.CambiarNombreA_(definicionCatalogo.nombre);
  }
  if ('cajones' in definicionCatalogo) {
    nuevoCatalogo.CambiarCajonesA_(definicionCatalogo.cajones.map(Mila.Bloques.Catalogo.aPartirDe_));
  }
  if ('bloques' in definicionCatalogo) {
    nuevoCatalogo.CambiarBloquesA_(definicionCatalogo.bloques);
  }
  return nuevoCatalogo;
};

Mila.Bloques.Catalogo._Catalogo = function CatalogoBloques() {};

Mila.Bloques.Catalogo._Catalogo.prototype.tieneCajones = function() {
  return '_cajones' in this;
};

Mila.Bloques.Catalogo._Catalogo.prototype.tieneBloques = function() {
  return '_bloques' in this;
};

Mila.Bloques.Catalogo._Catalogo.prototype.cajones = function() {
  return this.tieneCajones() ? this._cajones : [];
};

Mila.Bloques.Catalogo._Catalogo.prototype.bloques = function() {
  return this.tieneBloques() ? this._bloques : [];
};

Mila.Bloques.Catalogo._Catalogo.prototype.nombre = function() {
  return '_nombre' in this ? this._nombre : Mila.Nada;
};

Mila.Bloques.Catalogo._Catalogo.prototype.CambiarCajonesA_ = function(nuevosCajones) {
  this._cajones = nuevosCajones;
};

Mila.Bloques.Catalogo._Catalogo.prototype.CambiarBloquesA_ = function(nuevosBloques) {
  this._bloques = nuevosBloques;
};

Mila.Bloques.Catalogo._Catalogo.prototype.CambiarNombreA_ = function(nuevoNombre) {
  this._nombre = nuevoNombre;
};

Mila.Tipo.Registrar({
  nombre: "CatalogoBloques",
  prototipo: Mila.Bloques.Catalogo._Catalogo,
  es: "esUnCatalogoBloques",
  strTipo: function() {
    return "CatalogoBloques";
  },
  strInstancia: function(objeto) {
    return "unCatalogoBloques";
  }
});

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
  Mila.Bloques.Catalogo._bloquesPersonalizados.push(atributos.id);
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
    this.ajustes = Mila.Ajustes.nuevo(ajustes);
    this.Mutar();
  };
  Blockly.Extensions.registerMutator(nombre, atributosBlockly, funcionBlockly);
};

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
    ajustes,
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

Mila.Bloques.variantesDe_ = function(id) {
  if ('variantes' in Mila.Bloques._definiciones[id]) {
    return Mila.Bloques._definiciones[id].variantes;
  }
  return [{}];
};