Mila.Modulo({
  define:"Demo",
  usa:["$milascript/pantalla/todo", "milabloques"]
});

Demo.textoInicial = "Procedimiento mi primer procedimiento {\n  Si verdadero y falso {\n\n  }\n  Repetir cantidad de veces + 2 {\n\n  }\n}"

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
          "variables_get",
          "text_print"
        ]
      },{
        nombre:"Cajón 3",
        bloques:[
          "logic_operation",
          "math_arithmetic"
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
  const ast = Demo.escritorioBloques.bloquesSueltos();
  const texto = Mila.Bloques.Lenguaje.nodosATexto(ast);
  Demo.escritorioTexto.CambiarTextoA_(texto);
};

Demo.textoABloques = function() {
  const texto = Demo.escritorioTexto.texto();
  const ast = Mila.Bloques.Lenguaje.textoANodos(texto);
  Demo.escritorioBloques.CambiarBloquesA_(ast);
};