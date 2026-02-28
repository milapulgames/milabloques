Mila.Modulo({
  define:"Demo",
  usa:["$milascript/pantalla/todo", "$milascript/navegador", "milabloques"]
});

Demo.demoTextoBloques = {
  textoInicial: "Procedimiento mi primer procedimiento {\n  Si verdadero y falso {\n\n  }\n  Repetir cantidad de veces + 2 {\n\n  }\n}",
  fPantalla: function() {
    Demo.demoTextoBloques.escritorioBloques = Mila.Bloques.nuevoEscritorio(Demo.demoTextoBloques.atributosOficina);
    Demo.demoTextoBloques.escritorioTexto = Mila.Pantalla.nuevaAreaTexto({texto:Demo.demoTextoBloques.textoInicial});
    return {elementos:[
      Mila.Pantalla.nuevoPanel({elementos:[
        Mila.Pantalla.nuevoBoton({
          texto:Mila.Idioma.traducciónDeClave_("DEMO_BloquesATexto"),
          funcion:Demo.demoTextoBloques.bloquesATexto
        }),
        Mila.Pantalla.nuevoBoton({
          texto:Mila.Idioma.traducciónDeClave_("DEMO_TextoABloques"),
          funcion:Demo.demoTextoBloques.textoABloques
        })
      ], alto:"Minimizar", disposicion:"Horizontal"}),
      Mila.Pantalla.nuevoPanel({elementos:[Demo.demoTextoBloques.escritorioBloques, Demo.demoTextoBloques.escritorioTexto],
        disposicion:"Horizontal"
      })
    ]};
  },
  atributosOficina: {
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
  },
  bloquesATexto: function() {
    const ast = Demo.demoTextoBloques.escritorioBloques.bloquesSueltos();
    const texto = Mila.Bloques.Lenguaje.nodosATexto(ast);
    Demo.demoTextoBloques.escritorioTexto.CambiarTextoA_(texto);
  },
  textoABloques: function() {
    const texto = Demo.demoTextoBloques.escritorioTexto.texto();
    const ast = Mila.Bloques.Lenguaje.textoANodos(texto);
    Demo.demoTextoBloques.escritorioBloques.CambiarBloquesA_(ast);
  }
};

Demo.todasLasDemos = {
  "textoBloques":Demo.demoTextoBloques
};

Demo.demosCargadas = {};

Mila.alIniciar(function() {
  Demo.InicializarIdiomaYLuego_(function() {
    Demo.DeclararErrores();

    const cargarPantallaInicial = function() {
      const demoInicial = Mila.Navegador.argumentoUrl('d');
      if (demoInicial.esAlgo()) {
        if (Demo.existeDemo_(demoInicial)) {
          Demo.CargarPantallaDemo_(demoInicial);
        } else {
          Mila.Fallar(Mila.Error.deDemoInexistente(demoInicial));
        }
      } else {
        Demo.CargarPantallaInicial();
      }
    };

    const idioma = Mila.Navegador.argumentoUrl('i');
    if (idioma.esAlgo()) {
      Mila.Idioma.Seleccionar_YLuego_(idioma, cargarPantallaInicial);
    } else {
      cargarPantallaInicial();
    }
  });
});

Demo.CargarPantallaInicial = function() {
  Mila.Pantalla.nueva({elementos:Demo.todasLasDemos.clavesDefinidas().map(
    demo => Mila.Pantalla.nuevoBoton({texto:demo, funcion:() => Demo.CargarPantallaDemo_(demo)})
  ).cons(Mila.Pantalla.nuevaEtiqueta({
    texto:Mila.Idioma.traducciónDeClave_("DEMO_ElegirDemo")
  }))}, 'inicio');
};

Demo.CargarPantallaDemo_ = function(nombreDemo) {
  const nombrePantalla = `demo_${nombreDemo}`;
  if (!(nombreDemo in Demo.demosCargadas)) {
    Mila.Pantalla.nueva(Demo.todasLasDemos[nombreDemo].fPantalla(), nombrePantalla);
    Demo.demosCargadas = {
      nombrePantalla
    };
  }
  Mila.Pantalla.CambiarA_(nombrePantalla);
};

Demo.existeDemo_ = function(nombreDemo) {
  return nombreDemo in Demo.todasLasDemos;
};

Demo.InicializarIdiomaYLuego_ = function(función) {
  const contador = {k:3};
  const decrementarContador = function() {
    contador.k --;
    if (contador.k == 0) {
      función();
    }
  };
  Mila.Idioma.InicializarYLuego_(decrementarContador);
  Mila.Idioma.AgregarDirectorio_YLuego_(Mila.Archivo.rutaAPartirDe_(['msg']), decrementarContador, "DEMO");
  Mila.Idioma.AgregarDirectorio_YLuego_(Mila.Archivo.rutaAPartirDe_(['msg','error']), decrementarContador, "ERROR");
};

Demo.DeclararErrores = function() {
  Mila.Error.Declarar('DemoInexistente', 'deDemoInexistente', [
    ['nombreDemo']
  ]);
};