(function() {
    'use strict';
    angular.module('compiladores', ['ui', 'ngSanitize']);

    // Controlador del editor
    angular.module('compiladores').controller('EditorController', EditorController);
    EditorController.$inject = ['$scope', '$filter', 'lenguaje', 'fileReader'];
    function EditorController($scope, $filter, lenguaje,fileReader) {
        // vm controlador, en lugar de this, para evitar conflictos de scope 
        var vm = this;
        // declarar variables del controlador
        vm.tokens = [];
        vm.simbolos = [];
        vm.lenguaje = "js";
        vm.codigo = ""; // codigo pegado en el text-area
        vm.erroresSintacticos = [];
        vm.datosSemanticos = [];
        vm.CambioEnEditor = function CambioEnEditor() {

            vm.simbolos = [];
            var arrayDeLineas = vm.codigo.split("\n");
            if (arrayDeLineas != null) {
                vm.tokens = procesarLineas(arrayDeLineas, vm.simbolos);
            }
        }
        
        // Algoritmo izquierda a derecha, separar tokens linea por linea
        function procesarLineas(lineas, simbolos)
        {
            var lineasProcesadas = [];

            // ir linea por linea 
            for (var indiceDeLinea = 0; indiceDeLinea < lineas.length; indiceDeLinea++)
            {
                var lineaActual = lineas[indiceDeLinea];

                // los tokens de la linea actual 
                var tokensLineaActual = [];
                var tokenActual = "";

                // variables para controlar tokens 
                var token = new Token();
                var tokenPrevio = new Token();

                // variables para controlar que venia antes del caracter
                var estoyLeyendoString = false;
                var vienedeOperador = false;


                // ir caracter por caracter en la linea hasta encontrar un separador 
                for (var indiceCaracter = 0; indiceCaracter < lineaActual.length; indiceCaracter++)
                {
                    var caracterActual = lineaActual[indiceCaracter];

                    // identificar si estoy leyendo un string 
                    if (lenguaje.literales.includes(caracterActual))
                    {
                        // verificar si encuentro el final 
                        if (estoyLeyendoString)
                        {
                            tokenActual += caracterActual;
                            
                            // construir el token 
                            token.texto = tokenActual;
                            token.esString = true;
                            token.fila = indiceDeLinea;

                            tokensLineaActual.push(token);

                            // asignar token previo el token que acabo de terminar de leer
                            tokenPrevio = token;

                            // resetear varaibles
                            tokenActual = "";
                            estoyLeyendoString = false;
                            token = new Token();
                            vienedeOperador = false;

                            continue;
                        }
                        else 
                        {
                            estoyLeyendoString = true;
                        }                        
                    }

                    // si estamos leyendo un string no importa el contenido 
                    if (estoyLeyendoString)
                    {
                        tokenActual += caracterActual;
                        continue;
                    }

                    // no agregar espacios en blanco 
                    if (/\s/.test(caracterActual)) {
                        if (tokenActual.length > 0)
                        {
                            token.texto = tokenActual;
                            token.fila = indiceDeLinea;

                            // evaluar el token para ver si es una asignacion
                            if (lenguaje.asignador.includes(token.texto))
                            {
                                token.esAsignador = true;
                            }

                            tokensLineaActual.push(token);

                            // asignar token previo el token que acabo de terminar de leer
                            tokenPrevio = token;

                            // resetear varaibles
                            tokenActual = "";
                            estoyLeyendoString = false;
                            token = new Token();
                            vienedeOperador = false;                            
                        }  
                        else 
                        {
                            continue;
                        }
                    }
                    else 
                    {
                        // verificar comentarios
                        // solo comentarios simples 
                        if (/\//.test(caracterActual))
                        {
                            // obtener el siguiente caracter
                            var siguienteCaracter = lineaActual[indiceCaracter + 1];
                            if (/\//.test(siguienteCaracter))
                            {
                                // dos barras significa comentario
                                if (tokenActual.length > 0)
                                {
                                    token.texto = tokenActual;
                                    token.fila = indiceDeLinea;

                                    // evaluar el token para ver si es una asignacion
                                    if (lenguaje.asignador.includes(token.texto))
                                    {
                                        token.esAsignador = true;
                                    }

                                    tokensLineaActual.push(token);
                                    
                                    // asignar token previo el token que acabo de terminar de leer
                                    tokenPrevio = token;

                                    // resetear varaibles
                                    tokenActual = "";
                                    estoyLeyendoString = false;
                                    token = new Token();
                                    vienedeOperador = false; 
                                }

                                // no leer nada mas en la linea 
                                break; 
                            }
                        }

                        // evaluar si hay separadores 
                        if (lenguaje.separador.includes(caracterActual))
                        {
                            // evaluar si es una clase 
                            if (caracterActual == lenguaje.propiedad)
                            {
                                token.esClase = true;
                            }    

                            // evaluar si es un argumento
                            if (caracterActual == lenguaje.argumento)
                            {
                                token.esArgumento = true;
                            }

                            if (!vienedeOperador && tokenActual.length > 0)
                            {
                                // Verificar numeros decimales como 33.5
                                if (!isNaN(tokenActual) && caracterActual == lenguaje.propiedad) {
                                    tokenActual += caracterActual;
                                    token.esClase = false;
                                    continue; // continuar ya que estoy avaluando un numero y puede que venga otro numero despues del punto
                                }

                                token.texto = tokenActual;
                                token.fila = indiceDeLinea;

                                tokensLineaActual.push(token);
                                
                                // asignar token previo el token que acabo de terminar de leer
                                tokenPrevio = token;

                                // resetear varaibles
                                tokenActual = "";
                                estoyLeyendoString = false;
                                token = new Token();
                                vienedeOperador = false; 
                            }

                            // Controlar separadores combinados como -=, +=, >=
                            if (lenguaje.separadorCombinado.includes(caracterActual))
                            {
                                tokenActual += caracterActual;
                                vienedeOperador = true;
                            }
                            else 
                            {
                                // Verificar si hay un token antes del separador, de ser asi agregarlo a la lista de tokens
                                if (tokenActual.length > 0)
                                {
                                    token.texto = tokenActual;
                                    token.fila = indiceDeLinea;
    
                                    tokensLineaActual.push(token);
                                    
                                    // asignar token previo el token que acabo de terminar de leer
                                    tokenPrevio = token;
    
                                    // resetear varaibles
                                    tokenActual = "";
                                    token = new Token();
                                }    

                                // Agregar siempre el caracter actual como un token
                                token.texto = caracterActual;
                                token.fila = indiceDeLinea;

                                tokensLineaActual.push(token);
                                
                                // asignar token previo el token que acabo de terminar de leer
                                tokenPrevio = token;

                                // resetear varaibles
                                tokenActual = "";
                                token = new Token();
                                vienedeOperador = false;                         
                            } 
                            
                            if (lenguaje.asignador.includes(tokenPrevio.texto))
                            {
                                tokenPrevio.esAsignador = true;
                            }
                        }                        
                        else 
                        {
                            // si lo que vania antes era un operador como +, -, = tenemos que guardarlo como token
                            if (vienedeOperador)
                            {
                                token.texto = tokenActual;
                                token.fila = indiceDeLinea;

                                // evaluar el token para ver si es una asignacion
                                if (lenguaje.asignador.includes(token.texto))
                                {
                                    token.esAsignador = true;
                                }

                                tokensLineaActual.push(token);
                                
                                // asignar token previo el token que acabo de terminar de leer
                                tokenPrevio = token;

                                // resetear varaibles
                                tokenActual = "";
                                estoyLeyendoString = false;
                                token = new Token();
                                vienedeOperador = false; 
                            }

                            // verificar si son caracteres de agrupacion
                            if(caracterActual == lenguaje.abrirMetodo || caracterActual == lenguaje.cerrarMetodo 
                                || caracterActual == lenguaje.abrirBloque || caracterActual == lenguaje.cerrarBloque)
                            {
                                // si hay un token antes de los caracters de agrupacion, meterlo a la lista
                                if (tokenActual.length > 0)
                                {
                                    token.texto = tokenActual;
                                    token.fila = indiceDeLinea;
                                    
                                    if (caracterActual == lenguaje.abrirMetodo)
                                    {
                                        token.esMetodo = true;  
                                    }
                                    else if (caracterActual == lenguaje.cerrarMetodo)
                                    {
                                        token.esArgumento = true;
                                    }

                                    tokensLineaActual.push(token);
                                    
                                    // asignar token previo el token que acabo de terminar de leer
                                    tokenPrevio = token;
    
                                    // resetear varaibles
                                    tokenActual = "";
                                    token = new Token();
                                }    

                                // Agregar siempre el caracter actual como un token
                                token.texto = caracterActual;
                                token.fila = indiceDeLinea;

                                tokensLineaActual.push(token);
                                
                                // asignar token previo el token que acabo de terminar de leer
                                tokenPrevio = token;

                                // resetear varaibles
                                tokenActual = "";
                                token = new Token();
                                vienedeOperador = false;                     
                            } 
                            else
                            {
                                tokenActual += caracterActual;
                                vienedeOperador = false;
                            }
                        }
                    }
                }

                // Agregar el token al array si es el token final, ya que no hay ningun separador final
                if (tokenActual.length > 0)
                {
                    token.texto = tokenActual;
                    token.fila = indiceDeLinea;

                    // evaluar el token para ver si es una asignacion
                    if (lenguaje.asignador.includes(token.texto))
                    {
                        token.esAsignador = true;
                    }

                    tokensLineaActual.push(token);
                    
                    // asignar token previo el token que acabo de terminar de leer
                    tokenPrevio = token;

                    // resetear varaibles
                    tokenActual = "";
                    estoyLeyendoString = false;
                    token = new Token();
                    vienedeOperador = false;                   
                }

                let linea =
                {
                    validaSintacticas: false,
                    texto: ProcesarTokens(tokensLineaActual, simbolos),
                    tokens: tokensLineaActual
                }
                lineasProcesadas.push(linea);
            }
            console.log(lineasProcesadas);
            return lineasProcesadas;
        }

        // Funcion para clasificar tokens
        function ProcesarTokens(tokens, simbolos)
        {

        }

        function JoinTokens(tokens) {
            let text = "";
            tokens.forEach(function(token, index) {
                text += token.text + " ";
            });
            return text;
        }
         
        // Codigo para recibir el archivo de la interfaz
        // Uso de scope porque se usa desde la directiva
        $scope.getFile = function() {
            $scope.progress = 0;
            fileReader.readAsText($scope.file, $scope).then(function(result) {
                vm.codigo = result;
            });
        };
        $scope.$on("fileProgress", function(e, progress) {
            $scope.progress = progress.loaded / progress.total;
        });  
    }

    // Codigo para cargar los documentos     
    var fileReader = function($q, $log) {
        var onLoad = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.resolve(reader.result);
                });
            };
        };
        var onError = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.reject(reader.result);
                });
            };
        };
        var onProgress = function(reader, scope) {
            return function(event) {
                scope.$broadcast("fileProgress", {
                    total: event.total,
                    loaded: event.loaded
                });
            };
        };
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
        var readAsText = function(file, scope) {
            var deferred = $q.defer();
            var reader = getReader(deferred, scope);
            reader.readAsText(file);
            return deferred.promise;
        };
        return {
            readAsText: readAsText
        };
    };
    angular.module('compiladores').factory("fileReader", ["$q", "$log", fileReader]);
    
    // Control de seleccion de archivo
    angular.module('compiladores').directive("ngFileSelect", function() {
        return {
            template: '<input type="file" id="selectedFile" style="display: none;" />' + '<ng-transclude></ng-transclude>',
            transclude: true,
            link: function($scope, el) {
                el.bind("change", function(e) {
                    $scope.file = (e.srcElement || e.target).files[0];
                    $scope.getFile();
                })
            }
        }
    });

    angular.module('compiladores').value('ui.config', {
        codemirror: {
            mode: 'text/js',
            lineNumbers: true
        }
    });

    class Token {
        texto = "";
        esVariable = true;
        esReservado = false;
        esClase = false;
        esPropiedad = false;
        esArgumento = false;
        esMetodo = false;
        esAsignador = false;
        esOperador = false;
        esLogico = false;
        esSimbolo = false;
        esBool = false;
        esString = false;
        esUnknown = false;
        esNumero = false;
        valor = "";
        fila = 0;
        noConvertir = false;
        forzarNumero = false;
    }

    class Simbolo {
        nombre = "";
        linea = "";
        valor = "";
    }
})();