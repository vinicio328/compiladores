
(function() {
	'use strict';
	angular.module('compiladores').service('automata', AutomataService);
	// no se inyecta el vm porque no lo necesitamos
	AutomataService.$inject = ['$filter'];

	function AutomataService($filter) {
		var service = this;

        service.validarAsigancion = function(tokens)
        {
            var indiceDeToken = 0; // obtener el token siguiente
            var primerToken = tokens[indiceDeToken];
            var convertido = obtenerConvertido(primerToken);
            // Validar primero si viene el tipo de dato o identificador
            if (convertido == "@var" || convertido == "@identifier") 
            {
                if (convertido == "@var")
                {
                    indiceDeToken++;
                    let identificador = tokens[indiceDeToken];
                    convertido = obtenerConvertido(identificador);
                    // Luego tiene que venir un nombre de variable
                    if (convertido != "@identifier")
                    {
                        return false;
                    }
                }

                indiceDeToken++;
                let asignador = tokens[indiceDeToken];
                convertido = obtenerConvertido(asignador);
                // Luego tiene que venir un sibolo de asignacion o fin de linea
                if (convertido == "@asignador" || convertido == ';')
                {
                    if (convertido == ';')
                    {
                        return true;                        
                    }

                    indiceDeToken++;
                    let valor = tokens[indiceDeToken];
                    convertido = obtenerConvertido(valor);
                    
                    // Luego tiene que venir un valor cualquiera o una variable
                    if (convertido == "@valor" || convertido == "@identifier")
                    {
                        indiceDeToken++;
                        let fin = tokens[indiceDeToken];
                        convertido = obtenerConvertido(fin);

                        // Por ultimo un fin de linea
                        if (convertido == ';')
                        {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        service.validarIf = function(tokens)
        {
            var indiceDeToken = 0; // obtener el token siguiente
            var primerToken = tokens[indiceDeToken];
            var convertido = obtenerConvertido(primerToken);
            if (convertido == "if")
            {
                indiceDeToken++;
                let abrirCondicion = tokens[indiceDeToken];
                convertido = obtenerConvertido(abrirCondicion);
                if (convertido == "(") 
                {
                    indiceDeToken++;
                    //let predicado = tokens.slice(indiceDeToken, tokens.length - 1);
                    let estadoActual =  {
                        indiceDeToken: indiceDeToken
                    };
                    let predicadoValido = validarPredicado(tokens, estadoActual);
                    
                    if (predicadoValido)
                    {
                        indiceDeToken = estadoActual.indiceDeToken;

                        indiceDeToken++;
                        let llaveAbierta = tokens[indiceDeToken];
                        convertido = obtenerConvertido(llaveAbierta);

                        if (convertido == "{")
                        {
                            indiceDeToken++;
                            let llaveCerrada = tokens[indiceDeToken];
                            convertido = obtenerConvertido(llaveCerrada);
                            if (convertido == "}") 
                            {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        function validarPredicado(tokens, estadoActual) 
        {
            let indiceDeToken = estadoActual.indiceDeToken;
            let primeraParte = tokens[indiceDeToken];            
            let convertido = obtenerConvertido(primeraParte);
            if (convertido == "@valor" || convertido == "@identifier")
            {
                indiceDeToken++;
                let comparador = tokens[indiceDeToken];
                convertido = obtenerConvertido(comparador);
                if (convertido == "@comparador")
                {
                    indiceDeToken++;
                    let segundaParte = tokens[indiceDeToken];
                    convertido = obtenerConvertido(segundaParte);
                    if (convertido == "@valor" || convertido == "@identifier")
                    {
                        indiceDeToken++;
                        let cierre = tokens[indiceDeToken];
                        convertido = obtenerConvertido(cierre);
                        if (convertido == ")")
                        {
                            estadoActual.indiceDeToken = indiceDeToken;
                            return true;
                        }
                        else if (convertido == "@logico")
                        {
                            indiceDeToken++;
                            //let predicado = tokens.slice(indiceDeToken, tokens.length - 1);
                            estadoActual.indiceDeToken = indiceDeToken;
                            return validarPredicado(tokens, estadoActual);
                        }

                    }
                }
            }
            estadoActual.indiceDeToken = indiceDeToken;
            return false;
        }

        // Convertir el token a un valor generico para no tener tantas opciones al evaluar el automata
        function obtenerConvertido(token) {
            if (token == undefined)
            {
                return "null";
            }

			if (token.noConvertir) {
				return token.texto;
			}

			if (token.texto == ';') {
				return ';';
			}

			if (token.esReservado) {
				return "@var";
			}
			else if (token.esString || token.esBool || token.esNumero) {
				if (token.forzarNumero) {
					return '@number';
				}
				if (token.forzarBool) {
					return '@bool';
				}
				return '@valor';
			}
			else if (token.esVariable) {
				return "@identifier";
			}
			else if (token.esAsignador) {
				return '@asignador';
			}        	
			else if (token.esLogico) {
				return '@logico';
			}
			else if (token.esOperador) {
				return '@comparador';
			}
			else if (token.esSimbolo) {
				return '@fin';
			}
			else if (token.esUnknown) {
				return '@unknown';
			}
		}
    }
})();