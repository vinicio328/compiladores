(function() {
	'use strict';
	angular.module('compiladores').service('lenguaje', LenguajeService);
	
	LenguajeService.$inject = [];

	// Propiedades del lenguaje JS 
	function LenguajeService() {
		this.argumento = ",";
		this.propiedad = ".";
		this.abrirMetodo = "(";
		this.cerrarMetodo = ")";
		this.abrirBloque = "{";
		this.cerrarBloque = "}";
		this.asignador = ['=', '+=', '-='];
		this.separador = [';', ':', ',', '.', '+', '-', '/', '*', '=', '>', '<'];
		this.separadorCombinado = ['+', '-', '=', '>', '<'];
		this.operador = ['+', '-', '/', '*', '=', '>', '<', '>=', '<=', '==', '!=', '++', '+=', '-=', '--'];
		this.logical = ['&&', '||'];
		this.noToken = [',', '.'];
		this.literales = ['\'', '"'];
		this.finDeLinea = ';';
		this.comentarios = {
			single: "//",
			multiple: "/*",
			finalMultiple: "*/"
		};
		this.reservadas = ['break', 'case', 'class', 'catch', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'enum', 'implements', 'package', 'protected', 'static', 'interface', 'private', 'public', 'abstract', 'boolean', 'byte', 'char', 'double', 'final', 'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized', 'transient', 'volatile'];
		this.variable = ['let', 'var'];	
		this.expresionVariable = /[a-zA-Z_$][0-9a-zA-Z_$]*/;	
		this.if = ['if', '(', ')', '@identifier', '@valor', '@comparador', '{', '}', 'else', '@logico'];
	}
})();