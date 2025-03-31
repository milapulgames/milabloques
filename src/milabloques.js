Mila.Modulo({
  define:"Mila.Bloques",
  usa:"todo",
  usaJs: [
    "tmp/blockly_compressed",
    "tmp/blocks_compressed",
    "tmp/javascript_compressed",
    "tmp/es"
  ]
});

Mila.alIniciar(function() {
  if (typeof Blockly === "undefined") {
    Blockly = Mila.entorno().universo.Blockly;
  }
});

Mila.Bloques.Catalogo._porDefecto = function() {
  return Mila.Bloques.Catalogo.aPartirDe_({bloques:["math_number","logic_boolean"]});
  // return {
  //   "kind": "flyoutToolbox",
  //   "contents": Mila.Bloques.Catalogo._bloquesPersonalizados.map(id => {
  //     return Mila.Bloques.variantesDe_(id).map(variante => {
  //       return {"kind":"block","type":id,"extraState":variante};
  //   })}).flat()
  // };
};