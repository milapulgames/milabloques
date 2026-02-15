Mila.Modulo({
  define:"Mila.Bloques.Bloque",
  necesita:["$milascript/base"],
  necesitaJs: [
    "tmp/blockly_compressed"
  ]
});

Mila.Bloques._Bloque = function Bloque(definicionBloque) {
  this._blockly = new Blockly.Block(/**/); // Ojo: esto requiere un workspace y yo quiero representar un bloque independiente del workspace
};

Mila.Bloques.Bloque.esSuperior = function(bloque) {
  return Mila.Tipo.esNada(bloque._blockly.outputConnection) && Mila.Tipo.esNada(bloque._blockly.previousConnection);
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