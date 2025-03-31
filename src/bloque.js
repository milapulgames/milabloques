Mila.Modulo({
  define:"Mila.Bloques.Bloque",
  necesita:["$milascript/tipo"],
  necesitaJs: [
    "tmp/blockly_compressed"
  ]
});

Mila.Bloques._Bloque = function Bloque(definicionBloque) {
  this._blockly = new Blockly.Block(/**/);
};

Mila.Bloques.Bloque.esSuperior = function(bloque) {
  return Mila.Tipo.esNada(bloque.outputConnection) && Mila.Tipo.esNada(bloque.previousConnection);
};

Mila.Tipo.Registrar({
  nombre: "Bloque",
  prototipo: Mila.Bloques._Bloque,
  es: "esUnBloque",
  strTipo: function() {
    return "Bloque";
  },
  strInstancia: function(objeto) {
    return "unBloque";
  }
});