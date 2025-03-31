Mila.Modulo({
  define:"Mila.Bloques.Paleta",
  necesita:["$milascript/tipo"]
});

Mila.Bloques.Paleta.nuevaPaleta = function() {
  return new Mila.Bloques.Paleta._Paleta();
};

Mila.Bloques.Paleta._Paleta = function PaletaBloques() {};

Mila.Tipo.Registrar({
  nombre: "PaletaBloques",
  prototipo: Mila.Bloques.Paleta._Paleta,
  es: "esUnaPaletaBloques",
  strTipo: function() {
    return "PaletaBloques";
  },
  strInstancia: function(objeto) {
    return "unaPaletaBloques";
  }
});