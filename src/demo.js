Mila.Modulo({
  define:"Demo",
  usa:["$milascript/pantalla/todo", "milabloques"]
});

Demo.textoInicial = "Procedimiento mi primer procedimiento {\n  Si 2 {\n    hola\n  }\n}"

Mila.alIniciar(function() {
  Demo.escritorioBloques = Mila.Bloques.nuevoEscritorio({
    catalogo:{
      cajones:[{
        nombre:"Cajón 1",
        bloques:[
          "controls_if",
          "controls_repeat_ext",
          "procedures_defnoreturn"
        ]
      },{
        nombre:"Cajón 2",
        bloques:[
          "math_number",
          "logic_boolean",
          "text_print"
        ]
      }]
    }
  });
  // Mila.Pantalla.nueva({elementos:Demo.escritorioBloques});
  Demo.escritorioTexto = Mila.Pantalla.nuevaAreaTexto({texto:Demo.textoInicial});
  Mila.Pantalla.nueva({elementos:[
    Mila.Pantalla.nuevoPanel({elementos:[
      Mila.Pantalla.nuevoBoton({texto:"Bloques a texto", funcion:Demo.bloquesATexto}),
      Mila.Pantalla.nuevoBoton({texto:"Texto a bloques", funcion:Demo.textoABloques})
    ], alto:"Minimizar", disposicion:"Horizontal"}),
    Mila.Pantalla.nuevoPanel({elementos:[Demo.escritorioBloques, Demo.escritorioTexto],
      disposicion:"Horizontal"
    })
  ]});
});

Demo.bloquesATexto = function() {
  const listaDeBloques = Demo.escritorioBloques.bloquesSueltos();
  const texto = Mila.Bloques.Lenguaje.bloquesATexto(listaDeBloques);
  Demo.escritorioTexto.CambiarTextoA_(texto);
};

Demo.textoABloques = function() {
  const texto = Demo.escritorioTexto.texto();
  const listaDeBloques = Mila.Bloques.Lenguaje.textoABloques(texto);
  Demo.escritorioBloques.CambiarBloquesA_(listaDeBloques);
};