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
            //var arrayDeLineas = vm.codigo.match(/[^\r\n]+/g);
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
                var esSeparador = false;
                var esToken = false;
                var tokenActual = "";

                // ir caracter por caracter en la linea hasta encontrar un separador 
                for (var indiceCaracter = 0; indiceCaracter < lineaActual.length; indiceCaracter++)
                {
                    var caracterActual = lineaActual[indiceCaracter];

                    // no agregar espacios en blanco 
                    if (/\s/.test(caracterActual)) {
                        continue;                        
                        // TODO agregar logica extra
                    }
                    else {
                        // evaluar si hay separadores 
                        if (lenguaje.separador.includes(caracterActual))
                        {
                            if (tokenActual.length > 0)
                            {
                                tokensLineaActual.push(tokenActual);
                                tokenActual = "";
                            }                            
                        }
                        else 
                        {
                            tokenActual += caracterActual;
                        }
                    }
                }

                // Agregar el token al array si es el token final, ya que no hay ningun separador final
                if (tokenActual.length > 0)
                {
                    tokensLineaActual.push(tokenActual);
                    tokenActual = "";                    
                }

                lineasProcesadas.push(tokensLineaActual);
            }
            console.log(lineasProcesadas);
            return lineasProcesadas;
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
        text = "";
        isVariable = true;
        isReserved = false;
        isClass = false;
        isProperty = false;
        isArgument = false;
        isMethod = false;
        isAssign = false;
        isOperator = false;
        isLogical = false;
        isSimbol = false;
        isBool = false;
        isString = false;
        isUnknown = false;
        isNumber = false;
        value = "";
        fila = 0;
        noConvert = false;
        forceNumber = false;
    }
    class Simbolo {
        nombre = "";
        linea = "";
        valor = "";
    }
    class Error {
        linea = 0
        posicion = 0;
        error = "";
        tipo = "";
    }
    class SimboloSemantico {
        nombre = "";
        linea = 0;
        valor = "";
        apariciones = [];
        valido = true;
        mensaje = "";
        tipo = "";
    }
})();